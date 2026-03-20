/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import { Hero } from './components/Hero';
import { ServicesGrid } from './components/ServicesGrid';
import { Footer } from './components/Footer';
import { Cart } from './components/Cart';
import { Dashboard } from './components/Dashboard';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { OrderHistory } from './pages/OrderHistory';
import { PaymentGateway } from './pages/PaymentGateway';
import { PurchaseModal } from './components/PurchaseModal';
import { AllProducts } from './pages/AllProducts';
import { ProfilePage } from './pages/ProfilePage';
import { NumberVerification } from './pages/NumberVerification';
import { GiftsPage } from './pages/Gifts';
import { AdminDashboard } from './pages/AdminDashboard';
import { TermsOfService } from './pages/TermsOfService';
import { APIDocumentation } from './pages/APIDocumentation';
import { Contact } from './pages/Contact';
import { Service, CartItem } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils';

export default function App() {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('velox-theme') === 'dark';
  });
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'login' | 'signup' | 'order-history' | 'payment-gateway' | 'all-products' | 'profile' | 'number-verification' | 'gifts' | 'admin' | 'terms-of-service' | 'contact' | 'api-docs'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Initialize theme and sync with metadata
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('velox-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('velox-theme', 'light');
    }

    if (user) {
      supabase.auth.updateUser({
        data: { theme: isDarkMode ? 'dark' : 'light' }
      });
    }
  }, [isDarkMode, user]);

  // Load theme from user metadata on login
  useEffect(() => {
    if (user?.user_metadata?.theme) {
      setIsDarkMode(user.user_metadata.theme === 'dark');
    }
  }, [user]);

  const handleAddToCart = (service: Service, quantity: number = 1000, targetUrl: string = '') => {
    if (!targetUrl) {
      setSelectedService(service);
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.service.id === service.id);
      if (existing) {
        return prev.map(item => 
          item.service.id === service.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { service, quantity, targetUrl }];
    });
    
    setIsCartOpen(true);
  };

  const updateCartQuantity = (id: string, quantity: number) => {
    setCartItems(prev => prev.map(item => 
      item.service.id === id ? { ...item, quantity } : item
    ));
  };

  const removeCartItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.service.id !== id));
  };

  const handleCheckout = () => {
    alert('Checkout functionality would be integrated here with Stripe/PayPal/Crypto.');
    setCartItems([]);
    setIsCartOpen(false);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-primary/30">
      <Navbar 
        cartCount={cartItems.length}
        onCartClick={() => setIsCartOpen(true)}
        onDashboardClick={() => setCurrentView('dashboard')}
        onHomeClick={() => setCurrentView('home')}
        onAllProductsClick={() => setCurrentView('all-products')}
        onProfileClick={() => setCurrentView('profile')}
        onFundWalletClick={() => setCurrentView('payment-gateway')}
        onLoginClick={() => setCurrentView('login')}
        onSignupClick={() => setCurrentView('signup')}
        onOrderHistoryClick={() => setCurrentView('order-history')}
        onNumberVerificationClick={() => setCurrentView('number-verification')}
        onGiftsClick={() => setCurrentView('gifts')}
        onAdminClick={() => setCurrentView('admin')}
        onTermsClick={() => setCurrentView('terms-of-service')}
        onApiDocsClick={() => setCurrentView('api-docs')}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(prev => !prev)}
        showSecondaryNav={currentView === 'home' && !user}
      />

      <AnimatePresence mode="wait">
        {currentView === 'home' ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Hero />
            
            <div id="services">
              <ServicesGrid 
                onAddToCart={(service) => setSelectedService(service)} 
                onViewAll={() => { setSelectedCategory('All'); setCurrentView('all-products'); }}
                onCategoryClick={(category) => { setSelectedCategory(category); setCurrentView('all-products'); }}
              />
            </div>

            {!user && (
              <section className="py-20 px-6 max-w-7xl mx-auto">
                <div className="glass p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 flex flex-col lg:flex-row items-center justify-between gap-12">
                  <div className="max-w-xl text-center lg:text-left">
                    <h2 className="text-3xl md:text-4xl font-bold font-display text-[#1F2937] dark:text-white mb-6">Ready to skyrocket your social presence?</h2>
                    <p className="text-base md:text-lg text-[#6B7280] dark:text-slate-400 mb-8">
                      Join 50,000+ creators and businesses who trust VeloxPro for their daily growth. 
                      Get started today and see the difference in minutes.
                    </p>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                      <button 
                        onClick={() => setCurrentView('signup')}
                        className="btn-primary px-8 py-4"
                      >
                        Create Free Account
                      </button>
                      <button 
                        onClick={() => setCurrentView('all-products')}
                        className="btn-secondary px-8 py-4"
                      >
                        View Pricing
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
                    {[
                      { label: 'Orders Delivered', value: '1.2M+' },
                      { label: 'Active Users', value: '50k+' },
                      { label: 'Support Response', value: '< 5m' },
                      { label: 'Service Uptime', value: '99.9%' },
                    ].map((stat, i) => (
                      <div key={i} className="glass p-6 rounded-2xl text-center border-white/10">
                        <h3 className="text-2xl font-bold text-primary mb-1">{stat.value}</h3>
                        <p className="text-xs font-bold text-[#6B7280] dark:text-slate-500 uppercase tracking-wider">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </motion.div>
        ) : currentView === 'dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard 
              onDocumentationClick={() => setCurrentView('api-docs')} 
            />
          </motion.div>
        ) : currentView === 'all-products' ? (
          <motion.div
            key="all-products"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AllProducts 
              onAddToCart={(service) => setSelectedService(service)} 
              initialCategory={selectedCategory}
            />
          </motion.div>
        ) : currentView === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Login 
              onSignupClick={() => setCurrentView('signup')} 
              onBackToHome={() => setCurrentView('home')} 
            />
          </motion.div>
        ) : currentView === 'signup' ? (
          <motion.div
            key="signup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Signup 
              onLoginClick={() => setCurrentView('login')} 
              onBackToHome={() => setCurrentView('home')} 
            />
          </motion.div>
        ) : currentView === 'order-history' ? (
          <motion.div
            key="order-history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <OrderHistory />
          </motion.div>
        ) : currentView === 'profile' ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProfilePage onLoginClick={() => setCurrentView('login')} />
          </motion.div>
        ) : currentView === 'number-verification' ? (
          <motion.div
            key="number-verification"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <NumberVerification />
          </motion.div>
        ) : currentView === 'gifts' ? (
          <motion.div
            key="gifts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GiftsPage />
          </motion.div>
        ) : currentView === 'admin' ? (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AdminDashboard />
          </motion.div>
        ) : currentView === 'terms-of-service' ? (
          <motion.div
            key="terms-of-service"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TermsOfService />
          </motion.div>
        ) : currentView === 'contact' ? (
          <motion.div
            key="contact"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Contact />
          </motion.div>
        ) : currentView === 'api-docs' ? (
          <motion.div
            key="api-docs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <APIDocumentation />
          </motion.div>
        ) : (
          <motion.div
            key="payment-gateway"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PaymentGateway onBack={() => setCurrentView('home')} />
          </motion.div>
        )}
      </AnimatePresence>

      <Footer 
        onTermsClick={() => setCurrentView('terms-of-service')}
        onContactClick={() => setCurrentView('contact')}
        onApiDocsClick={() => setCurrentView('api-docs')}
      />

      <Cart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeCartItem}
        onCheckout={handleCheckout}
      />

      <PurchaseModal 
        product={selectedService}
        onClose={() => setSelectedService(null)}
        onAddFunds={() => {
          setSelectedService(null);
          setCurrentView('payment-gateway');
        }}
      />
    </div>
  );
}
