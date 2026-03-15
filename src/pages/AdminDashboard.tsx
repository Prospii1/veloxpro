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
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils';

type AdminTab = 'overview' | 'products' | 'gifts' | 'users' | 'orders' | 'api';

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
    { id: 'gifts', icon: Gift, label: 'Gift Management' },
    { id: 'orders', icon: ShoppingCart, label: 'Orders' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'api', icon: Settings, label: 'API Settings' },
  ];

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
            <h1 className="text-2xl font-bold font-display">Dashboard</h1>
          </div>
          
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold",
                activeTab === item.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/25" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
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
            <button className="btn-primary flex items-center gap-2 px-6">
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
                    { label: 'Total Revenue', value: '$124,592', trend: '+12.5%', isUp: true },
                    { label: 'Active Orders', value: '452', trend: '+5.2%', isUp: true },
                    { label: 'Total Users', value: '52,190', trend: '-2.4%', isUp: false },
                    { label: 'Conversion Rate', value: '3.2%', trend: '+0.8%', isUp: true },
                  ].map((stat, i) => (
                    <div key={i} className="glass p-8 rounded-[2rem] border-white/5 bg-white/50 dark:bg-slate-900/50">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                      <div className="flex items-end justify-between">
                        <h4 className="text-3xl font-bold font-display">{stat.value}</h4>
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
                <div className="glass overflow-hidden rounded-[2.5rem] border-white/5">
                  <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-bold font-display">Recent Orders</h3>
                    <button className="text-sm font-bold text-primary hover:underline">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-white/5">
                          <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Order ID</th>
                          <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Customer</th>
                          <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                          <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                          <th className="px-8 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-8 py-6 font-mono text-sm">#ORD-523{i}</td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">JD</div>
                                <span className="font-bold">John Doe</span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                                Completed
                              </span>
                            </td>
                            <td className="px-8 py-6 font-bold">$124.99</td>
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

            {activeTab !== 'overview' && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass p-20 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-6"
              >
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  {React.createElement(sidebarItems.find(it => it.id === activeTab)?.icon || LayoutDashboard, { size: 40 })}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Management Module</h3>
                  <p className="text-slate-500 max-w-sm">The <strong>{activeTab}</strong> management interface is under construction and will be available in the next update.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
