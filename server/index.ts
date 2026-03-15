import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'VeloxPro API is running' });
});

// ─── 1. Fetch products/accounts with icons from Supplier API ─────────────────
app.get('/api/reseller/products', async (req, res) => {
  try {
    const apiKey = process.env.SUPPLIER_API_KEY;
    const apiUrl = process.env.SUPPLIER_API_URL;
    
    if (!apiKey || !apiUrl) throw new Error("Missing supplier credentials");

    const response = await fetch(`${apiUrl}/products.php?api_key=${apiKey}`);
    if (!response.ok) throw new Error('Failed to fetch from supplier');
    
    const data = await response.json();
    
    let allProducts: any[] = [];
    let extractedCategories: { name: string; icon: string }[] = [];
    
    if (data.status === 'success' && data.categories) {
      data.categories.forEach((cat: any) => {
        if (cat.name && !extractedCategories.find(c => c.name === cat.name)) {
          extractedCategories.push({
            name: cat.name,
            icon: cat.icon || ''
          });
        }
        if (cat.products) {
          cat.products.forEach((prod: any) => {
            allProducts.push({
              id: prod.id,
              name: prod.name,
              type: cat.name,
              price: parseFloat(prod.price),
              supplier_id: 'the-socialmarket',
              availability: Number(prod.amount) > 0,
              description: prod.description || cat.name,
              iconUrl: cat.icon || ''
            });
          });
        }
      });
    }

    res.json({
      success: true,
      data: {
        categories: extractedCategories,
        products: allProducts
      }
    });
  } catch (error: any) {
    console.error('API Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// ─── 2. Purchase account (Supplier API Proxy) ────────────────────────────────
app.post('/api/reseller/purchase', async (req, res) => {
  try {
    const { productId, supplierId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ success: false, error: 'Missing productId' });
    }

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
      return res.status(400).json({ success: false, error: data.msg || 'Supplier transaction rejected.' });
    }

    const rawData = data.data?.[0] || "No Data Fetched";
    const parts = rawData.split('|');
    const mockCredentials = parts.length >= 2 
      ? { username: parts[0], password: parts[1], notes: "Purchased Account Data" }
      : { username: rawData, password: "See username string", notes: "Raw account dump" };

    res.json({
      success: true,
      data: {
        orderId: data.trans_id || Math.floor(Math.random() * 100000),
        status: 'delivered',
        credentials: mockCredentials
      }
    });
  } catch (error: any) {
    console.error('Purchase API Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to place order with supplier' });
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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
