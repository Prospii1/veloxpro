import React from 'react';
import { motion } from 'motion/react';
import { ImageSlider } from './ImageSlider';
import { Globe, ShieldCheck, Zap, Star } from 'lucide-react';
import { cn } from '../utils';

export const Hero: React.FC = () => {
  const images = [
    "/assets/verification.png",
    "/assets/security.png",
    "/assets/presence.png",
  ];

  return (
    <section className="pt-20 md:pt-28 pb-12 px-0 md:px-6 max-w-7xl mx-auto">
      <div className="h-[250px] sm:h-[350px] md:h-[600px] w-full">
        <ImageSlider 
          images={images} 
          className="rounded-none md:rounded-[2rem] shadow-none md:shadow-2xl h-full" 
          autoPlayInterval={5000} 
        />
      </div>
      
      {/* Quick Features Bar */}
      <div className="mt-6 md:mt-8 px-4 md:px-0 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { icon: Zap, label: 'Instant Delivery', color: 'text-amber-500' },
          { icon: ShieldCheck, label: 'Secure Payment', color: 'text-emerald-500' },
          { icon: Globe, label: 'Global Support', color: 'text-blue-500' },
          { icon: Star, label: 'Premium Quality', color: 'text-primary' },
        ].map((feature, i) => (
          <div key={i} className="glass p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3 border-white/5">
            <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/5 flex items-center justify-center shrink-0", feature.color)}>
              <feature.icon size={16} className="md:w-5 md:h-5" />
            </div>
            <span className="text-[10px] md:text-sm font-bold leading-tight">{feature.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
