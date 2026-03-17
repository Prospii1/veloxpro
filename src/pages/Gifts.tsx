import React, { useState, useEffect } from 'react';
import { Gift, ShoppingBag, Info, Loader2, Sparkles, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../contexts/CurrencyContext';
import { PurchaseModal } from '../components/PurchaseModal';
import { Service } from '../types';
import { cn } from '../utils';

interface GiftItem {
  id: string;
  name: string;
  image_url: string;
  description: string;
  price: number;
  availability_status: 'active' | 'inactive';
}

export const GiftsPage: React.FC = () => {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();
  const [selectedGift, setSelectedGift] = useState<Service | null>(null);
  const [showFundModal, setShowFundModal] = useState(false);

  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select('*')
        .eq('availability_status', 'active');

      if (error) throw error;
      setGifts(data || []);

      // If no gifts, add some mock ones for beauty
      if (!data || data.length === 0) {
        setGifts([
          {
            id: '1',
            name: 'Premium Account Bundle',
            description: 'Get exclusive access to all premium features and early updates.',
            price: 49.99,
            image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop',
            availability_status: 'active'
          },
          {
            id: '2',
            name: 'Verified Status Badge',
            description: 'Stand out from the crowd with a verified badge on your profile.',
            price: 19.99,
            image_url: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=800&auto=format&fit=crop',
            availability_status: 'active'
          },
          {
            id: '3',
            name: 'VIP Support Pass',
            description: 'Priority 24/7 support with personal account manager.',
            price: 29.99,
            image_url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800&auto=format&fit=crop',
            availability_status: 'active'
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching gifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (gift: GiftItem) => {
    // Map GiftItem to Service type for PurchaseModal
    const service: Service = {
      id: gift.id,
      name: gift.name,
      platform: 'Digital Gift',
      type: 'Gift',
      category: 'Gifts',
      pricePer1000: gift.price,
      minOrder: 1,
      maxOrder: 1,
      description: gift.description,
      features: ['Immediate Activation', 'Global Status'],
      icon: 'Gift',
      deliveryTime: 'Instant',
      rating: 5.0,
      reviews: 100
    };
    setSelectedGift(service);
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-bold mb-4"
          >
            <Sparkles size={16} />
            Exclusive Rewards
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">Digital Gifts</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Unlock premium perks, status symbols, and exclusive digital assets managed directly by VeloxPro.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={40} className="animate-spin text-primary" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Loading exclusive items...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {gifts.map((gift, i) => (
                <motion.div
                  key={gift.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="glass overflow-hidden rounded-[2.5rem] border-white/10 relative h-full flex flex-col">
                    <div className="h-48 overflow-hidden relative">
                      <img 
                        src={gift.image_url} 
                        alt={gift.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold text-white flex items-center gap-1">
                        <Star size={12} fill="currentColor" />
                        Exclusive
                      </div>
                    </div>
                    
                    <div className="p-8 flex-1 flex flex-col">
                      <h3 className="text-2xl font-bold font-display mb-3 group-hover:text-primary transition-colors">{gift.name}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 flex-1">{gift.description}</p>
                      
                      <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Price</span>
                          <span className="text-2xl font-bold text-emerald-500">{formatPrice(gift.price)}</span>
                        </div>
                           <button 
                             onClick={() => handlePurchase(gift)}
                             className="btn-primary p-4 rounded-2xl flex items-center justify-center gap-2 group/btn shadow-lg shadow-primary/20"
                           >
                            <ShoppingBag size={20} />
                            <span className="font-bold">Purchase</span>
                          </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-20 p-8 md:p-12 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-800 border border-white/5 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
            <div>
              <h2 className="text-3xl font-bold font-display text-white mb-4">Have a special request?</h2>
              <p className="text-slate-400 max-w-md">
                Our team can create custom digital assets or status badges specifically for your brand or profile.
              </p>
            </div>
            <button className="btn-secondary px-8 py-4 bg-white/10 hover:bg-white/20 text-white border-white/20">
              Contact Admin Support
            </button>
          </div>
        </div>

        <PurchaseModal 
          product={selectedGift} 
          onClose={() => setSelectedGift(null)}
          onAddFunds={() => {
            setSelectedGift(null);
            setShowFundModal(true);
            // Redirect to fund wallet or handle naturally
            window.location.href = '/fund-wallet';
          }}
        />
      </div>
    </div>
  );
};
