import React from 'react';
import { Zap, Instagram, Twitter, Youtube, Facebook, Music2, Mail, MapPin, Phone } from 'lucide-react';

interface FooterProps {
  onTermsClick?: () => void;
  onContactClick?: () => void;
  onApiDocsClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onTermsClick, onContactClick, onApiDocsClick }) => {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-lg shadow-black/5 border border-slate-100 dark:border-slate-800 overflow-hidden">
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
              <span className="text-xl font-bold tracking-tight font-display text-[#1F2937] dark:text-white">
                VeloxPro
              </span>
            </div>
            <p className="text-[#6B7280] leading-relaxed">
              The world's leading SMM platform providing high-quality social media marketing services at competitive prices.
            </p>
            <div className="flex items-center gap-4">
              {[Instagram, Twitter, Youtube, Facebook, Music2].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-all">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-[#1F2937] dark:text-white">Quick Links</h4>
            <ul className="space-y-4">
              {['Services', 'API Documentation', 'Affiliate Program', 'Support Center', 'Blog'].map((item, i) => (
                <li key={i}>
                  <button 
                    onClick={
                      item === 'Support Center' ? onContactClick : 
                      item === 'API Documentation' ? onApiDocsClick : 
                      undefined
                    }
                    className="text-[#6B7280] hover:text-primary transition-colors text-left"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-[#1F2937] dark:text-white">Legal</h4>
            <ul className="space-y-4">
              {['Terms of Service', 'Refund Policy', 'Cookie Policy', 'GDPR'].map((item, i) => (
                <li key={i}>
                  <button 
                    onClick={item === 'Terms of Service' ? onTermsClick : undefined}
                    className="text-[#6B7280] hover:text-primary transition-colors text-left"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-[#1F2937] dark:text-white">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-[#6B7280]">
                <Mail size={18} className="text-primary shrink-0" />
                <span>Veloxmediaservice@yahoo.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#6B7280]">
            © 2026 VeloxPro. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4 opacity-30 grayscale hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6 opacity-30 grayscale hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4 opacity-30 grayscale hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg" alt="Bitcoin" className="h-6 opacity-30 grayscale hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
          </div>
        </div>
      </div>
    </footer>
  );
};
