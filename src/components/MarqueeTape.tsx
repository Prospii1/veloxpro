import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../utils';

interface MarqueeTapeProps {
  text: string;
  className?: string;
  reverse?: boolean;
  rotate?: number;
}

export const MarqueeTape: React.FC<MarqueeTapeProps> = ({ 
  text, 
  className, 
  reverse = false,
  rotate = 0
}) => {
  const repeatedText = (text + " • ").repeat(20);

  return (
    <div 
      className={cn(
        "w-full overflow-hidden bg-red-600 py-2 shadow-xl z-20",
        className
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <motion.div
        animate={{ x: reverse ? [-1000, 0] : [0, -1000] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="whitespace-nowrap flex"
      >
        <span className="text-xs font-black text-white uppercase tracking-[0.2em] px-4">
          {repeatedText}
        </span>
      </motion.div>
    </div>
  );
};
