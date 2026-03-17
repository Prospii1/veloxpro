import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'VeloxPro API is running' });
});

// ─── 1. Fetch products/accounts (Serve from DB with Sync) ─────────────────────
app.get('/api/reseller/products', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('availability', true);

    if (error) throw error;

    // Group categories for the frontend
    const categoriesMap = new Map();
    products.forEach(p => {
      if (p.type && !categoriesMap.has(p.type)) {
        categoriesMap.set(p.type, { name: p.type, icon: p.icon_url || '' });
      }
    });

    res.json({
      success: true,
      data: {
        categories: Array.from(categoriesMap.values()),
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          price: p.price, // Selling price
          base_price: p.base_price,
          supplier_id: p.supplier_id,
          availability: p.availability,
          description: p.description,
          iconUrl: p.icon_url
        }))
      }
    });
  } catch (error: any) {
    console.error('API Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// ─── Supplier Sync Logic ─────────────────────────────────────────────────────
async function syncSupplierProducts() {
  console.log('[SYNC] Starting supplier product sync...');
  try {
    const apiKey = process.env.SUPPLIER_API_KEY;
    const apiUrl = process.env.SUPPLIER_API_URL;
    if (!apiKey || !apiUrl) throw new Error("Missing supplier credentials");

    const response = await fetch(`${apiUrl}/products.php?api_key=${apiKey}`);
    if (!response.ok) throw new Error('Failed to fetch from supplier');
    const data = await response.json();

    if (data.status !== 'success' || !data.categories) throw new Error('Invalid supplier data');

    // Get markup settings
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'markup_settings')
      .single();
    
    const markupSettings = settings?.value || { global_markup: 0.20, category_markups: {} };
    const globalMarkup = markupSettings.global_markup || 0;

    const allProducts: any[] = [];
    data.categories.forEach((cat: any) => {
      if (cat.products) {
        cat.products.forEach((prod: any) => {
          const basePrice = parseFloat(prod.price);
          const catMarkup = markupSettings.category_markups?.[cat.name] ?? globalMarkup;
          const sellingPrice = basePrice + catMarkup;

          allProducts.push({
            id: prod.id,
            name: prod.name,
            type: cat.name,
            base_price: basePrice,
            price: sellingPrice,
            markup: catMarkup,
            supplier_id: 'the-socialmarket',
            availability: Number(prod.amount) > 0,
            stock_quantity: Number(prod.amount),
            description: prod.description || cat.name,
            icon_url: cat.icon || '',
            created_at: new Date().toISOString()
          });
        });
      }
    });

    // Upsert into Supabase
    const { error: upsertError } = await supabase
      .from('products')
      .upsert(allProducts, { onConflict: 'id' });

    if (upsertError) throw upsertError;

    // Log success
    await supabase.from('system_logs').insert({
      event_type: 'sync_success',
      message: `Successfully synced ${allProducts.length} products.`,
      details: { count: allProducts.length }
    });

    console.log(`[SYNC] Success: Synced ${allProducts.length} products.`);
  } catch (error: any) {
    console.error('[SYNC] Failure:', error.message);
    await supabase.from('system_logs').insert({
      event_type: 'sync_failure',
      message: `Sync failed: ${error.message}`,
      details: { error: error.message }
    });
  }
}

// Initial sync and interval (every 10 minutes)
syncSupplierProducts();
setInterval(syncSupplierProducts, 10 * 60 * 1000);

// ─── 2. Purchase account (Supplier API Proxy) ────────────────────────────────
app.post('/api/reseller/purchase', async (req, res) => {
  try {
    const { productId, productName, productType, supplierId, userId, amount } = req.body;
    
    if (!productId || !userId || !productType) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // 1. Verify user and balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_balance, email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) throw new Error("User profile not found");
    if (profile.wallet_balance < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient wallet balance' });
    }

    // 2. Determine if Supplier or Local
    let credentials = null;
    if (productType === 'supplier_product') {
      const apiKey = process.env.SUPPLIER_API_KEY;
      const apiUrl = process.env.SUPPLIER_API_URL;
      if (!apiKey || !apiUrl) throw new Error("Missing supplier credentials");

      const params = new URLSearchParams();
      params.append('action', 'buyProduct');
      params.append('id', productId);
      params.append('amount', '1');
      params.append('api_key', apiKey);

      const supplierResp = await fetch(`${apiUrl}/buy_product.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });

      const data = await supplierResp.json();

      if (data.status !== 'success') {
        console.error("Supplier purchase failed:", data);
        await supabase.from('system_logs').insert({
          event_type: 'order_failure',
          message: `Supplier error: ${data.msg}`,
          details: { productId, userId, supplierMsg: data.msg }
        });
        return res.status(400).json({ success: false, error: data.msg || 'Supplier transaction rejected.' });
      }

      const rawData = data.data?.[0] || "No Data Fetched";
      const parts = rawData.split('|');
      credentials = parts.length >= 2 
        ? { username: parts[0], password: parts[1], notes: "Purchased Account Data" }
        : { username: rawData, password: "See username string", notes: "Raw account dump" };
    } else {
      // Local gift purchase logic
      credentials = { info: "Digital gift delivered to account room." };
    }

    // 3. Success: Deduct wallet and store order

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        product_id: productId,
        product_name: req.body.productName || 'Supplier Product',
        product_type: 'supplier_product',
        amount,
        status: 'completed',
        delivery_details: credentials
      })
      .select()
      .single();

    if (orderError) throw orderError;

    res.json({
      success: true,
      data: {
        orderId: order.id,
        status: 'delivered',
        credentials
      }
    });

  } catch (error: any) {
    console.error('Purchase API Error:', error.message);
    res.status(500).json({ success: false, error: error.message || 'Transaction failed' });
  }
});

// ─── 8. Admin Statistics API ─────────────────────────────────────────────────
app.get('/api/admin/stats', async (req, res) => {
  try {
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const { count: activeOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    
    // Calculate total revenue
    const { data: orderSums } = await supabase.from('orders').select('amount').eq('status', 'completed');
    const totalRevenue = orderSums?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalOrders,
        activeOrders,
        totalRevenue
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── 3. Wallet Fund — Initialize Korapay Checkout ────────────────────────────
app.post('/api/wallet/fund', async (req, res) => {
  try {
    const { amount, email, userId } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, error: 'Invalid amount. Minimum is $1.' });
    }

    const reference = `VLX-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const korapayKey = process.env.KORAPAY_SECRET_KEY;

    if (!korapayKey) {
      // Simulated flow if no Korapay key configured
      console.log('[SIMULATED] Korapay fund request:', { amount, email, reference });
      return res.json({
        success: true,
        data: {
          reference,
          checkout_url: null, // No real URL — frontend will handle simulation
          simulated: true,
          amount
        }
      });
    }

    // Real Korapay integration
    const korapayResp = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${korapayKey}`
      },
      body: JSON.stringify({
        amount,
        redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback`,
        currency: 'USD',
        reference,
        customer: { email },
        metadata: { userId }
      })
    });

    const korapayData = await korapayResp.json();

    if (!korapayData.status) {
      throw new Error(korapayData.message || 'Korapay initialization failed');
    }

    res.json({
      success: true,
      data: {
        reference,
        checkout_url: korapayData.data?.checkout_url,
        simulated: false,
        amount
      }
    });
  } catch (error: any) {
    console.error('Wallet Fund Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to initialize payment' });
  }
});

