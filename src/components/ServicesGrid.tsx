import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Service, Platform } from '../types';
import { ServiceCard } from './ServiceCard';
import { Search, Filter, Loader2, Zap } from 'lucide-react';
import { cn } from '../utils';
import { fetchResellerProducts, SupplierCategory } from '../services/api';

interface ServicesGridProps {
  onAddToCart: (service: Service) => void;
  onViewAll: () => void;
  onCategoryClick: (category: string) => void;
}

export const ServicesGrid: React.FC<ServicesGridProps> = ({ onAddToCart, onViewAll, onCategoryClick }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<SupplierCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const payload = await fetchResellerProducts();
        if (payload && payload.products.length > 0) {
          setCategories(payload.categories);

          const mappedServices: Service[] = payload.products.map(product => ({
            id: product.id,
            name: product.name,
            platform: product.type as Platform,
            type: product.type,
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
          }));
          
          setServices(mappedServices);
        }
      } catch (e) {
        console.error("Failed to load APIs", e);
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  const filteredServices = services.filter(service => {
    const matchesCategory = activeCategory === 'All' || service.type === activeCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group services by category for the homepage view
  const categorizedServices = categories.map(cat => ({
    ...cat,
    products: services.filter(s => s.type === cat.name).slice(0, 4)
  })).filter(cat => cat.products.length > 0);

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 text-center md:text-left">
        <div className="flex-1">
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4 dark:text-white">Explore Categories</h2>
          <p className="text-slate-500 max-w-xl dark:text-slate-400">Select a category to view all available premium accounts and digital services tailored for your needs.</p>
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <motion.div
              key={cat.name}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => onCategoryClick(cat.name)}
              className="glass p-8 rounded-[2.5rem] border-white/10 cursor-pointer group hover:bg-gradient-to-br hover:from-primary/10 hover:to-secondary/10 transition-all duration-300"
            >
              <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center p-4 mb-6 group-hover:scale-110 transition-transform">
                {cat.icon ? (
                  <img src={cat.icon} alt={cat.name} className="w-full h-full object-contain" />
                ) : (
                  <Zap size={32} className="text-primary" />
                )}
              </div>
              
              <h3 className="text-2xl font-bold dark:text-white group-hover:text-primary transition-colors mb-2">{cat.name}</h3>
              <p className="text-sm text-slate-500 mb-6">Browse premium accounts and services for {cat.name}.</p>
              
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <span>Explore Products</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {services.length > 0 && !loading && (
        <div className="mt-20 text-center">
          <button 
            onClick={onViewAll}
            className="btn-primary py-5 px-12 text-lg rounded-[2.5rem] shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
          >
            Browse Full Catalog ({services.length} Products)
          </button>
        </div>
      )}
    </section>
  );
};
