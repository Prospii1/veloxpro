import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, ArrowRight, ShieldCheck, Zap, Info } from 'lucide-react';
import { Service } from '../types';
import { cn } from '../utils';

interface ServiceDetailsModalProps {
  service: Service | null;
  onClose: () => void;
  onAddToCart: (service: Service, quantity: number, targetUrl: string) => void;
}

export const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({
  service,
  onClose,
  onAddToCart
}) => {
  const [quantity, setQuantity] = useState(1000);
  const [targetUrl, setTargetUrl] = useState('');
  const [error, setError] = useState('');

  if (!service) return null;

  const totalPrice = (service.pricePer1000 * quantity) / 1000;

  const handleAddToCart = () => {
    if (!targetUrl) {
      setError('Please enter a valid URL or Username');
      return;
    }
    if (quantity < service.minOrder || quantity > service.maxOrder) {
      setError(`Quantity must be between ${service.minOrder} and ${service.maxOrder}`);
      return;
    }
    onAddToCart(service, quantity, targetUrl);
    onClose();
  };

  return (
    <AnimatePresence>
      {service && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl glass rounded-[2.5rem] z-[90] overflow-hidden shadow-2xl"
          >
            <div className="flex flex-col md:flex-row h-full">
              {/* Left Side: Info */}
              <div className="md:w-5/12 p-8 bg-primary/5 dark:bg-primary/10 border-r border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center mb-6">
                  <Zap size={32} className="text-primary" fill="currentColor" />
                </div>
                <h2 className="text-2xl font-bold mb-4">{service.name}</h2>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                  {service.description}
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <ShieldCheck size={16} />
                    </div>
                    <span>High Retention Guaranteed</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Zap size={16} />
                    </div>
                    <span>Instant Start Delivery</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <Info size={16} />
                    </div>
                    <span>30-Day Refill Policy</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Form */}
              <div className="md:w-7/12 p-8 relative">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X size={20} />
                </button>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Link / Username</label>
                    <input 
                      type="text" 
                      placeholder="https://instagram.com/p/..."
                      value={targetUrl}
                      onChange={(e) => { setTargetUrl(e.target.value); setError(''); }}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</label>
                      <span className="text-[10px] text-slate-400">Min: {service.minOrder} / Max: {service.maxOrder}</span>
                    </div>
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => { setQuantity(parseInt(e.target.value) || 0); setError(''); }}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-500 font-medium">{error}</p>
                  )}

                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-500">Price per 1,000</span>
                      <span className="font-bold">${service.pricePer1000.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-lg font-bold">Total Price</span>
                      <span className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleAddToCart}
                    className="btn-primary w-full py-4 text-lg group"
                  >
                    Add to Cart
                    <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
