import React, { useState } from 'react';
import { Phone, Globe, ChevronRight, CheckCircle2, XCircle, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { verifyPhoneNumber } from '../services/api';
import { cn } from '../utils';

const countries = [
  { name: 'Nigeria', code: 'NG', flag: '🇳🇬' },
  { name: 'United States', code: 'US', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  { name: 'Ghana', code: 'GH', flag: '🇬🇭' },
  { name: 'Kenya', code: 'KE', flag: '🇰🇪' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  { name: 'France', code: 'FR', flag: '🇫🇷' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦' },
];

export const NumberVerification: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await verifyPhoneNumber(phoneNumber, selectedCountry.name);
      if (resp.success) {
        setResult(resp.data);
      } else {
        setError(resp.error || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4"
          >
            <Globe size={16} />
            Global Reach
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">Number Verification</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Instantly verify phone numbers, carrier details, and line types using our premium supplier API.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass p-8 md:p-10 rounded-[2.5rem] border-primary/10"
          >
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Select Country</label>
                <div className="grid grid-cols-1 gap-2">
                  <select 
                    value={selectedCountry.code}
                    onChange={(e) => setSelectedCountry(countries.find(c => c.code === e.target.value) || countries[0])}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Phone Number</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Phone size={20} />
                  </div>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +234 800 000 0000"
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !phoneNumber}
                className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Number
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <Info size={20} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Fees may apply per verification request depending on your plan. Results include carrier data, location, and line type (mobile/landline).
              </p>
            </div>
          </motion.div>

          {/* Results Section */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass p-12 rounded-[2.5rem] border-primary/10 flex flex-col items-center justify-center text-center gap-6 h-full min-h-[400px]"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Phone size={24} className="text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Analyzing Number</h3>
                    <p className="text-slate-500 dark:text-slate-400">Communicating with global carrier databases...</p>
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass p-8 md:p-10 rounded-[2.5rem] border-primary/10 bg-gradient-to-br from-primary/5 to-secondary/5"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                      result.valid ? "bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10" : "bg-red-500/10 text-red-500 shadow-red-500/10"
                    )}>
                      {result.valid ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold font-display">{result.valid ? 'Verified Valid' : 'Invalid Number'}</h3>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">{result.number}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { label: 'Country', value: result.country, icon: Globe },
                      { label: 'Carrier', value: result.carrier || 'Unknown', icon: Phone },
                      { label: 'Line Type', value: result.line_type || 'N/A', icon: Info },
                      { label: 'Location', value: result.location || 'Unknown', icon: Globe },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-white/20">
                        <div className="flex items-center gap-3">
                          <item.icon size={18} className="text-primary" />
                          <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{item.label}</span>
                        </div>
                        <span className="font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => { setResult(null); setPhoneNumber(''); }}
                    className="w-full mt-8 py-3 rounded-xl border border-primary/20 text-primary font-bold hover:bg-primary/5 transition-colors"
                  >
                    Verify Another Number
                  </button>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass p-12 rounded-[2.5rem] border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center text-center gap-6"
                >
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <XCircle size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Verification Error</h3>
                    <p className="text-slate-500 dark:text-slate-400">{error}</p>
                  </div>
                  <button 
                    onClick={() => setError(null)}
                    className="px-6 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                  >
                    Try Again
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass p-12 rounded-[2.5rem] border-primary/10 border-dashed flex flex-col items-center justify-center text-center gap-6 min-h-[400px]"
                >
                  <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Phone size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">No verification data</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                      Enter a phone number and select a country to see detailed verification results.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
