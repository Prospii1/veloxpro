import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Package, 
  Gift, 
  Users, 
  ShoppingCart, 
  Settings, 
  Search, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  Zap,
  LayoutDashboard,
  Loader2,
  Globe,
  Trash2,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils';
import { supabase } from '../lib/supabase';
import { 
  fetchSuppliers, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier, 
  testSupplierConnection,
  Supplier
} from '../services/api';

type AdminTab = 'overview' | 'products' | 'gifts' | 'users' | 'orders' | 'suppliers' | 'settings';

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Protect the route
  if (profile?.role !== 'Admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="glass p-12 rounded-[2.5rem] border-red-500/20 max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-bold font-display mb-4">Access Denied</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            This area is restricted to authorized administrative personnel only.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn-primary w-full py-4"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'gifts', icon: Gift, label: 'Order a Gift' },
    { id: 'orders', icon: ShoppingCart, label: 'Orders' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'suppliers', icon: Globe, label: 'Suppliers' },
    { id: 'settings', icon: Settings, label: 'API & Settings' },
  ];

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    activeOrders: 0,
    totalOrders: 0
  });

  const [products, setProducts] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', type: '', base_price: 0, markup: 0, stock_quantity: 0, description: '', icon_url: '', availability: true });
  const [newGift, setNewGift] = useState({ name: '', description: '', price: 0, image_url: '', availability_status: 'active' });
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: '', base_url: '', api_key: '', type: 'products', status: 'active', documentation: ''
  });
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'gifts') fetchGifts();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'suppliers') getSuppliers();
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab]);

  const getSuppliers = async () => {
    setLoading(true);
    try {
      const { data } = await fetchSuppliers();
      if (data) setSuppliers(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('system_settings').select('*');
      let mergedSettings: any = {
        global_markup: 0.20,
        category_markups: {},
        api_keys: { supplier_api_key: '', supplier_api_url: '', number_api_key: '' }
      };

      if (data && data.length > 0) {
        data.forEach(row => {
          if (row.key === 'markup_settings') {
            mergedSettings.global_markup = row.value?.global_markup ?? 0.20;
            mergedSettings.category_markups = row.value?.category_markups || {};
          }
          if (row.key === 'api_keys') {
            mergedSettings.api_keys = row.value || mergedSettings.api_keys;
          }
        });
      }
      setSettings(mergedSettings);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const resp = await fetch('/api/admin/stats');
      const { data } = await resp.json();
      if (data) setStats(data);
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const fetchGifts = async () => {
    setLoading(true);
    const { data } = await supabase.from('gifts').select('*').order('created_at', { ascending: false });
    if (data) setGifts(data);
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string | null) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
    if (!error) fetchUsers();
  };

  const handleCreateProduct = async () => {
    const { error } = await supabase.from('products').insert([{
      ...newProduct,
      price: Number(newProduct.base_price) + Number(newProduct.markup)
    }]);
    if (!error) {
      setShowProductModal(false);
      fetchProducts();
    }
  };

  const handleCreateGift = async () => {
    const { error } = await supabase.from('gifts').insert([newGift]);
    if (!error) {
      setShowGiftModal(false);
      fetchGifts();
    }
  };

  const handleDeleteGift = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this option?")) return;
    const { error } = await supabase.from('gifts').delete().eq('id', id);
    if (!error) fetchGifts();
  };

  const handleToggleProductStatus = async (id: string, currentStatus: boolean | null) => {
    const { error } = await supabase.from('products').update({ availability: !currentStatus }).eq('id', id);
    if (!error) fetchProducts();
  };

  const handleUpdateSettings = async () => {
    const markupValue = { global_markup: settings.global_markup, category_markups: settings.category_markups };

    const { error: error1 } = await supabase.from('system_settings').upsert({ key: 'markup_settings', value: markupValue }, { onConflict: 'key' });
    
    if (!error1) {
      alert("Settings updated successfully!");
    } else {
      alert("Failed to update settings. Check console.");
      console.error(error1);
    }
  };

  const handleCreateSupplier = async () => {
    try {
      await createSupplier(newSupplier);
      setShowSupplierModal(false);
      setNewSupplier({ name: '', base_url: '', api_key: '', type: 'products', status: 'active', documentation: '' });
      getSuppliers();
    } catch (e) {
      alert("Failed to create supplier");
    }
  };

  const handleToggleSupplier = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateSupplier(id, { status: newStatus as any });
      getSuppliers();
    } catch (e) {
      alert("Failed to toggle supplier");
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await deleteSupplier(id);
      getSuppliers();
    } catch (e) {
      alert("Failed to delete supplier");
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const res = await testSupplierConnection(id);
      if (res.success) {
        alert(`Success! Response time: ${res.responseTime}`);
      } else {
        alert(`Failed: ${res.error}`);
      }
    } catch (e) {
      alert("Test failed");
    }
    setTestingId(null);
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0 space-y-2">
          <div className="mb-8 pl-4">
            <div className="inline-flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase mb-1">
              <Zap size={14} />
              Admin Hub
            </div>
            <h1 className="text-2xl font-bold font-display text-[#1F2937] dark:text-white">Dashboard</h1>
          </div>
          
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold",
                activeTab === item.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/25" 
                  : "text-[#6B7280] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary" size={18} />
              <input 
                type="text" 
                placeholder="Search everything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900/50 border border-transparent focus:border-primary/20 focus:ring-2 focus:ring-primary/10 rounded-2xl py-3 pl-12 pr-4 transition-all"
              />
            </div>
            <button 
              onClick={() => {
                if (activeTab === 'products') setShowProductModal(true);
                if (activeTab === 'gifts') setShowGiftModal(true);
                if (activeTab === 'suppliers') setShowSupplierModal(true);
                if (activeTab === 'overview' || activeTab === 'users' || activeTab === 'orders') alert('Use specific tabs to create items');
              }}
              className="btn-primary flex items-center gap-2 px-6"
            >
              <Plus size={20} />
              Create New
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, trend: '+12.5%', isUp: true },
                    { label: 'Active Orders', value: stats.activeOrders.toString(), trend: '+5.2%', isUp: true },
                    { label: 'Total Users', value: stats.totalUsers.toString(), trend: '+2.4%', isUp: true },
                    { label: 'Total Orders', value: stats.totalOrders.toString(), trend: '+0.8%', isUp: true },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
                      <p className="text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-2">{stat.label}</p>
                      <div className="flex items-end justify-between">
                        <h4 className="text-3xl font-bold font-display text-[#1F2937] dark:text-white">{stat.value}</h4>
                        <div className={cn(
                          "flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-lg",
                          stat.isUp ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
                        )}>
                          {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {stat.trend}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Main Table Area */}
                <div className="glass overflow-hidden rounded-[2.5rem] border-[#E5E7EB] dark:border-white/5">
                  <div className="p-8 border-b border-[#E5E7EB] dark:border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-bold font-display text-[#1F2937] dark:text-white">Recent Orders</h3>
                    <button className="text-sm font-bold text-primary hover:underline">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-white/5">
                          <th className="px-8 py-4 text-xs font-bold text-[#6B7280] dark:text-slate-500 uppercase tracking-widest">Order ID</th>
                          <th className="px-8 py-4 text-xs font-bold text-[#6B7280] dark:text-slate-500 uppercase tracking-widest">Customer</th>
                          <th className="px-8 py-4 text-xs font-bold text-[#6B7280] dark:text-slate-500 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-4 text-xs font-bold text-[#6B7280] dark:text-slate-500 uppercase tracking-widest">Amount</th>
                          <th className="px-8 py-4 text-xs font-bold text-[#6B7280] dark:text-slate-500 uppercase tracking-widest">Date</th>
                          <th className="px-8 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-8 py-6 font-mono text-sm text-[#6B7280] dark:text-slate-400">#ORD-523{i}</td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">JD</div>
                                 <span className="font-bold text-[#1F2937] dark:text-white">John Doe</span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                                Completed
                              </span>
                            </td>
                             <td className="px-8 py-6 font-bold text-[#1F2937] dark:text-white">$124.99</td>
                            <td className="px-8 py-6 text-slate-500 text-sm">Oct 24, 2023</td>
                            <td className="px-8 py-6 text-right">
                              <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                                <MoreVertical size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 overflow-hidden rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <h3 className="text-xl font-bold font-display text-[#1F2937] dark:text-white">Product Inventory</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/5">
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Product</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Category</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Supplier Price</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Selling Price</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Stock</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Status</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="px-8 py-6 font-bold text-[#1F2937] dark:text-white">{p.name}</td>
                          <td className="px-8 py-6 text-[#6B7280]">{p.type}</td>
                          <td className="px-8 py-6 text-[#6B7280]">${p.base_price?.toFixed(2)}</td>
                          <td className="px-8 py-6 font-bold text-[#1F2937] dark:text-white">${p.price?.toFixed(2)}</td>
                          <td className="px-8 py-6 text-[#6B7280]">{p.stock_quantity ?? 'N/A'}</td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold",
                              p.availability ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                            )}>
                              {p.availability ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button 
                               onClick={() => handleToggleProductStatus(p.id, p.availability)}
                               className={cn(
                                 "text-xs font-bold transition-colors",
                                 p.availability ? "text-orange-500 hover:text-orange-600" : "text-emerald-500 hover:text-emerald-600"
                               )}
                             >
                               {p.availability ? 'Disable' : 'Enable'}
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 overflow-hidden rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="p-8 border-b border-slate-100 dark:border-white/5">
                   <h3 className="text-xl font-bold font-display text-[#1F2937] dark:text-white">All Orders</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/5">
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Order ID</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Product</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Amount</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Status</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="px-8 py-6 font-mono text-xs">{o.id.split('-')[0]}...</td>
                          <td className="px-8 py-6 font-bold text-[#1F2937] dark:text-white">{o.product_name}</td>
                          <td className="px-8 py-6 font-bold text-[#1F2937] dark:text-white">${o.amount?.toFixed(2)}</td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold",
                              o.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
                            )}>
                              {o.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-slate-500 text-sm">
                            {new Date(o.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden rounded-[2.5rem]">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                   <h3 className="text-xl font-bold font-display text-[#1F2937] dark:text-white">User Management</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-white/5">
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Wallet</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Joined</th>
                        <th className="px-8 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="px-8 py-6 font-bold text-[#1F2937] dark:text-white">{u.email}</td>
                          <td className="px-8 py-6 font-bold text-primary">${u.wallet_balance?.toFixed(2)}</td>
                          <td className="px-8 py-6 text-slate-500">{u.role}</td>
                          <td className="px-8 py-6 text-slate-500 text-sm">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button 
                               onClick={() => handleToggleUserStatus(u.id, u.status)}
                               className={cn(
                                 "text-xs font-bold transition-colors",
                                 u.status === 'suspended' ? "text-emerald-500 hover:text-emerald-600" : "text-red-500 hover:text-red-600"
                               )}
                             >
                               {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'suppliers' && (
              <motion.div key="suppliers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden rounded-[2.5rem]">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <h3 className="text-xl font-bold font-display text-[#1F2937] dark:text-white">API Suppliers</h3>
                   <div className="flex gap-2">
                     <span className="text-xs font-bold text-slate-400 uppercase">Total: {suppliers.length}</span>
                   </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-white/5">
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Supplier</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Type</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Base URL</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {suppliers.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="px-8 py-6">
                            <div className="font-bold text-[#1F2937] dark:text-white">{s.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{s.id.split('-')[0]}...</div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                              s.type === 'products' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                            )}>
                              {s.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm text-slate-500 font-mono truncate max-w-[200px]">{s.base_url}</td>
                          <td className="px-8 py-6">
                            <button 
                              onClick={() => handleToggleSupplier(s.id, s.status)}
                              className="flex items-center gap-2 group"
                            >
                              {s.status === 'active' ? (
                                <ToggleRight className="text-emerald-500" size={24} />
                              ) : (
                                <ToggleLeft className="text-slate-300" size={24} />
                              )}
                              <span className={cn(
                                "text-xs font-bold",
                                s.status === 'active' ? "text-emerald-500" : "text-slate-400"
                              )}>
                                {s.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </button>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={() => handleTestConnection(s.id)}
                                disabled={testingId === s.id}
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                              >
                                {testingId === s.id ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                                Test API
                              </button>
                              <button 
                                onClick={() => handleDeleteSupplier(s.id)}
                                className="text-xs font-bold text-red-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {suppliers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-8 py-12 text-center text-slate-400">
                            No suppliers configured yet. Click "Create New" to add one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'gifts' && (
              <motion.div key="gifts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden rounded-[2.5rem]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold font-display text-[#1F2937]">Order a Gift</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-white/5">
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Gift Name</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Price</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {gifts.map((g) => (
                        <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="px-8 py-6 font-bold text-[#1F2937] dark:text-white">{g.name}</td>
                          <td className="px-8 py-6 font-bold text-[#1F2937] dark:text-white">${g.price?.toFixed(2)}</td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold",
                              g.availability_status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                            )}>
                              {g.availability_status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button 
                               onClick={() => handleDeleteGift(g.id)}
                               className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                             >
                               Delete
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
            {activeTab === 'settings' && !settings && (
              <motion.div key="settings-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-20">
                <Loader2 size={40} className="animate-spin text-primary" />
              </motion.div>
            )}
            {activeTab === 'settings' && settings && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm p-12 rounded-[2.5rem]">
                <h3 className="text-2xl font-bold font-display mb-8 text-[#1F2937] dark:text-white">System Configuration</h3>
                <div className="max-w-xl space-y-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                       <Zap size={16} className="text-secondary" />
                       Global Markup ($)
                    </label>
                    <p className="text-xs text-slate-400">Added to every product unless category/product override exists.</p>
                    <input 
                      type="number" 
                      value={settings.global_markup} 
                      onChange={e => setSettings({...settings, global_markup: Number(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 outline-none border border-transparent focus:border-primary/20 transition-all font-bold text-lg" 
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                       <Package size={16} className="text-primary" />
                       Category Markups
                    </label>
                    <div className="space-y-3">
                      {Object.entries(settings.category_markups || {}).map(([cat, val]) => (
                        <div key={cat} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                           <span className="flex-1 font-bold text-slate-600 dark:text-slate-400">{cat}</span>
                           <input 
                             type="number" 
                             value={val as number} 
                             onChange={e => setSettings({
                               ...settings, 
                               category_markups: {
                                 ...settings.category_markups,
                                 [cat]: Number(e.target.value)
                               }
                             })}
                             className="w-24 bg-white dark:bg-slate-900 rounded-xl px-4 py-2 text-right font-bold outline-none"
                           />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <p className="text-xs text-slate-400 italic">
                      Looking for API Keys? Navigate to the <strong>Suppliers</strong> tab to manage primary and secondary API providers dynamically.
                    </p>
                  </div>

                  <button 
                    onClick={handleUpdateSettings}
                    className="btn-primary w-full py-5 rounded-[2rem] font-bold text-lg shadow-xl shadow-primary/20"
                  >
                    Save Configuration
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Creation Modals */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-lg w-full p-8 shadow-2xl border border-white/10">
              <h2 className="text-2xl font-bold mb-6 text-[#1F2937] dark:text-white">Create New Product</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Product Name</label>
                  <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none" placeholder="e.g. Netflix Premium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                  <input type="text" value={newProduct.type} onChange={e => setNewProduct({...newProduct, type: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none" placeholder="e.g. Streaming" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Base Price ($)</label>
                  <input type="number" value={newProduct.base_price} onChange={e => setNewProduct({...newProduct, base_price: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Markup ($)</label>
                  <input type="number" value={newProduct.markup} onChange={e => setNewProduct({...newProduct, markup: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Stock</label>
                  <input type="number" value={newProduct.stock_quantity} onChange={e => setNewProduct({...newProduct, stock_quantity: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none" />
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowProductModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold">Cancel</button>
                <button onClick={handleCreateProduct} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold">Create Product</button>
              </div>
            </motion.div>
          </div>
        )}

        {showGiftModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-lg w-full p-8 shadow-2xl border border-white/10">
              <h2 className="text-2xl font-bold mb-6 text-[#1F2937] dark:text-white">Create Gift Option</h2>
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Gift Name</label>
                  <input type="text" value={newGift.name} onChange={e => setNewGift({...newGift, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none" placeholder="e.g. Amazon Gift Card" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                  <textarea value={newGift.description} onChange={e => setNewGift({...newGift, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none h-24" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Price ($)</label>
                  <input type="number" value={newGift.price} onChange={e => setNewGift({...newGift, price: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none" />
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowGiftModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold">Cancel</button>
                <button onClick={handleCreateGift} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold">Create Gift</button>
              </div>
            </motion.div>
          </div>
        )}
        {showSupplierModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-lg w-full p-8 shadow-2xl border border-white/10">
              <h2 className="text-2xl font-bold mb-6 text-[#1F2937] dark:text-white">Add New Supplier</h2>
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Supplier Name</label>
                  <input type="text" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. SMM Provider X" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Base URL</label>
                  <input type="text" value={newSupplier.base_url} onChange={e => setNewSupplier({...newSupplier, base_url: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none font-mono text-xs" placeholder="https://api.example.com" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">API Key</label>
                  <input type="password" value={newSupplier.api_key} onChange={e => setNewSupplier({...newSupplier, api_key: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none font-mono text-xs" placeholder="************************" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                    <select 
                      value={newSupplier.type} 
                      onChange={e => setNewSupplier({...newSupplier, type: e.target.value as any})}
                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none"
                    >
                      <option value="products">Products API</option>
                      <option value="number_verification">Number Verification</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Initial Status</label>
                    <select 
                      value={newSupplier.status} 
                      onChange={e => setNewSupplier({...newSupplier, status: e.target.value as any})}
                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowSupplierModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold">Cancel</button>
                <button onClick={handleCreateSupplier} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">Add Supplier</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
