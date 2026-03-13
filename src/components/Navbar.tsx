import React, { useState, useEffect } from 'react';
import { Sun, Moon, ShoppingCart, User, Menu, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onDashboardClick: () => void;
  onHomeClick: () => void;
  onLoginClick: () => void;
  onSignupClick: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  showSecondaryNav?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  cartCount, 
  onCartClick, 
  onDashboardClick, 
  onHomeClick,
  onLoginClick,
  onSignupClick,
  isDarkMode,
  toggleDarkMode,
  showSecondaryNav = true
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', active: true },
    { label: 'Gifts' },
    { label: 'USA Number' },
    { label: 'International Number' },
    { label: 'VPN' },
    { label: 'Streaming Logs' },
    { label: 'Digital E-Codes' },
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm" : "bg-white dark:bg-slate-900"
    )}>
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={onHomeClick}
        >
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-lg shadow-black/5 group-hover:scale-110 transition-transform overflow-hidden border border-slate-100 dark:border-slate-800">
            <img 
              src="/assets/logo.png" 
              alt="VeloxPro Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const icon = document.createElement('div');
                  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap"><path d="M4 14.71 14 2.5l-2 9.29h8l-10 12.21 2-9.29H4z"/></svg>';
                  parent.appendChild(icon.firstChild as Node);
                }
              }}
            />
          </div>
          <span className="text-xl font-bold font-display tracking-tight dark:text-white">VeloxPro</span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={onLoginClick}
              className="text-sm font-bold px-4 py-2 hover:text-primary transition-colors dark:text-slate-300"
            >
              Login
            </button>
            <button 
              onClick={onSignupClick}
              className="btn-primary py-2 px-6 text-sm"
            >
              Sign Up
            </button>
          </div>

          {/* Mobile Auth Buttons */}
          <div className="flex md:hidden items-center gap-2">
            <button 
              onClick={onLoginClick}
              className="text-xs font-bold px-2 py-1 dark:text-slate-300"
            >
              Login
            </button>
            <button 
              onClick={onSignupClick}
              className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg shadow-primary/20"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Navigation (Horizontal Scroll on Mobile) */}
      {showSecondaryNav && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-12 flex items-center overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-6 md:gap-8 whitespace-nowrap">
            {navItems.map((item, i) => (
              <button
                key={i}
                className={cn(
                  "text-xs md:text-sm font-bold transition-colors",
                  item.active 
                    ? "text-primary border-b-2 border-primary h-12 flex items-center" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};
