import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { authenticate, AuthRequest } from './middleware/auth';
import { apiKeyAuth, ApiAuthRequest } from './middleware/apiKeyAuth';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 OTP requests per window
  message: { success: false, error: 'Too many requests, please try again later' }
});

const purchaseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 purchases per hour
  message: { success: false, error: 'Purchase limit reached' }
});

// Validation Schemas
const purchaseSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().optional(),
  productType: z.string().min(1),
  supplierId: z.string().optional(),
  amount: z.number().positive(),
  quantity: z.number().min(1)
});

const fundSchema = z.object({
  amount: z.number().min(1),
  email: z.string().email()
});

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
          stock_quantity: p.stock_quantity,
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

// ─── 1.5 Sync Product Stock (Supplier API) ───────────────────────────────────
app.post('/api/reseller/sync-stock', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, error: 'Missing productId' });

    const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();
    if (!product || !product.supplier_id) return res.json({ success: true, stock: product?.stock_quantity });

    const { data: supplier } = await supabase.from('suppliers').select('*').eq('id', product.supplier_id).single();
    if (!supplier || supplier.status !== 'active') return res.json({ success: true, stock: product.stock_quantity });

    // Standard supplier "services" call
    const params = new URLSearchParams();
    params.append('action', 'services');
    params.append('api_key', supplier.api_key);

    const supplierResp = await fetch(`${supplier.base_url}/services.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const services = await supplierResp.json();
    if (Array.isArray(services)) {
      const supplierProdId = productId.includes('-') ? productId.split('-')[1] : productId;
      const remoteProduct = services.find(s => String(s.service) === String(supplierProdId) || String(s.id) === String(supplierProdId));
      
      if (remoteProduct && remoteProduct.stock !== undefined && remoteProduct.stock !== null) {
        const newStock = parseInt(remoteProduct.stock);
        if (!isNaN(newStock)) {
          await supabase.from('products').update({ 
            stock_quantity: newStock, 
            availability: newStock > 0 
          }).eq('id', productId);
          return res.json({ success: true, stock: newStock });
        }
      }
    }
    res.json({ success: true, stock: product.stock_quantity });
  } catch (error: any) {
    console.error('Stock Sync Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to sync stock' });
  }
});

// ─── Supplier Sync Logic ─────────────────────────────────────────────────────
async function syncSupplierProducts() {
  console.log('[SYNC] Starting multi-supplier product sync...');
  try {
    // 1. Fetch all active product suppliers
    const { data: activeSuppliers, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('type', 'products')
      .eq('status', 'active');

    if (supplierError) throw supplierError;
    if (!activeSuppliers || activeSuppliers.length === 0) {
      console.log('[SYNC] No active suppliers found. Skipping.');
      return;
    }

    // 2. Fetch Markup Settings
    const { data: settingsData } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('key', 'markup_settings')
      .single();
    
    const markupSettings = settingsData?.value || { global_markup: 0.20, category_markups: {} };
    const globalMarkup = markupSettings.global_markup || 0;

    const allProducts: any[] = [];
    
    // 3. Sync from each active supplier
    for (const supplier of activeSuppliers) {
      console.log(`[SYNC] Fetching from supplier: ${supplier.name}...`);
      try {
        const response = await fetch(`${supplier.base_url}/products.php?api_key=${supplier.api_key}`);
        if (!response.ok) throw new Error(`Failed to fetch from ${supplier.name}`);
        const data = await response.json();

        if (data.status !== 'success' || !data.categories) {
          console.warn(`[SYNC] Invalid data from ${supplier.name}`);
          continue;
        }

        data.categories.forEach((cat: any) => {
          if (cat.products) {
            cat.products.forEach((prod: any) => {
              const basePrice = parseFloat(prod.price);
              const catMarkup = markupSettings.category_markups?.[cat.name] ?? globalMarkup;
              const sellingPrice = basePrice + catMarkup;

              allProducts.push({
                id: `${supplier.id}-${prod.id}`, // Prefix ID to avoid global collision
                name: prod.name,
                type: cat.name,
                base_price: basePrice,
                price: sellingPrice,
                markup: catMarkup,
                supplier_id: supplier.id,
                availability: Number(prod.amount) > 0,
                stock_quantity: Number(prod.amount),
                description: prod.description || cat.name,
                icon_url: cat.icon || '',
                created_at: new Date().toISOString()
              });
            });
          }
        });
      } catch (err: any) {
        console.error(`[SYNC] Error syncing ${supplier.name}:`, err.message);
      }
    }

    if (allProducts.length === 0) return;

    // 4. Upsert into Supabase
    const { error: upsertError } = await supabase
      .from('products')
      .upsert(allProducts, { onConflict: 'id' });

    if (upsertError) throw upsertError;

    // Log success
    await supabase.from('system_logs').insert({
      event_type: 'sync_success',
      message: `Successfully synced ${allProducts.length} products from ${activeSuppliers.length} suppliers.`,
      details: { count: allProducts.length, suppliers: activeSuppliers.map(s => s.name) }
    });

    console.log(`[SYNC] Success: Synced ${allProducts.length} products total.`);
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
app.post('/api/reseller/purchase', purchaseLimiter, authenticate as any, async (req: AuthRequest, res) => {
  try {
    const validated = purchaseSchema.parse(req.body);
    const { productId, productName, productType, supplierId, amount: unitPrice, quantity } = validated;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const totalAmount = unitPrice * quantity;

    // 1. Atomic Purchase (Checks balance, stock, and deducts both)
    const { data: result, error: rpcError } = await supabase.rpc('purchase_product_atomic', {
      p_user_id: userId,
      p_product_id: productId,
      p_quantity: quantity,
      p_total_amount: totalAmount
    });

    if (rpcError) throw rpcError;
    if (result.success === false) {
      return res.status(400).json({ success: false, error: result.error || 'Transaction failed' });
    }

    // 2. Determine if Supplier or Local
    let credentials: any = null;
    if (productType === 'supplier_product' || productId.includes('-')) {
      try {
        // Find the specific supplier for this product
        const { data: productData } = await supabase.from('products').select('supplier_id').eq('id', productId).single();
        const activeSupplierId = productData?.supplier_id || supplierId;

        if (!activeSupplierId) throw new Error("No supplier linked to this product");

        const { data: supplier } = await supabase
          .from('suppliers')
          .select('*')
          .eq('id', activeSupplierId)
          .single();

        if (!supplier || supplier.status !== 'active') {
          throw new Error("Linked supplier is inactive or not found");
        }

        // We purchase multiple times if quantity > 1 (Option B as some APIs only give 1 log per request)
        const allCredentials = [];
        for (let i = 0; i < quantity; i++) {
          const params = new URLSearchParams();
          params.append('action', 'buyProduct');
          const supplierProdId = productId.includes('-') ? productId.split('-')[1] : productId;
          params.append('id', supplierProdId);
          params.append('amount', '1');
          params.append('api_key', supplier.api_key);

          const supplierResp = await fetch(`${supplier.base_url}/buy_product.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
          });

          const data = await supplierResp.json();

          if (data.status !== 'success') {
            throw new Error(data.msg || `Supplier purchase failed (item ${i+1}/${quantity})`);
          }

          const rawData = data.data?.[0] || "No Data Fetched";
          const parts = rawData.split('|');
          allCredentials.push(parts.length >= 2 
            ? { username: parts[0], password: parts[1], notes: `Item ${i+1}/${quantity}` }
            : { username: rawData, password: "See username string", notes: `Raw account dump ${i+1}/${quantity}` });
        }
        
        credentials = quantity === 1 ? allCredentials[0] : allCredentials;
      } catch (err: any) {
        console.error("Supplier purchase failed, rolling back transaction:", err);
        // Rollback: Refund user
        await supabase.rpc('refund_product_atomic', {
          p_user_id: userId,
          p_product_id: productId,
          p_quantity: quantity,
          p_total_amount: totalAmount
        });
        return res.status(400).json({ success: false, error: err.message || 'Supplier transaction failed.' });
      }
    } else {
      credentials = { info: `Digital gift (${quantity} items) delivered to account room.` };
    }

    // 4. Store order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        product_id: productId,
        product_name: productName || 'Supplier Product',
        product_type: productType || 'supplier_product',
        amount: totalAmount,
        quantity: quantity,
        unit_price: unitPrice,
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

