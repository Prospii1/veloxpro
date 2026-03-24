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
  ToggleRight,
  Edit2,
  FolderOpen,
  Key,
  Eye,
  EyeOff
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
  Supplier,
  createCategory,
  updateCategory,
  deleteCategory
} from '../services/api';

type AdminTab = 'overview' | 'categories' | 'products' | 'gifts' | 'users' | 'orders' | 'suppliers' | 'settings';

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
    { id: 'categories', icon: FolderOpen, label: 'Categories' },
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
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showSupplierKey, setShowSupplierKey] = useState(false);
  const [newProduct, setNewProduct] = useState({ id: '', name: '', type: '', base_price: 0, markup: 0, stock_quantity: 0, description: '', icon_url: '', image_url: '', category_id: '', availability: true, created_by: '' });
  const [newCategory, setNewCategory] = useState({ id: '', name: '', logo_image_url: '' });
  const [newGift, setNewGift] = useState({ name: '', description: '', price: 0, image_url: '', availability_status: 'active' });
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: '', base_url: '', api_key: '', type: 'products', status: 'active', documentation: ''
  });
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'products') { fetchProducts(); fetchCategories(); }
    if (activeTab === 'gifts') fetchGifts();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'orders' || activeTab === 'overview') fetchOrders();
    if (activeTab === 'suppliers') getSuppliers();
    if (activeTab === 'settings') fetchSettings();

    const channel = supabase.channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        if (activeTab === 'categories') fetchCategories();
        if (activeTab === 'products') fetchCategories();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        if (activeTab === 'products') fetchProducts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gifts' }, () => {
        if (activeTab === 'gifts') fetchGifts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        if (activeTab === 'orders' || activeTab === 'overview') fetchOrders();
        fetchStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        if (activeTab === 'users') fetchUsers();
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        naira_rate: 1700,
        api_keys: { supplier_api_key: '', supplier_api_url: '', number_api_key: '' }
      };

      if (data && data.length > 0) {
        data.forEach(row => {
          if (row.key === 'markup_settings') {
            mergedSettings.global_markup = row.value?.global_markup ?? 0.20;
            mergedSettings.category_markups = row.value?.category_markups || {};
          }
          if (row.key === 'currency_settings') {
            mergedSettings.naira_rate = row.value?.naira_rate ?? 1700;
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

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('name', { ascending: true });
    if (data) setCategories(data);
    setLoading(false);
  };

  const [userStats, setUserStats] = useState<Record<string, { deposited: number, used: number }>>({});

  const fetchUsers = async () => {
    setLoading(true);
    const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: ordersData } = await supabase.from('orders').select('user_id, amount').eq('status', 'completed');
    
    if (usersData) {
      const stats: Record<string, { used: number, deposited: number }> = {};
      usersData.forEach((u: any) => {
        const used = ordersData?.filter((o: any) => o.user_id === u.id).reduce((sum: number, o: any) => sum + (o.amount || 0), 0) || 0;
        const deposited = (u.wallet_balance || 0) + used;
        stats[u.id] = { used, deposited };
      });
      setUserStats(stats);
      setUsers(usersData);
    }
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
    // Ensure price is saved correctly
    const productData = {
      ...newProduct,
      price: Number(newProduct.base_price) + Number(newProduct.markup),
      created_by: 'admin'
    };
    
    setLoading(true);
    try {
      if (!productData.id) {
        const { id, ...rest } = productData;
        const { error } = await supabase.from('products').insert([rest]);
        if (!error) {
          setShowProductModal(false);
          fetchProducts();
        } else {
          alert("Error creating product: " + error.message);
        }
      } else {
        const { error } = await supabase.from('products').update(productData).eq('id', productData.id);
        if (!error) {
          setShowProductModal(false);
          fetchProducts();
        } else {
          alert("Error updating product: " + error.message);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) fetchProducts();
  };

  const handleSaveCategory = async () => {
    if (!newCategory.name) {
      alert("Category name is required");
      return;
    }

    if (newCategory.id) {
      const { error } = await supabase.from('categories').update({
        name: newCategory.name,
        logo_image_url: newCategory.logo_image_url
      }).eq('id', newCategory.id);
      
      if (!error) {
        setShowCategoryModal(false);
        fetchCategories();
      } else {
        alert("Error updating category: " + error.message);
      }
    } else {
      const { id, ...rest } = newCategory;
      const { error } = await supabase.from('categories').insert([rest]);
      
      if (!error) {
        setShowCategoryModal(false);
        fetchCategories();
      } else {
        alert("Error creating category: " + error.message);
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    // Check if products exist in this category
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (countError) {
      console.error("Error checking products in category:", countError);
    }

    if (count && count > 0) {
      if (!window.confirm(`This category has ${count} products. Are you sure you want to delete it? All products in this category will lose their category association.`)) {
        return;
      }
    } else {
      if (!window.confirm("Are you sure you want to delete this category?")) return;
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) fetchCategories();
    else alert("Error deleting category: " + error.message);
  };

  const handleUpdateSettings = async () => {
    setLoading(true);
    try {
      const markupValue = { global_markup: settings.global_markup, category_markups: settings.category_markups };
      const currencyValue = { naira_rate: settings.naira_rate };
      const apiValue = settings.api_keys;

      const { error: error1 } = await supabase.from('system_settings').upsert({ key: 'markup_settings', value: markupValue }, { onConflict: 'key' });
      const { error: error2 } = await supabase.from('system_settings').upsert({ key: 'currency_settings', value: currencyValue }, { onConflict: 'key' });
      const { error: error3 } = await supabase.from('system_settings').upsert({ key: 'api_keys', value: apiValue }, { onConflict: 'key' });
      
      if (!error1 && !error2 && !error3) {
        alert("Settings updated successfully!");
      } else {
        alert("Failed to update settings. Check console.");
        console.error(error1 || error2 || error3);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async () => {
    try {
      if (!newSupplier.name || !newSupplier.base_url || !newSupplier.api_key) {
        alert("Name, Base URL, and API Key are required.");
        return;
      }
      if (newSupplier.id) {
        await updateSupplier(newSupplier.id, newSupplier);
      } else {
        await createSupplier(newSupplier as Omit<Supplier, 'id' | 'created_at' | 'updated_at'>);
      }
      setShowSupplierModal(false);
      setNewSupplier({ name: '', base_url: '', api_key: '', type: 'products', status: 'active', documentation: '' });
      getSuppliers();
    } catch (e: any) {
      alert(e.message || "Failed to save supplier");
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
                if (activeTab === 'categories') {
                  setNewCategory({ id: '', name: '', logo_image_url: '' });
                  setShowCategoryModal(true);
                }
                if (activeTab === 'products') {
                  setNewProduct({ id: '', name: '', type: '', base_price: 0, markup: 0, stock_quantity: 0, description: '', icon_url: '', image_url: '', category_id: '', availability: true, created_by: 'admin' });
                  setShowProductModal(true);
                }
                if (activeTab === 'gifts') setShowGiftModal(true);
                if (activeTab === 'suppliers') {
                  setNewSupplier({ name: '', base_url: '', api_key: '', type: 'products', status: 'active', documentation: '' });
                  setShowSupplierModal(true);
                }
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
                        {orders.slice(0, 5).map((o, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-8 py-6 font-mono text-sm text-[#6B7280] dark:text-slate-400">#{o.id.split('-')[0]}</td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                  {users.find(u => u.id === o.user_id)?.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <span className="font-bold text-[#1F2937] dark:text-white">
                                  {users.find(u => u.id === o.user_id)?.email || 'Unknown User'}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={cn(
                                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold",
                                o.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
                              )}>
                                {o.status}
                              </span>
                            </td>
                             <td className="px-8 py-6 font-bold text-[#1F2937] dark:text-white">${o.amount?.toFixed(2)}</td>
                            <td className="px-8 py-6 text-slate-500 text-sm">{new Date(o.created_at).toLocaleDateString()}</td>
                            <td className="px-8 py-6 text-right">
                              <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                                <MoreVertical size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && !loading && (
                          <tr>
                            <td colSpan={6} className="px-8 py-12 text-center text-slate-400">
                              No recent orders found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'categories' && (
              <motion.div key="categories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 overflow-hidden rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <h3 className="text-xl font-bold font-display text-[#1F2937] dark:text-white">Categories</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/5">
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Icon</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Name</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Created At</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {categories.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="px-8 py-4">
                            {c.logo_image_url ? (
                              <img src={c.logo_image_url} alt={c.name} className="w-10 h-10 rounded-xl object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <FolderOpen size={20} />
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-6 font-bold text-[#1F2937] dark:text-white">{c.name}</td>
                          <td className="px-8 py-6 text-[#6B7280] text-sm">{new Date(c.created_at).toLocaleDateString()}</td>
                          <td className="px-8 py-6 text-right space-x-2">
                             <button 
                               onClick={() => {
                                 setNewCategory({ id: c.id, name: c.name, logo_image_url: c.logo_image_url || '' });
                                 setShowCategoryModal(true);
                               }}
                               className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                             >
                               <Edit2 size={16} />
                             </button>
                             <button 
                               onClick={() => handleDeleteCategory(c.id)}
                               className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                             >
                               <Trash2 size={16} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                          <td className="px-8 py-6 text-[#6B7280]">{categories.find(c => c.id === p.category_id)?.name || p.type}</td>
                          <td className="px-8 py-6 text-[#6B7280]">${p.base_price?.toFixed(2)}</td>
                          <td className="px-8 py-6 font-bold text-[#1F2937] dark:text-white">${p.price?.toFixed(2)}</td>
                          <td className="px-8 py-6 text-[#6B7280]">
                            <div className="flex items-center gap-2">
                              <span>{p.stock_quantity ?? 'N/A'}</span>
                              {p.supplier_id && (
                                <button 
                                  onClick={async (e) => {
                                    const btn = e.currentTarget;
                                    btn.classList.add('animate-spin');
                                    try {
                                      const resp = await fetch('/api/reseller/sync-stock', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ productId: p.id })
                                      });
                                      if (resp.ok) fetchProducts();
                                    } finally {
                                      btn.classList.remove('animate-spin');
                                    }
                                  }}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-primary transition-colors"
                                  title="Sync Stock from Supplier"
                                >
                                  <Zap size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold",
                              p.availability ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                            )}>
                              {p.availability ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center justify-end gap-2">
                               <button 
                                 onClick={() => {
                                   setNewProduct({
                                     id: p.id,
                                     name: p.name,
                                     type: p.type,
                                     base_price: p.base_price || 0,
                                     markup: (p.price || 0) - (p.base_price || 0),
                                     stock_quantity: p.stock_quantity || 0,
                                     description: p.description || '',
                                     icon_url: p.icon_url || '',
                                     image_url: p.image_url || '',
                                     category_id: p.category_id || '',
                                     availability: p.availability,
                                     created_by: p.created_by || ''
                                   });
                                   setShowProductModal(true);
                                 }}
                                 className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                               >
                                 <Edit2 size={16} />
                               </button>
                               <button 
                                 onClick={() => handleToggleProductStatus(p.id, p.availability)}
                                 className={cn(
                                   "text-xs font-bold px-3 py-1.5 rounded-lg transition-all",
                                   p.availability ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20" : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                 )}
                               >
                                 {p.availability ? 'Disable' : 'Enable'}
                               </button>
                               <button 
                                 onClick={() => handleDeleteProduct(p.id)}
                                 className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                               >
                                 <Trash2 size={16} />
                               </button>
                             </div>
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
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">User</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Product</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase text-center">Qty</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase text-center">Unit Price</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Total</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Status</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Payment</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Supplier</th>
                        <th className="px-8 py-4 text-xs font-bold text-[#6B7280] uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="px-8 py-6 font-mono text-xs">{o.id.split('-')[0]}...</td>
                          <td className="px-8 py-6 font-bold text-[#1F2937] dark:text-white">
                            {users.find(u => u.id === o.user_id)?.email || 'Unknown'}
                          </td>
                          <td className="px-8 py-6 font-bold text-[#1F2937] dark:text-white">{o.product_name}</td>
                          <td className="px-8 py-6 text-center font-bold text-slate-500">{o.quantity || 1}</td>
                          <td className="px-8 py-6 text-center font-bold text-[#1F2937] dark:text-white">${(o.unit_price || o.amount).toFixed(2)}</td>
                          <td className="px-8 py-6 font-bold text-primary">${o.amount?.toFixed(2)}</td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold",
                              o.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
                            )}>
                              {o.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-slate-500">Wallet</td>
                          <td className="px-8 py-6 text-slate-500">
                            {o.product_type === 'supplier_product' ? 'API Supplier' : 'Local Gift'}
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
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Username</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Email</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Wallet</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Total Deposit</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Total Used</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">Joined</th>
                        <th className="px-8 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="px-8 py-6 font-bold text-[#1F2937] dark:text-white">{u.email?.split('@')[0] || 'User'}</td>
                          <td className="px-8 py-6 text-slate-500 text-sm">{u.email}</td>
                          <td className="px-8 py-6 font-bold text-primary">${u.wallet_balance?.toFixed(2)}</td>
                          <td className="px-8 py-6 font-bold text-emerald-500">${userStats[u.id]?.deposited.toFixed(2)}</td>
                          <td className="px-8 py-6 font-bold text-orange-500">${userStats[u.id]?.used.toFixed(2)}</td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold",
                              u.status === 'suspended' ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                            )}>
                              {u.status === 'suspended' ? 'Suspended' : 'Active'}
                            </span>
                          </td>
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
                                onClick={() => {
                                  setNewSupplier(s);
                                  setShowSupplierModal(true);
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-blue-500"
                                title="Edit Supplier"
                              >
                                <Edit2 size={16} />
                              </button>
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

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-8">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                         <Globe size={16} className="text-emerald-500" />
                         Naira Conversion Rate (₦/$)
                      </label>
                      <p className="text-xs text-slate-400">Used for calculating prices in NGN across the site.</p>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₦</span>
                        <input 
                          type="number" 
                          value={settings.naira_rate} 
                          onChange={e => setSettings({...settings, naira_rate: Number(e.target.value)})}
                          className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-10 py-4 outline-none border border-transparent focus:border-primary/20 transition-all font-bold text-lg" 
                        />
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
                       <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                          <Key size={16} className="text-amber-500" />
                          Master API Configuration
                       </h4>
                       <p className="text-xs text-slate-400">These are the default keys used by the backend if no specific supplier is assigned to a product.</p>
                       
                       <div className="space-y-4">
                         <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase">Default Supplier API URL</label>
                           <input 
                             type="text" 
                             value={settings.api_keys?.supplier_api_url} 
                             onChange={e => setSettings({...settings, api_keys: {...settings.api_keys, supplier_api_url: e.target.value}})}
                             className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none font-mono text-xs" 
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase">Default Supplier API Key</label>
                           <input 
                             type="password" 
                             value={settings.api_keys?.supplier_api_key} 
                             onChange={e => setSettings({...settings, api_keys: {...settings.api_keys, supplier_api_key: e.target.value}})}
                             className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none font-mono text-xs" 
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase">Korapay Secret Key</label>
                           <input 
                             type="password" 
                             value={settings.api_keys?.korapay_secret_key} 
                             onChange={e => setSettings({...settings, api_keys: {...settings.api_keys, korapay_secret_key: e.target.value}})}
                             className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none font-mono text-xs" 
                           />
                         </div>
                       </div>
                    </div>

                    <p className="text-xs text-slate-400 italic">
                      Individual API suppliers can be managed independently in the <strong>Suppliers</strong> tab.
                    </p>
                  </div>

                  <button 
                    onClick={handleUpdateSettings}
                    disabled={loading}
                    className="btn-primary w-full py-5 rounded-[2rem] font-bold text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={24} className="animate-spin" /> : 'Save Configuration'}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-lg w-full p-8 shadow-2xl border border-white/10 my-8">
              <h2 className="text-2xl font-bold mb-6 text-[#1F2937] dark:text-white">{newProduct.id ? 'Edit Product' : 'Create New Product'}</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Product Name</label>
                  <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none" placeholder="e.g. Netflix Premium" />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                  <select 
                    value={newProduct.category_id} 
                    onChange={e => {
                      const cat = categories.find(c => c.id === e.target.value);
                      setNewProduct({...newProduct, category_id: e.target.value, type: cat?.name || ''});
                    }} 
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                  <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none h-24" placeholder="Product details..." />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Image URL</label>
                  <input type="text" value={newProduct.image_url} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none" placeholder="https://example.com/image.png" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Base Price ($) <span className="text-[10px] lowercase font-normal">(Supplier Cost)</span></label>
                  <input 
                    type="number" 
                    disabled={!!newProduct.id && newProduct.created_by !== 'admin'}
                    value={newProduct.base_price} 
                    onChange={e => setNewProduct({...newProduct, base_price: Number(e.target.value)})} 
                    className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl px-4 py-3 outline-none opacity-70" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase">Selling Price ($)</label>
                  <input 
                    type="number" 
                    value={(Number(newProduct.base_price) + Number(newProduct.markup)).toFixed(2)} 
                    onChange={e => {
                      const sellingPrice = Number(e.target.value);
                      const markup = sellingPrice - Number(newProduct.base_price);
                      setNewProduct({...newProduct, markup});
                    }} 
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none border-2 border-primary/20 focus:border-primary transition-all font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Stock</label>
                  <input type="number" value={newProduct.stock_quantity} onChange={e => setNewProduct({...newProduct, stock_quantity: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none" />
                </div>
                <div className="space-y-2 flex items-end pb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newProduct.availability} onChange={e => setNewProduct({...newProduct, availability: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" />
                    <span className="text-xs font-bold text-slate-500 uppercase">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowProductModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold">Cancel</button>
                <button onClick={handleCreateProduct} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold">{newProduct.id ? 'Save Changes' : 'Create Product'}</button>
              </div>
            </motion.div>
          </div>
        )}

        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-md w-full p-8 shadow-2xl border border-white/10">
              <h2 className="text-2xl font-bold mb-6 text-[#1F2937] dark:text-white">{newCategory.id ? 'Edit Category' : 'Add New Category'}</h2>
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Category Name</label>
                  <input type="text" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none" placeholder="e.g. Streaming" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Logo Image URL</label>
                  <input type="text" value={newCategory.logo_image_url} onChange={e => setNewCategory({...newCategory, logo_image_url: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 outline-none" placeholder="https://example.com/logo.png" />
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowCategoryModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold">Cancel</button>
                <button onClick={handleSaveCategory} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold">{newCategory.id ? 'Save Changes' : 'Create Category'}</button>
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
              <h2 className="text-2xl font-bold mb-6 text-[#1F2937] dark:text-white">{newSupplier.id ? 'Edit Supplier' : 'Add New Supplier'}</h2>
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
                  <div className="relative">
                    <input 
                      type={showSupplierKey ? "text" : "password"} 
                      value={newSupplier.api_key} 
                      onChange={e => setNewSupplier({...newSupplier, api_key: e.target.value})} 
                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 pr-12 outline-none font-mono text-xs" 
                      placeholder="************************" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowSupplierKey(!showSupplierKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                    >
                      {showSupplierKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
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
                <button onClick={() => { setShowSupplierModal(false); setNewSupplier({ name: '', base_url: '', api_key: '', type: 'products', status: 'active', documentation: '' }); }} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold">Cancel</button>
                <button onClick={handleCreateSupplier} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">{newSupplier.id ? 'Save Changes' : 'Add Supplier'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
