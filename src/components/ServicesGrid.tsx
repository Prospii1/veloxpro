import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Service, Platform } from '../types';
import { ServiceCard } from './ServiceCard';
import { Search, Filter } from 'lucide-react';
import { cn } from '../utils';

interface ServicesGridProps {
  services: Service[];
  onAddToCart: (service: Service) => void;
}

const PLATFORMS: (Platform | 'All')[] = ['All', 'Instagram', 'TikTok', 'YouTube', 'Twitter', 'Facebook'];

export const ServicesGrid: React.FC<ServicesGridProps> = ({ services, onAddToCart }) => {
  const [activePlatform, setActivePlatform] = useState<Platform | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServices = services.filter(service => {
    const matchesPlatform = activePlatform === 'All' || service.platform === activePlatform;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">Explore Our Services</h2>
          <p className="text-slate-500 max-w-md">Choose from our wide range of premium social media marketing services tailored for your growth.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <button className="btn-secondary py-2.5 px-4">
            <Filter size={18} />
            Filters
          </button>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {PLATFORMS.map((platform) => (
          <button
            key={platform}
            onClick={() => setActivePlatform(platform)}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              activePlatform === platform 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-primary/50"
            )}
          >
            {platform}
          </button>
        ))}
      </div>

      <motion.div 
        layout
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
      >
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

      {filteredServices.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Search size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">No services found</h3>
          <p className="text-slate-500">Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      )}
    </section>
  );
};
