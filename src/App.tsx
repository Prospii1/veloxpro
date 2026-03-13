/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ServicesGrid } from './components/ServicesGrid';
import { Testimonials } from './components/Testimonials';
import { Footer } from './components/Footer';
import { Cart } from './components/Cart';
import { Dashboard } from './components/Dashboard';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ServiceDetailsModal } from './components/ServiceDetailsModal';
import { SERVICES } from './constants';
import { Service, CartItem } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'login' | 'signup'>('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Initialize theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
        onLoginClick={() => setCurrentView('login')}
        onSignupClick={() => setCurrentView('signup')}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        showSecondaryNav={currentView === 'home'}
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
                services={SERVICES} 
                onAddToCart={(service) => setSelectedService(service)} 
              />
            </div>

            <section className="py-20 px-6 max-w-7xl mx-auto">
              <div className="glass p-12 rounded-[3rem] bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="max-w-xl">
                  <h2 className="text-4xl font-bold font-display mb-6">Ready to skyrocket your social presence?</h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                    Join 50,000+ creators and businesses who trust VeloxPro for their daily growth. 
                    Get started today and see the difference in minutes.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button className="btn-primary px-8 py-4">Create Free Account</button>
                    <button className="btn-secondary px-8 py-4">View Pricing</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
                  {[
                    { label: 'Orders Delivered', value: '1.2M+' },
                    { label: 'Active Users', value: '50k+' },
                    { label: 'Support Response', value: '< 5m' },
                    { label: 'Service Uptime', value: '99.9%' },
                  ].map((stat, i) => (
                    <div key={i} className="glass p-6 rounded-2xl text-center">
                      <h3 className="text-2xl font-bold text-primary mb-1">{stat.value}</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <Testimonials />
          </motion.div>
        ) : currentView === 'dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard />
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
        ) : (
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
        )}
      </AnimatePresence>

      <Footer />

      <Cart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeCartItem}
        onCheckout={handleCheckout}
      />

      <ServiceDetailsModal 
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
