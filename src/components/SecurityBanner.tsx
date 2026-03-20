import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ShieldAlert, Info, ShieldCheck } from 'lucide-react';
import { MarqueeTape } from './MarqueeTape';

export const SecurityBanner: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-slate-950 py-24 border-y border-slate-100 dark:border-slate-900">
      {/* Crossing Tapes */}
      <MarqueeTape 
        text="BEWARE OF IMPERSONATORS" 
        className="absolute top-10 -left-10 w-[120%] z-10" 
        rotate={-2}
      />
      <MarqueeTape 
        text="STAY SAFE • OFFICIAL SUPPORT ONLY" 
        className="absolute bottom-10 -left-10 w-[120%] z-10 bg-slate-900 dark:bg-white !text-white dark:!text-slate-900" 
        rotate={2}
        reverse
      />

      <div className="max-w-7xl mx-auto px-6 relative z-0">
        <div className="glass p-12 rounded-[3rem] border-red-500/20 bg-red-500/[0.02] dark:bg-red-500/[0.05] flex flex-col lg:flex-row items-center gap-16">
          {/* Left Side: Content */}
          <div className="flex-grow space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-red-600 text-white shadow-xl shadow-red-600/20">
                <ShieldAlert size={24} />
                <h2 className="text-2xl font-black uppercase tracking-tight font-display">Security Alert</h2>
              </div>
              <h3 className="text-4xl font-bold font-display text-[#1F2937] dark:text-white">Beware of Impersonators</h3>
              <p className="text-[#6B7280] max-w-xl dark:text-slate-400">
                Your security is our top priority. Please read these important safety guidelines to protect your account and funds.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { 
                  title: "Passwords", 
                  text: "We will NEVER ask for your account password. Keep it secret.",
                  icon: ShieldCheck
                },
                { 
                  title: "Payments", 
                  text: "Official payments are ONLY handled through our website dashboard.",
                  icon: AlertTriangle
                },
                { 
                  title: "Telegram", 
                  text: "Support will NEVER ask you to send money directly on Telegram.",
                  icon: Info
                },
                { 
                  title: "Replacements", 
                  text: "Replacements are always FREE. Never pay for a refill or fix.",
                  icon: ShieldCheck
                }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                    <item.icon size={20} />
                  </div>
                  <h4 className="font-bold mb-2 text-[#1F2937] dark:text-white">{item.title}</h4>
                  <p className="text-sm text-[#6B7280] leading-relaxed dark:text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Visual */}
          <div className="shrink-0 relative hidden lg:block">
            <div className="relative">
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.02, 0.98, 1]
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className="w-64 h-64 rounded-[3rem] bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center shadow-2xl shadow-red-500/30"
              >
                <AlertTriangle size={100} className="text-white" />
              </motion.div>
              
              {/* Floating badges */}
              <motion.div
                animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-6 -right-6 glass p-4 rounded-2xl border-red-500/30"
              >
                <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                  <ShieldAlert size={16} />
                  <span>Verified Only</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
