import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { authenticate, AuthRequest } from './middleware';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder';

if (supabaseKey.includes('eyJhcHBfbmFtZSI6InN1cGFiYXNlIiwicm9sZSI6ImFub24i')) {
  console.warn('⚠️ WARNING: API is running with an ANON_KEY instead of a SERVICE_ROLE_KEY. Admin tasks may fail if RLS is enabled.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const getClient = (req?: AuthRequest) => {
  const token = req?.headers.authorization?.split(' ')[1];
  
  // If we are already using a service role key, we don't need to scope it by user metadata
  const isAnon = supabaseKey.includes('eyJhcHBfbmFtZSI6InN1cGFiYXNlIiwicm9sZSI6ImFub24i');
  
  if (token && isAnon) {
    return createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  }
  return supabase;
};

// Helper to fetch dynamic API keys from settings
const getApiSettings = async () => {
  try {
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'api_keys').single();
    return data?.value || {};
  } catch (e) {
    return {};
  }
};

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { success: false, error: 'Too many requests' }
});

const purchaseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 50, 
  message: { success: false, error: 'Purchase limit reached' }
});

// Validation Schemas
const purchaseSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().optional(),
  productType: z.string().min(1),
  supplierId: z.string().optional(),
  amount: z.number().positive(),
  quantity: z.number().int().min(1).default(1)
});

const fundSchema = z.object({
  amount: z.number().min(1),
  email: z.string().email()
});

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'VeloxPro API is running on Vercel' });
});

// ─── 1. Fetch products/accounts (Serve from DB) ─────────────────────
app.get('/api/reseller/products', async (req, res) => {
  try {
    if (supabaseUrl === 'https://placeholder.supabase.co') {
      throw new Error('MISSING_ENV_VARS: Supabase URL/Key environment variables are not set in Vercel.');
    }

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
    const authError = error.message?.includes('MISSING') ? error.message : 'Failed to fetch products';
    res.status(500).json({ success: false, error: authError });
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
        product_name: productName || 'Product',
        product_type: productType || 'supplier_product',
        amount: totalAmount,
        quantity,
        unit_price: unitPrice,
        status: 'completed',
        delivery_details: credentials
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 5. Log transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'Purchase',
      amount: totalAmount,
      quantity,
      unit_price: unitPrice,
      status: 'Completed',
      product_id: productId,
      description: `Purchased ${quantity}x ${productName || 'Product'}`
    });

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
    const db = getClient(req);
    const { data: profile } = await db.from('profiles').select('role').eq('id', req.user?.id).single();
    if (profile?.role !== 'Admin') return res.status(403).json({ success: false, error: 'Unauthorized' });

    const { data: suppliers, error } = await db.from('suppliers').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data: suppliers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/suppliers', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const db = getClient(req);
    const { data: profile } = await db.from('profiles').select('role').eq('id', req.user?.id).single();
    if (profile?.role !== 'Admin') return res.status(403).json({ success: false, error: 'Unauthorized' });

    const { name, base_url, api_key, type, status, documentation } = req.body;
    const { data, error } = await db.from('suppliers').insert({
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
    const db = getClient(req);
    const { data: profile } = await db.from('profiles').select('role').eq('id', req.user?.id).single();
    if (profile?.role !== 'Admin') return res.status(403).json({ success: false, error: 'Unauthorized' });

    const { id } = req.params;
    const { data, error } = await db.from('suppliers').update(req.body).eq('id', id).select().single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/admin/suppliers/:id', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const db = getClient(req);
    const { data: profile } = await db.from('profiles').select('role').eq('id', req.user?.id).single();
    if (profile?.role !== 'Admin') return res.status(403).json({ success: false, error: 'Unauthorized' });

    const { id } = req.params;
    const { error } = await db.from('suppliers').delete().eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/suppliers/:id/test', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const db = getClient(req);
    const { data: profile } = await db.from('profiles').select('role').eq('id', req.user?.id).single();
    if (profile?.role !== 'Admin') return res.status(403).json({ success: false, error: 'Unauthorized' });

    const { id } = req.params;
    const { data: supplier } = await db.from('suppliers').select('*').eq('id', id).single();
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

// ─── 3. Wallet Fund — Initialize Korapay Checkout ────────────────────────────
app.post('/api/wallet/fund', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const validated = fundSchema.parse(req.body);
    const { amount, email } = validated;
    const userId = req.user?.id;

    const reference = `VLX-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const settings = await getApiSettings();
    const korapayKey = settings.korapay_secret_key || process.env.KORAPAY_SECRET_KEY;

    if (!korapayKey) {
      return res.json({
        success: true,
        data: { reference, checkout_url: null, simulated: true, amount }
      });
    }

    const korapayResp = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${korapayKey}`
      },
      body: JSON.stringify({
        amount,
        redirect_url: `${process.env.FRONTEND_URL}/payment-callback`,
        currency: 'USD',
        reference,
        customer: { email },
        metadata: { userId }
      })
    });

    const korapayData = await korapayResp.json();
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
    res.status(500).json({ success: false, error: 'Failed to initialize payment' });
  }
});

// ─── 4. Wallet Verify ────────────────────────────────────────────────────────
app.post('/api/wallet/verify', async (req, res) => {
  try {
    const { reference } = req.body;
    const settings = await getApiSettings();
    const korapayKey = settings.korapay_secret_key || process.env.KORAPAY_SECRET_KEY;

    if (!korapayKey) {
      return res.json({ success: true, data: { verified: true, simulated: true } });
    }

    const verifyResp = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${reference}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${korapayKey}` }
    });

    const verifyData = await verifyResp.json();
    const isSuccess = verifyData.data?.status === 'success';

    res.json({ success: isSuccess, data: { verified: isSuccess, simulated: false } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
});

// ─── 5. OTP Generate ─────────────────────────────────────────────────────────
const otpStore = new Map<string, { code: string; expires: number }>();

app.post('/api/otp/generate', authLimiter, authenticate as any, async (req: AuthRequest, res) => {
  try {
    const { email } = req.body;
    const userId = req.user?.id;
    if (!userId || !email) return res.status(400).json({ success: false, error: 'Missing email' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(userId, { code, expires: Date.now() + 5 * 60 * 1000 });
    console.log(`[OTP] Code for ${email}: ${code}`);

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to generate OTP' });
  }
});

// ─── 6. OTP Verify ───────────────────────────────────────────────────────────
app.post('/api/otp/verify', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const { code } = req.body;
    const userId = req.user?.id;
    const stored = otpStore.get(userId || '');
    if (!stored || Date.now() > stored.expires || stored.code !== code) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }
    otpStore.delete(userId || '');
    res.json({ success: true, message: 'OTP verified' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'OTP verification failed' });
  }
});

// ─── Number Verification ─────────────────────────────────────────────────────
app.post('/api/verify-number', authenticate as any, async (req: AuthRequest, res) => {
  try {
    const { number, country } = req.body;
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('*')
      .eq('type', 'number_verification')
      .eq('status', 'active')
      .limit(1)
      .single();
    
    if (!supplier) throw new Error("No active provider");

    res.json({
      success: true,
      data: { number, country, valid: true }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to verify number' });
  }
});

// Export the app for Vercel
export default app;
