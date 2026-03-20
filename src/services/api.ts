import { supabase } from '../lib/supabase';

export const API_BASE_URL = '/api';

// ─── Supplier Types ──────────────────────────────────────────────────────────
export interface SupplierProduct {
  id: string;
  name: string;
  type: string;
  price: number;
  supplier_id: string;
  availability: boolean;
  description: string;
  iconUrl: string;
}

export interface SupplierCategory {
  name: string;
  icon: string;
}

export interface SupplierPayload {
  categories: SupplierCategory[];
  products: SupplierProduct[];
}

// ─── Fetch Products & Categories ─────────────────────────────────────────────
export const fetchResellerProducts = async (): Promise<SupplierPayload | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reseller/products`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching reseller products:', error);
    return null;
  }
};

// ─── Purchase Account ────────────────────────────────────────────────────────
export const purchaseSupplierAccount = async (productId: string, productName: string, supplierId: string, userId: string, amount: number) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${API_BASE_URL}/reseller/purchase`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ productId, productName, supplierId, userId, amount }),
    });
    
    if (!response.ok) throw new Error('Failed to complete supplier purchase');
    return await response.json();
  } catch (error) {
    console.error('Error purchasing from supplier:', error);
    throw error;
  }
};

// ─── Wallet Fund — Initialize Korapay Checkout ───────────────────────────────
export const initializeWalletFund = async (amount: number, email: string, userId: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_BASE_URL}/wallet/fund`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ amount, email, userId }),
  });
  
  if (!response.ok) throw new Error('Failed to initialize payment');
  return await response.json();
};

// ─── Wallet Verify — Korapay Payment Verification ───────────────────────────
export const verifyWalletPayment = async (reference: string) => {
  const response = await fetch(`${API_BASE_URL}/wallet/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference }),
  });
  
  if (!response.ok) throw new Error('Payment verification failed');
  return await response.json();
};

// ─── OTP ─────────────────────────────────────────────────────────────────────
export const generateOTP = async (userId: string, email: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_BASE_URL}/otp/generate`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userId, email }),
  });
  
  if (!response.ok) throw new Error('Failed to generate OTP');
  return await response.json();
};

export const verifyOTP = async (userId: string, code: string) => {
  const response = await fetch(`${API_BASE_URL}/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, code }),
  });
  
  if (!response.ok) throw new Error('OTP verification failed');
  return await response.json();
};

export const verifyPhoneNumber = async (number: string, country: string) => {
  const response = await fetch(`${API_BASE_URL}/verify-number`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ number, country }),
  });
  
  if (!response.ok) throw new Error('Phone verification failed');
  return await response.json();
};

// ─── Supplier Management ─────────────────────────────────────────────────────
export interface Supplier {
  id: string;
  name: string;
  base_url: string;
  api_key: string;
  type: 'products' | 'number_verification';
  documentation?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export const fetchSuppliers = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_BASE_URL}/admin/suppliers`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch suppliers');
  return await response.json();
};

export const createSupplier = async (supplier: Partial<Supplier>) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_BASE_URL}/admin/suppliers`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(supplier),
  });
  if (!response.ok) throw new Error('Failed to create supplier');
  return await response.json();
};

export const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_BASE_URL}/admin/suppliers/${id}`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update supplier');
  return await response.json();
};

export const deleteSupplier = async (id: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_BASE_URL}/admin/suppliers/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete supplier');
  return await response.json();
};

export const testSupplierConnection = async (id: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_BASE_URL}/admin/suppliers/${id}/test`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
};
