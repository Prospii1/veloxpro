/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  History, 
  Plus,
  Zap,
  Gift,
  Search,
  ChevronRight,
  Loader2,
  ArrowRight,
  Phone,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { cn } from '../utils';
import { fetchResellerProducts, SupplierCategory } from '../services/api';
import { normalizeCategory } from '../utils/category';
import { Service, Platform } from '../types';

interface DashboardProps {
  onDocumentationClick?: () => void;
  onFundWalletClick?: () => void;
  onGiftsClick?: () => void;
  onNumberVerificationClick?: () => void;
  onOrderHistoryClick?: () => void;
  onCategoryClick?: (category: string) => void;
  onAddToCart?: (service: Service) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onFundWalletClick,
  onGiftsClick,
  onNumberVerificationClick,
  onOrderHistoryClick,
  onAddToCart
}) => {
  const { profile } = useAuth();
  const { formatPrice } = useCurrency();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<SupplierCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadServices = async () => {
      try {
        const payload = await fetchResellerProducts();
        if (payload) {
          const mappedServices: Service[] = payload.products.map(product => {
            const normalizedName = normalizeCategory(product.type);
            return {
              id: product.id,
              name: product.name,
              platform: normalizedName as Platform,
              type: normalizedName,
              category: 'External Services',
              pricePer1000: product.price,
              minOrder: 1,
              maxOrder: 1,
              description: product.description,
              features: ['Instant Delivery', 'Premium Quality', 'Secured'],
              icon: product.iconUrl || 'Zap',
              deliveryTime: 'Instant',
              rating: 5.0,
              reviews: Math.floor(Math.random() * 500) + 50
            };
          });

          const seen = new Set<string>();
          const uniqueCategories: SupplierCategory[] = [];
          
          // Sort categories by priority: Facebook, Instagram, Twitter, TikTok first
          const priority = ['Facebook', 'Instagram', 'Twitter', 'TikTok'];
          const sortedCats = [...payload.categories].sort((a, b) => {
            const indexA = priority.indexOf(normalizeCategory(a.name));
            const indexB = priority.indexOf(normalizeCategory(b.name));
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(b.name);
          });

          sortedCats.forEach(cat => {
            const normalized = normalizeCategory(cat.name);
            if (!seen.has(normalized)) {
              seen.add(normalized);
              uniqueCategories.push({ ...cat, name: normalized });
            }
          });
          
          setCategories(uniqueCategories);
          setServices(mappedServices);
        }
      } catch (e) {
        console.error("Dashboard: Failed to load payload", e);
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  const filteredServices = services.filter(service => {
    const matchesCategory = activeCategory === 'All' || service.type === activeCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pt-32 pb-20 px-4 md:px-6 max-w-7xl mx-auto space-y-10">
      {/* A. WALLET SUMMARY */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { 
              label: 'Current Balance', 
              value: profile?.wallet_balance || 0, 
              icon: Wallet, 
              color: 'text-emerald-500', 
              bg: 'bg-emerald-500/10',
              showPlus: true,
              onClick: onFundWalletClick
            },
            { 
              label: 'Total Deposit', 
              value: profile?.total_deposit || 0, 
              icon: Plus, 
              color: 'text-primary', 
              bg: 'bg-primary/10' 
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-3xl border border-white/10 shadow-sm flex items-center justify-between group"
            >
              <div className="flex items-center gap-5">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
                  <stat.icon size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6B7280] dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white">{formatPrice(stat.value)}</h3>
                </div>
              </div>

              {stat.showPlus && (
                <button 
                  onClick={stat.onClick}
                  title="Add Funds"
                  className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                  <Plus size={20} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* B. QUICK ACTIONS */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Fund Wallet', icon: Wallet, color: 'bg-emerald-500', onClick: onFundWalletClick },
            { label: 'Order a Gift', icon: Gift, color: 'bg-primary', onClick: onGiftsClick },
            { label: 'Number Verification', icon: Phone, color: 'bg-cyan-500', onClick: onNumberVerificationClick },
            { label: 'View Orders', icon: History, color: 'bg-amber-500', onClick: onOrderHistoryClick },
          ].map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-all group shadow-sm active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/5", action.color)}>
                  <action.icon size={18} />
                </div>
                <span className="text-sm font-bold text-[#1F2937] dark:text-white group-hover:text-primary transition-colors">{action.label}</span>
              </div>
              <ChevronRight size={16} className="text-[#6B7280] group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>
      </section>

      {/* C. PRODUCT CATEGORIES + PRODUCTS */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-[#1F2937] dark:text-white">Product Categories</h2>
            <p className="text-sm text-[#6B7280] dark:text-slate-400">Quickly browse and purchase accounts.</p>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" size={18} />
            <input 
              type="text" 
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all text-[#1F2937] dark:text-white"
            />
          </div>
        </div>

        {/* Categories horizontal scroll */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <button
            onClick={() => setActiveCategory('All')}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all",
              activeCategory === 'All' 
                ? "bg-primary text-white shadow-lg shadow-primary/25" 
                : "bg-slate-100 dark:bg-slate-800 text-[#6B7280] dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            All Services
          </button>
          {categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => setActiveCategory(cat.name)}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2",
                activeCategory === cat.name 
                  ? "bg-primary text-white shadow-lg shadow-primary/25" 
                  : "bg-slate-100 dark:bg-slate-800 text-[#6B7280] dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {cat.icon && <img src={cat.icon} alt="" className="w-4 h-4 rounded object-cover" />}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="col-span-full h-48 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <motion.div
                  key={service.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100 dark:border-slate-700">
                      {service.icon && typeof service.icon === 'string' && service.icon.startsWith('http') ? (
                        <img src={service.icon} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Zap size={20} className="text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#1F2937] dark:text-white truncate group-hover:text-primary transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-[10px] text-[#6B7280] dark:text-slate-500 font-medium italic">
                        {service.type}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-[#6B7280] block mb-0.5">Price</span>
                      <span className="text-base font-bold text-primary">{formatPrice(service.pricePer1000)}</span>
                    </div>
                    <button 
                      onClick={() => onAddToCart?.(service)}
                      className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <LayoutGrid className="text-[#6B7280]" size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#1F2937] dark:text-white">No products found</h3>
                <p className="text-[#6B7280] dark:text-slate-400">Try adjusting your search or category filter.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};