// ─── Supplier Management APIs (Admin Only) ───────────────────────────────────
app.get('/api/admin/suppliers', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', req.user?.id).single();
    if (profile?.role !== 'Admin') return res.status(403).json({ success: false, error: 'Unauthorized' });

    const { data: suppliers, error } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data: suppliers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/suppliers', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', req.user?.id).single();
    if (profile?.role !== 'Admin') return res.status(403).json({ success: false, error: 'Unauthorized' });

    const { name, base_url, api_key, type, status, documentation } = req.body;
    const { data, error } = await supabase.from('suppliers').insert({
      name, base_url, api_key, type, status: status || 'active', documentation
    }).select().single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/admin/suppliers/:id', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', req.user?.id).single();
    if (profile?.role !== 'Admin') return res.status(403).json({ success: false, error: 'Unauthorized' });

    const { id } = req.params;
    const { data, error } = await supabase.from('suppliers').update(req.body).eq('id', id).select().single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/admin/suppliers/:id', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', req.user?.id).single();
    if (profile?.role !== 'Admin') return res.status(403).json({ success: false, error: 'Unauthorized' });

    const { id } = req.params;
    const { error } = await supabase.from('suppliers').delete().eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/suppliers/:id/test', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', req.user?.id).single();
    if (profile?.role !== 'Admin') return res.status(403).json({ success: false, error: 'Unauthorized' });

    const { id } = req.params;
    const { data: supplier } = await supabase.from('suppliers').select('*').eq('id', id).single();
    if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });

    const startTime = Date.now();
    try {
      const response = await fetch(`${supplier.base_url}/products.php?api_key=${supplier.api_key}`);
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        res.json({ success: true, message: 'Connection successful', responseTime: `${duration}ms` });
      } else {
        res.json({ success: false, error: `API responded with status ${response.status}`, responseTime: `${duration}ms` });
      }
    } catch (err: any) {
      res.json({ success: false, error: err.message, responseTime: `${Date.now() - startTime}ms` });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── 8. Admin Statistics API ─────────────────────────────────────────────────
app.get('/api/admin/stats', authenticate as any, async (req: AuthRequest, res) => {
  try {
    // Audit check: Ensure user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user?.id)
      .single();

    if (profile?.role !== 'Admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }

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
app.post('/api/wallet/fund', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const validated = fundSchema.parse(req.body);
    const { amount, email } = validated;
    const userId = req.user?.id;

    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, error: 'Invalid amount. Minimum is $1.' });
    }

    const userToken = req.user?.token;

    // Use a client authorized as the current user so RLS works
    const userSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${userToken}` } }
    });

    const reference = `VLX-TEMP-${Date.now()}`;
    const korapayKey = process.env.KORAPAY_SECRET_KEY;

    // ALWAYS create a pending transaction record first
    const { data: tx, error: txError } = await userSupabase.from('transactions').insert({
      user_id: userId,
      amount,
      type: 'Funding',
      status: 'Pending',
      payment_reference: reference,
      payment_provider: korapayKey ? 'Korapay' : 'Korapay (Simulation)',
      payment_method: 'Card/Transfer',
      description: `Wallet funding via Korapay`
    }).select().single();

    if (txError) {
      console.error('Failed to create pending transaction:', txError);
      throw txError;
    }

    if (!korapayKey) {
      // Simulated flow if no Korapay key configured
      console.log('[SIMULATED] Korapay fund request:', { amount, email, reference });
      return res.json({
        success: true,
        data: {
          reference,
          checkout_url: 'https://test-checkout.korapay.com/pay/D0OnAzDUL54CNph', 
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
app.post('/api/wallet/verify', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ success: false, error: 'Missing payment reference' });
    }

    const korapayKey = process.env.KORAPAY_SECRET_KEY;

    if (!korapayKey) {
      const userToken = req.user?.token;

    // Use a client authorized as the current user
    const userSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${userToken}` } }
    });

    // Simulated flow — process instantly by updating the database record
    // The trigger 'update_wallet_stats' will handle balance increment automatically
    const { data, error } = await userSupabase
      .from('transactions')
      .update({ status: 'Completed' })
      .eq('payment_reference', reference)
      .eq('status', 'Pending')
      .select()
      .single();

      if (error) {
        console.error('Failed to update simulated transaction:', error);
        return res.status(400).json({ success: false, error: 'Transaction not found or already completed' });
      }

      return res.json({
        success: true,
        data: { verified: true, simulated: true, tx: data }
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

app.post('/api/otp/generate', authLimiter, authenticate as any, async (req: AuthRequest, res) => {
  try {
    const { email } = req.body;
    const userId = req.user?.id;
    if (!userId || !email) {
      return res.status(400).json({ success: false, error: 'Missing email' });
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
app.post('/api/otp/verify', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const { code } = req.body;
    const userId = req.user?.id;
    if (!userId || !code) {
      return res.status(400).json({ success: false, error: 'Missing code' });
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

// ─── Number Verification Supplier API Proxy ──────────────────────────────
app.post('/api/verify-number', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const { number, country } = req.body;
    const userId = req.user?.id;
    
    if (!number || !country || !userId) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }

    // 1. Fetch first active number verification supplier
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('*')
      .eq('type', 'number_verification')
      .eq('status', 'active')
      .limit(1)
      .single();
    
    if (!supplier) {
      // Fallback to legacy settings if no dynamic suppliers
      const { data: apiSettings } = await supabase.from('system_settings').select('value').eq('key', 'api_keys').single();
      const apiKeys = apiSettings?.value || {};
      const apiKey = apiKeys.number_api_key || apiKeys.supplier_api_key || process.env.SUPPLIER_API_KEY;
      const apiUrl = apiKeys.supplier_api_url || process.env.SUPPLIER_API_URL;
      
      if (!apiKey || !apiUrl) throw new Error("No active number verification supplier configured");
    }

    const apiKey = supplier?.api_key || process.env.SUPPLIER_API_KEY;
    const apiUrl = supplier?.base_url || process.env.SUPPLIER_API_URL;

    console.log(`[VERIFY] Request for ${number} in ${country}`);
    await new Promise(resolve => setTimeout(resolve, 1500));

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

// ─── 8. Regenerate API Key ───────────────────────────────────────────────────
app.post('/api/profile/regen-api-key', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const newKey = `sk_live_${crypto.randomBytes(16).toString('hex')}`;

    const { error } = await supabase
      .from('profiles')
      .update({ api_key: newKey })
      .eq('id', userId);

    if (error) throw error;

    res.json({
      success: true,
      api_key: newKey
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to regenerate API key' });
  }
});

// ─── PUBLIC API V1 ENDPOINTS ────────────────────────────────────────────────
// 1. GET BALANCE
app.get('/api/v1/balance', apiKeyAuth as any, async (req: ApiAuthRequest, res) => {
  res.json({
    success: true,
    balance: req.user?.wallet_balance || 0
  });
});

// 2. GET SERVICES
app.get('/api/v1/services', apiKeyAuth as any, async (req: ApiAuthRequest, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, type, price')
      .eq('availability', true);

    if (error) throw error;

    res.json({
      success: true,
      services: products.map(p => ({
        service_id: p.id,
        name: p.name,
        category: p.type,
        price: p.price
      }))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch services' });
  }
});

// 3. CREATE ORDER
app.post('/api/v1/order', apiKeyAuth as any, async (req: ApiAuthRequest, res) => {
  try {
    const { service_id, quantity, target_url } = req.body;
    const userId = req.user?.id;

    if (!service_id || !quantity) {
      return res.status(400).json({ success: false, error: 'Missing service_id or quantity' });
    }

    // 1. Fetch product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', service_id)
      .single();

    if (productError || !product) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // Calculate total cost (assuming quantity is per units, if price is per 1000, adjust)
    // Most SMM APIs use price per 1000. Let's assume price here is the selling price for 1 unit for legacy reasons, or 1000 if normalized.
    // Looking at ServicesGrid, it says pricePer1000.
    const totalCost = (product.price * quantity) / 1000;

    // 2. Check balance
    if (req.user!.wallet_balance < totalCost) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    // 3. Place order with supplier
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', product.supplier_id)
      .single();
    
    if (!supplier || supplier.status !== 'active') {
      // Fallback to legacy settings if no dynamic supplier found (e.g. for old products)
      const { data: apiSettings } = await supabase.from('system_settings').select('value').eq('key', 'api_keys').single();
      const apiKeys = apiSettings?.value || {};
      const apiKey = apiKeys.supplier_api_key || process.env.SUPPLIER_API_KEY;
      const apiUrl = apiKeys.supplier_api_url || process.env.SUPPLIER_API_URL;
      
      if (!apiKey || !apiUrl) throw new Error("No active supplier found for this product");
      
      // Use legacy params logic...
      const params = new URLSearchParams();
      params.append('action', 'buyProduct');
      params.append('id', service_id);
      params.append('amount', quantity.toString());
      params.append('api_key', apiKey);

      const supplierResp = await fetch(`${apiUrl}/buy_product.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });
      const supData = await supplierResp.json();
      if (supData.status !== 'success') {
        return res.status(400).json({ success: false, error: supData.msg || 'Supplier rejected order' });
      }
      return handleOrderSuccess(supData);
    }

    const params = new URLSearchParams();
    params.append('action', 'buyProduct');
    const supplierProdId = service_id.includes('-') ? service_id.split('-')[1] : service_id;
    params.append('id', supplierProdId);
    params.append('amount', quantity.toString());
    params.append('api_key', supplier.api_key);

    const supplierResp = await fetch(`${supplier.base_url}/buy_product.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const supData = await supplierResp.json();

    if (supData.status !== 'success') {
      return res.status(400).json({ success: false, error: supData.msg || `Supplier ${supplier.name} rejected order` });
    }

    async function handleOrderSuccess(supData: any) {
      // 4. Deduct balance and Record Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          product_id: service_id,
          product_name: product.name,
          product_type: product.type,
          amount: totalCost,
          status: 'completed',
          delivery_details: supData.data || {}
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Update profile
      await supabase.rpc('deduct_wallet_balance', { 
        user_id: userId, 
        amount: totalCost 
      });

      return res.json({
        success: true,
        order_id: order.id,
        status: 'success'
      });
    }

    await handleOrderSuccess(supData);

  } catch (error: any) {
    console.error('API V1 Order Error:', error);
    res.status(500).json({ success: false, error: 'Failed to process order' });
  }
});

// 4. ORDER STATUS
app.get('/api/v1/status', apiKeyAuth as any, async (req: ApiAuthRequest, res) => {
  try {
    const { order_id } = req.query;
    if (!order_id) return res.status(400).json({ success: false, error: 'Missing order_id' });

    const { data: order, error } = await supabase
      .from('orders')
      .select('status, delivery_details, created_at')
      .eq('id', order_id)
      .eq('user_id', req.user?.id)
      .single();

    if (error || !order) return res.status(404).json({ success: false, error: 'Order not found' });

    res.json({
      success: true,
      status: order.status,
      delivery_details: order.delivery_details,
      created_at: order.created_at
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch status' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
