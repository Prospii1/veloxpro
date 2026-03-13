import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, CreditCard, ShieldCheck } from 'lucide-react';
import { CartItem } from '../types';
import { cn } from '../utils';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export const Cart: React.FC<CartProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  const subtotal = items.reduce((sum, item) => sum + (item.service.pricePer1000 * item.quantity / 1000), 0);
  const [promoCode, setPromoCode] = useState('');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-950 z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShoppingBag size={20} />
                </div>
                <h2 className="text-xl font-bold">Your Cart</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <ShoppingBag size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Your cart is empty</h3>
                  <p className="text-slate-500 mb-8">Looks like you haven't added any services to your cart yet.</p>
                  <button onClick={onClose} className="btn-primary">Start Shopping</button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.service.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="flex-grow">
                      <h4 className="font-bold text-sm mb-1">{item.service.name}</h4>
                      <p className="text-xs text-slate-500 mb-3 truncate max-w-[200px]">{item.targetUrl}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                          <button 
                            onClick={() => onUpdateQuantity(item.service.id, Math.max(item.service.minOrder, item.quantity - 100))}
                            className="p-1 hover:text-primary transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xs font-bold w-12 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQuantity(item.service.id, Math.min(item.service.maxOrder, item.quantity + 100))}
                            className="p-1 hover:text-primary transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-bold text-primary">
                          ${(item.service.pricePer1000 * item.quantity / 1000).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onRemoveItem(item.service.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors self-start"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="mb-6">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-grow px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-sm"
                    />
                    <button className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Apply</button>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Discount</span>
                    <span className="text-emerald-500">-$0.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span>Total</span>
                    <span className="text-primary">${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={onCheckout}
                  className="btn-primary w-full py-4 text-lg group"
                >
                  Checkout Now
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={12} />
                    Secure
                  </div>
                  <div className="flex items-center gap-1">
                    <CreditCard size={12} />
                    PCI DSS
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
