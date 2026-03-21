import React, { useState, useEffect } from 'react';
import { Sun, Moon, ShoppingCart, User, Menu, X, Zap, ChevronDown, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { normalizeCategory } from '../utils/category';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onDashboardClick: () => void;
  onHomeClick: () => void;
  onAllProductsClick: () => void;
  onProfileClick: () => void;
  onFundWalletClick: () => void;
  onLoginClick: () => void;
  onSignupClick: () => void;
  onOrderHistoryClick: () => void;
  onNumberVerificationClick: () => void;
  onGiftsClick: () => void;
  onAdminClick: () => void;
  onCategoryClick: (category: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  showSecondaryNav?: boolean;
  onTermsClick?: () => void;
  onApiDocsClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  cartCount, 
  onCartClick, 
  onDashboardClick, 
  onHomeClick,
  onAllProductsClick,
  onProfileClick,
  onFundWalletClick,
  onLoginClick,
  onSignupClick,
  onOrderHistoryClick,
  onNumberVerificationClick,
  onGiftsClick,
  onAdminClick,
  onCategoryClick,
  isDarkMode,
  toggleDarkMode,
  showSecondaryNav = true,
  onTermsClick,
  onApiDocsClick
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isProductsExpanded, setIsProductsExpanded] = useState(false); // New state
  const { user, profile, signOut } = useAuth();
  const { currency, setCurrency, formatPrice } = useCurrency();
  const [categories, setCategories] = useState<{ name: string; icon: string }[]>([]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Fetch live categories for the mobile drawer
    const fetchCats = async () => {
      try {
        const fetchResellerProducts = (await import('../services/api')).fetchResellerProducts;
        const resp = await fetchResellerProducts();
        if (resp && resp.categories) {
          const seen = new Set<string>();
          const uniqueCategories: { name: string; icon: string }[] = [];

          resp.categories.forEach(cat => {
            const normalized = normalizeCategory(cat.name);
            if (!seen.has(normalized)) {
              seen.add(normalized);
              uniqueCategories.push({ ...cat, name: normalized });
            }
          });
          // Sort categories by priority: Facebook, Instagram, Twitter, TikTok first
          const priority = ['Facebook', 'Instagram', 'Twitter', 'TikTok'];
          uniqueCategories.sort((a, b) => {
            const indexA = priority.indexOf(a.name);
            const indexB = priority.indexOf(b.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(b.name);
          });

          setCategories(uniqueCategories);
        }
      } catch(e) {}
    };
    fetchCats();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'All Products', action: onAllProductsClick },
    ...categories.map(cat => ({ label: cat.name, action: onAllProductsClick }))
  ];

  return (
    <>
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
      isScrolled ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800" : "bg-white dark:bg-slate-900"
    )}>
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
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
            <span className="text-xl font-bold font-display tracking-tight text-[#1F2937] dark:text-white">VeloxPro</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Global Currency Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
              onBlur={() => setTimeout(() => setIsCurrencyOpen(false), 200)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-bold text-[#1F2937] dark:text-white border border-transparent hover:border-primary/20"
            >
              <Globe size={14} className="text-primary" />
              <span>{currency}</span>
              <ChevronDown size={14} className={cn("transition-transform duration-200", isCurrencyOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isCurrencyOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-32 glass border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 overflow-hidden z-50"
                >
                  {(['USD', 'NGN'] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => {
                        setCurrency(curr);
                        setIsCurrencyOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between",
                        currency === curr 
                          ? "bg-primary text-white" 
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      {curr}
                      {currency === curr && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={onOrderHistoryClick}
                  className="text-sm font-bold px-2 py-2 text-[#1F2937] dark:text-slate-300 hover:text-primary transition-colors"
                >
                  Order History
                </button>
                <button 
                  onClick={onNumberVerificationClick}
                  className="text-sm font-bold px-2 py-2 text-[#1F2937] dark:text-slate-300 hover:text-primary transition-colors"
                >
                  Number Verification
                </button>
                <button 
                  onClick={onGiftsClick}
                  className="text-sm font-bold px-2 py-2 text-[#1F2937] dark:text-slate-300 hover:text-primary transition-colors"
                >
                  Order a Gift
                </button>
                {profile?.role === 'Admin' && (
                  <button 
                    onClick={onAdminClick}
                    className="text-sm font-bold px-2 py-2 text-primary hover:text-primary transition-colors border-2 border-primary/20 rounded-xl px-4"
                  >
                    Admin
                  </button>
                )}
                <button 
                  onClick={onProfileClick}
                  className="text-sm font-bold px-2 py-2 text-[#1F2937] dark:text-slate-300 hover:text-primary transition-colors"
                >
                  Profile
                </button>
                <button 
                  onClick={onFundWalletClick}
                  className="text-sm font-bold px-2 py-2 text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  Fund Wallet
                </button>
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 py-1.5 px-3 rounded-full cursor-default border border-emerald-100 dark:border-emerald-800">
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPrice(profile?.wallet_balance || 0)}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-full cursor-default">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                    <User size={14} />
                  </div>
                  <span className="text-sm font-bold text-[#1F2937] dark:text-white">
                    {user.user_metadata?.username || user.email?.split('@')[0]}
                  </span>
                </div>
                <button 
                  onClick={toggleDarkMode}
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-yellow-400 hover:scale-110 transition-all border border-slate-200 dark:border-slate-700"
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button 
                  onClick={signOut}
                  className="text-sm font-bold px-4 py-2 text-red-500 hover:text-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={toggleDarkMode}
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-yellow-400 hover:scale-110 transition-all border border-slate-200 dark:border-slate-700"
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button 
                  onClick={onLoginClick}
                  className="text-sm font-bold px-4 py-2 text-[#1F2937] dark:text-slate-300 hover:text-primary transition-colors"
                >
                  Login
                </button>
                <button 
                  onClick={onSignupClick}
                  className="btn-primary py-2 px-6 text-sm"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Profile Icon Shortcut */}
          <div className="flex md:hidden items-center gap-2">
            <button 
              onClick={user ? onProfileClick : onLoginClick}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform"
            >
              <User size={20} className={cn(user && "text-primary")} />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Navigation (Horizontal Scroll on Mobile) */}
      {showSecondaryNav && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-12 flex items-center overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="flex items-center gap-6 md:gap-8 whitespace-nowrap">
            {navItems.map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className={cn(
                  "text-xs md:text-sm font-bold transition-colors",
                  "text-[#6B7280] hover:text-[#1F2937] dark:hover:text-white"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>

    {/* Mobile Side Drawer */}
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[80%] max-w-[300px] bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col md:hidden"
          >
            <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="font-display font-bold text-xl text-[#1F2937] dark:text-white">Menu</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-2">
              <button 
                onClick={() => { onHomeClick(); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Home
              </button>

              <button 
                onClick={() => setIsProductsExpanded(!isProductsExpanded)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl font-medium flex items-center justify-between transition-colors",
                  isProductsExpanded ? "bg-primary/5 text-primary" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <div className="flex items-center gap-3">
                  All Products
                </div>
                <ChevronDown size={18} className={cn("transition-transform duration-300", isProductsExpanded && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isProductsExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-slate-50/50 dark:bg-white/5 mx-2 rounded-xl"
                  >
                    <div className="py-2 px-2 flex flex-col gap-1">
                      <button 
                        onClick={() => { onAllProductsClick(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 rounded-lg text-sm font-bold text-primary hover:bg-primary/10"
                      >
                        View All Catalog
                      </button>
                      
                      <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />
                      
                      {categories.map((cat, i) => (
                        <button 
                          key={i}
                          onClick={() => { onCategoryClick(cat.name); setIsMobileMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                        >
                          {cat.icon && (
                            <img src={cat.icon} alt="" className="w-5 h-5 rounded-md object-cover" />
                          )}
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={() => { onNumberVerificationClick(); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Number Verification
              </button>
              
              <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
              
              {user ? (
                <>
                  <button 
                    onClick={() => { onOrderHistoryClick(); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                  >
                    Order History
                  </button>
                  <button 
                    onClick={() => { onGiftsClick(); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                  >
                    Order a Gift
                  </button>
                  {profile?.role === 'Admin' && (
                    <button 
                      onClick={() => { onAdminClick(); setIsMobileMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 rounded-xl font-bold text-primary hover:bg-primary/5 flex items-center gap-3"
                    >
                      Admin Dashboard
                    </button>
                  )}
                  <button 
                    onClick={() => { onProfileClick(); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                  >
                    Profile
                  </button>
                  <button 
                    onClick={() => { onFundWalletClick(); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl font-medium text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                  >
                    Fund Wallet
                  </button>
                  <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
                  <button 
                    onClick={() => { onApiDocsClick?.(); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                  >
                    API Documentation
                  </button>
                  <button 
                    onClick={() => { onTermsClick?.(); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                  >
                    Terms of Service
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => { onSignupClick(); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl font-medium text-primary hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                  >
                    Sign Up
                  </button>
                  <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
                  <button 
                    onClick={toggleDarkMode}
                    className="w-full py-3 rounded-xl font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2"
                  >
                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </>
              )}
            </div>

            {user && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-[#1F2937] dark:text-white">
                        {user.user_metadata?.username || 'User'}
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-slate-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 py-1 px-3 rounded-full border border-emerald-100 dark:border-emerald-800 flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPrice(profile?.wallet_balance || 0)}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={toggleDarkMode}
                  className="w-full py-3 rounded-xl font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 mb-2"
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button 
                  onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                  className="w-full py-3 rounded-xl font-bold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                >
                  Log out
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
};
