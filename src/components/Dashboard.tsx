import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Wallet, 
  History, 
  Settings, 
  LogOut, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ShieldCheck,
  Zap,
  Code
} from 'lucide-react';
import { Order } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { cn } from '../utils';
import { APISettings } from './APISettings';

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-7241',
    serviceName: 'Instagram Real Followers',
    platform: 'Instagram',
    quantity: 1000,
    status: 'In Progress',
    date: '2024-03-07',
    total: 4.50,
    progress: 65
  },
  {
    id: 'ORD-7238',
    serviceName: 'TikTok Viral Likes',
    platform: 'TikTok',
    quantity: 5000,
    status: 'Completed',
    date: '2024-03-05',
    total: 10.50,
    progress: 100
  },
  {
    id: 'ORD-7235',
    serviceName: 'YouTube High Retention Views',
    platform: 'YouTube',
    quantity: 10000,
    status: 'Processing',
    date: '2024-03-04',
    total: 35.00
  }
];

interface DashboardProps {
  onDocumentationClick?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onDocumentationClick }) => {
  const { formatPrice } = useCurrency();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'api-settings'>('overview');

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="glass p-4 rounded-3xl space-y-2 sticky top-32">
          {[
            { 
              icon: LayoutDashboard, 
              label: 'Overview', 
              active: activeTab === 'overview' && !isAdmin, 
              onClick: () => { setIsAdmin(false); setActiveTab('overview'); } 
            },
            { icon: ShoppingBag, label: 'New Order', active: false },
            { icon: History, label: 'Order History', active: false },
            { icon: Wallet, label: 'Add Funds', active: false },
            { 
              icon: Code, 
              label: 'API Settings', 
              active: activeTab === 'api-settings' && !isAdmin, 
              onClick: () => { setIsAdmin(false); setActiveTab('api-settings'); } 
            },
            { icon: Settings, label: 'Settings', active: false },
            { icon: ShieldCheck, label: 'Admin Panel', active: isAdmin, onClick: () => setIsAdmin(true) },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                item.active 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-[#6B7280] dark:text-slate-400"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow space-y-8">
        {isAdmin ? (
          <div className="space-y-8">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold font-display text-[#1F2937] dark:text-white">Admin Control Center</h1>
                <p className="text-[#6B7280] dark:text-slate-400">Manage services, orders, and system analytics.</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary text-sm">Export Data</button>
                <button className="btn-primary text-sm">System Settings</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Total Revenue', value: formatPrice(45280.00), color: 'text-emerald-500' },
                { label: 'Active Users', value: '12,402', color: 'text-primary' },
                { label: 'Pending Orders', value: '48', color: 'text-amber-500' },
              ].map((stat, i) => (
                <div key={i} className="glass p-6 rounded-3xl">
                  <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">{stat.label}</p>
                  <h3 className={cn("text-2xl font-bold text-[#1F2937] dark:text-white", stat.color)}>{stat.value}</h3>
                </div>
              ))}
            </div>

            <div className="glass rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-6 text-[#1F2937] dark:text-white">Service Management</h3>
              <div className="space-y-4">
                {['Instagram Followers', 'TikTok Likes', 'YouTube Views'].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] dark:bg-slate-800 flex items-center justify-center">
                        <Zap size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-[#1F2937] dark:text-white">{s}</p>
                        <p className="text-xs text-[#6B7280] dark:text-slate-500">Active • 1,240 orders today</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-[#6B7280]"><Settings size={16} /></button>
                      <button className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"><AlertCircle size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'api-settings' ? (
          <APISettings onDocumentationClick={onDocumentationClick} />
        ) : (
          <>
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold font-display text-[#1F2937] dark:text-white">Welcome back, Alex!</h1>
                <p className="text-[#6B7280] dark:text-slate-400">Here's what's happening with your account today.</p>
              </div>
              <button className="btn-primary">
                <Plus size={18} />
                New Order
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Wallet Balance', value: formatPrice(124.50), icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Total Spent', value: formatPrice(1240.00), icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
                { label: 'Active Orders', value: '3', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { label: 'Completed', value: '142', icon: CheckCircle2, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass p-6 rounded-3xl"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", stat.bg, stat.color)}>
                    <stat.icon size={20} />
                  </div>
                  <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white">{stat.value}</h3>
                </motion.div>
              ))}
            </div>

            {/* Recent Orders */}
            <div className="glass rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                <h2 className="text-xl font-bold text-[#1F2937] dark:text-white">Recent Orders</h2>
                <button className="text-sm font-bold text-primary hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Service</th>
                      <th className="px-6 py-4">Quantity</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Progress</th>
                      <th className="px-6 py-4">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {MOCK_ORDERS.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-[#6B7280]">{order.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#1F2937] dark:text-white">{order.serviceName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#1F2937] dark:text-white">{order.quantity.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            order.status === 'Completed' ? "bg-emerald-500/10 text-emerald-500" :
                            order.status === 'In Progress' ? "bg-primary/10 text-primary" :
                            "bg-amber-500/10 text-amber-500"
                          )}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {order.progress !== undefined ? (
                            <div className="w-24 h-1.5 bg-[#F3F4F6] dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${order.progress}%` }}
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-[#6B7280]">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-[#1F2937] dark:text-white">{formatPrice(order.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* API Card */}
            <div className="glass p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-primary/10 shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-grow">
                  <h2 className="text-2xl font-bold mb-2 text-[#1F2937] dark:text-white">Reseller API Integration</h2>
                  <p className="text-[#6B7280] dark:text-slate-400 mb-6">Connect your own panel to our high-speed API and start reselling our services with custom margins.</p>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => setActiveTab('api-settings')}
                      className="btn-primary py-2 px-6 text-sm"
                    >
                      Get API Key
                    </button>
                    <button 
                      onClick={onDocumentationClick}
                      className="btn-secondary py-2 px-6 text-sm"
                    >
                      Documentation
                    </button>
                  </div>
                </div>
                <div className="w-32 h-32 shrink-0 bg-[#F3F4F6] dark:bg-slate-800 rounded-2xl shadow-inner flex items-center justify-center border border-slate-100 dark:border-slate-700">
                  <AlertCircle size={48} className="text-primary opacity-20" />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