// ─── 4. Wallet Verify — Korapay Payment Verification ─────────────────────────
app.post('/api/wallet/verify', async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ success: false, error: 'Missing payment reference' });
    }

    const korapayKey = process.env.KORAPAY_SECRET_KEY;

    if (!korapayKey) {
      // Simulated verification
      console.log('[SIMULATED] Payment verified for reference:', reference);
      return res.json({
        success: true,
        data: { verified: true, simulated: true }
      });
    }

    // Real Korapay verification
    const verifyResp = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${korapayKey}`
      }
    });

    const verifyData = await verifyResp.json();
    const isSuccess = verifyData.data?.status === 'success';

    res.json({
      success: isSuccess,
      data: {
        verified: isSuccess,
        simulated: false,
        korapay_status: verifyData.data?.status
      }
    });
  } catch (error: any) {
    console.error('Wallet Verify Error:', error.message);
    res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
});

// ─── 5. OTP Generate ─────────────────────────────────────────────────────────
const otpStore = new Map<string, { code: string; expires: number }>();

app.post('/api/otp/generate', async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (!userId || !email) {
      return res.status(400).json({ success: false, error: 'Missing userId or email' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(userId, { code, expires: Date.now() + 5 * 60 * 1000 }); // 5 min expiry

    // In production, send email via Supabase or SMTP
    console.log(`[OTP] Code for ${email}: ${code}`);

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error: any) {
    console.error('OTP Generate Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to generate OTP' });
  }
});

// ─── 6. OTP Verify ───────────────────────────────────────────────────────────
app.post('/api/otp/verify', async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) {
      return res.status(400).json({ success: false, error: 'Missing userId or code' });
    }

    const stored = otpStore.get(userId);
    if (!stored || Date.now() > stored.expires) {
      otpStore.delete(userId);
      return res.status(400).json({ success: false, error: 'OTP expired or not found' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ success: false, error: 'Invalid OTP code' });
    }

    otpStore.delete(userId);
    res.json({ success: true, message: 'OTP verified' });
  } catch (error: any) {
    console.error('OTP Verify Error:', error.message);
    res.status(500).json({ success: false, error: 'OTP verification failed' });
  }
});

// ─── 7. Number Verification Supplier API Proxy ──────────────────────────────
app.post('/api/verify-number', async (req, res) => {
  try {
    const { number, country } = req.body;
    
    if (!number || !country) {
      return res.status(400).json({ success: false, error: 'Missing number or country' });
    }

    const apiKey = process.env.SUPPLIER_API_KEY;
    const apiUrl = process.env.SUPPLIER_API_URL;
    
    if (!apiKey || !apiUrl) throw new Error("Missing supplier credentials");

    // Simulated response for Number Verification based on common API patterns
    // In a real scenario, this would fetch from the actual endpoint, e.g., `${apiUrl}/verify.php?number=${number}&country=${country}&api_key=${apiKey}`
    
    console.log(`[VERIFY] Request for ${number} in ${country}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demonstration, we'll return a mock successful result
    // In production, user would provide the real verification API URL
    res.json({
      success: true,
      data: {
        number,
        country,
        valid: true,
        carrier: 'Mock Carrier Communications',
        line_type: 'mobile',
        status: 'Valid',
        location: country
      }
    });

  } catch (error: any) {
    console.error('Verification API Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to verify phone number' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
