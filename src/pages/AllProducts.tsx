import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ServiceCard } from '../components/ServiceCard';
import { fetchResellerProducts, SupplierCategory } from '../services/api';
import { Service } from '../types';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '../utils';
import { normalizeCategory } from '../utils/category';
import { supabase } from '../lib/supabase';

interface AllProductsProps {
  onAddToCart: (service: Service) => void;
  initialCategory?: string;
}

export const AllProducts: React.FC<AllProductsProps> = ({ onAddToCart, initialCategory = 'All' }) => {
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<SupplierCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const loadProducts = async () => {
      try {
        const payload = await fetchResellerProducts();
        if (payload && payload.products.length > 0) {
          setCategories(payload.categories);

          const mappedServices: Service[] = payload.products.map((product) => {
            const normalizedName = normalizeCategory(product.type);
            return {
              id: product.id,
              name: product.name,
              platform: normalizedName as any,
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

          // Normalize and deduplicate categories for tabs
          const seen = new Set<string>();
          const uniqueCategories: SupplierCategory[] = [];

          payload.categories.forEach(cat => {
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
        console.error("Failed to load products for All Products page", e);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();

    const channel = supabase.channel('products-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredServices = services.filter(service => {
    const matchesCategory = activeCategory === 'All' || service.type === activeCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pt-24 pb-20 px-4 md:px-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4 text-[#1F2937]">All Products</h1>
          <p className="text-[#6B7280] max-w-xl">
            Browse our complete catalog of premium accounts, digital services, and subscriptions powered directly by our live supplier network.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search all products..."
              value={searchQuery}
              className="w-full sm:w-72 pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Category Filter Tabs with Icons */}
      <div className="flex flex-wrap items-center gap-2 pb-4 mb-8">
        <button
          onClick={() => setActiveCategory('All')}
          className={cn(
            "px-5 py-2 rounded-full text-sm font-medium transition-all",
            activeCategory === 'All' 
              ? "bg-primary text-white shadow-lg shadow-primary/20" 
              : "bg-white text-[#6B7280] border border-slate-200 hover:border-primary/50"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
              activeCategory === cat.name 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "bg-white text-[#6B7280] border border-slate-200 hover:border-primary/50"
            )}
          >
            {cat.icon && (
              <img src={cat.icon} alt="" className="w-4 h-4 rounded-sm object-cover" />
            )}
            {cat.name}
          </button>
        ))}
      </div>

      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 relative min-h-[400px]"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10 rounded-3xl">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {filteredServices.map((service) => (
            <motion.div
              key={service.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <ServiceCard service={service} onAddToCart={onAddToCart} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredServices.length === 0 && !loading && (
        <div className="py-20 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Search size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-[#1F2937]">No products found</h3>
          <p className="text-slate-500">We couldn't find any products in this category. Try adjusting your search.</p>
        </div>
      )}
    </div>
  );
};
