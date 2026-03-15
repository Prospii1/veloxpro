import React from 'react';
import { motion } from 'motion/react';
import { Service } from '../types';
import { cn } from '../utils';
import { useCurrency } from '../contexts/CurrencyContext';
import { Star, Clock, ArrowRight, Zap } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  onAddToCart: (service: Service) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onAddToCart }) => {
  const { formatPrice } = useCurrency();
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="glass p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col h-full group"
    >
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
          {service.icon && typeof service.icon === 'string' && service.icon.startsWith('http') ? (
            <img 
              src={service.icon} 
              alt={service.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M4 14.71 14 2.5l-2 9.29h8l-10 12.21 2-9.29H4z"/></svg>';
              }}
            />
          ) : (
            <Zap size={20} className="text-primary" />
          )}
        </div>
        <div className="flex items-center gap-1 text-amber-500 text-[10px] md:text-sm font-bold">
          <Star size={12} className="md:w-3.5 md:h-3.5" fill="currentColor" />
          {service.rating}
        </div>
      </div>

      <h3 className="text-sm md:text-lg font-bold mb-1 md:mb-2 group-hover:text-primary transition-colors line-clamp-1">
        {service.name}
      </h3>
      
      <p className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400 mb-4 md:mb-6 flex-grow line-clamp-2">
        {service.description}
      </p>

      <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
        <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-slate-500">
          <Clock size={12} className="md:w-3.5 md:h-3.5" />
          <span className="hidden sm:inline">Delivery:</span> <span className="font-semibold text-slate-700 dark:text-slate-300">{service.deliveryTime}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-[10px] text-slate-500 block leading-none mb-1">From</span>
          <span className="text-sm md:text-xl font-bold text-primary">{formatPrice(service.pricePer1000)}</span>
        </div>
        <button 
          onClick={() => onAddToCart(service)}
          className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <ArrowRight size={14} className="md:w-[18px] md:h-[18px]" />
        </button>
      </div>
    </motion.div>
  );
};
