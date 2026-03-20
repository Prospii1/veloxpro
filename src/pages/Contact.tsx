import React from 'react';
import { motion } from 'motion/react';
import { Mail, MessageSquare, Clock, Globe, ArrowRight } from 'lucide-react';

export const Contact: React.FC = () => {
  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Side: Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-1/3 space-y-8"
        >
          <div>
            <h1 className="text-4xl font-bold font-display text-[#1F2937] dark:text-white mb-4">Contact Us</h1>
            <p className="text-[#6B7280] dark:text-slate-400 text-lg">
              Have questions or need assistance? Our team is available 24/7 to help you scale your social presence.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Us</p>
                <p className="text-[#1F2937] dark:text-white font-bold">Veloxmediaservice@yahoo.com</p>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Response Time</p>
                <p className="text-[#1F2937] dark:text-white font-bold">Under 5 minutes</p>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <Globe size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Global Support</p>
                <p className="text-[#1F2937] dark:text-white font-bold">Available Worldwide</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-[#1F2937] dark:text-white mb-2">Live Support</h4>
            <p className="text-sm text-[#6B7280] mb-4">Integrate with our live agents for instant troubleshooting.</p>
            <button className="flex items-center gap-2 text-primary font-bold text-sm hover:gap-3 transition-all">
              Launch Live Chat <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-2/3 glass p-8 md:p-12 rounded-[3rem] bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800"
        >
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1F2937] dark:text-slate-300 ml-1">Full Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-[#1F2937] dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1F2937] dark:text-slate-300 ml-1">Email Address</label>
                <input 
                  type="email" 
                  placeholder="john@example.com"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-[#1F2937] dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1F2937] dark:text-slate-300 ml-1">Subject</label>
              <select className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-[#1F2937] dark:text-white appearance-none">
                <option>General Inquiry</option>
                <option>Billing Issue</option>
                <option>Technical Support</option>
                <option>Affiliate Program</option>
                <option>Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1F2937] dark:text-slate-300 ml-1">Your Message</label>
              <textarea 
                rows={5}
                placeholder="How can we help you today?"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-3xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-[#1F2937] dark:text-white resize-none"
              ></textarea>
            </div>

            <button className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2 group">
              Send Message
              <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
