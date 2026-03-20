import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, RefreshCw, Copy, Check, Loader2, AlertCircle, Terminal, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../utils';

interface APISettingsProps {
  onDocumentationClick?: () => void;
}

export const APISettings: React.FC<APISettingsProps> = ({ onDocumentationClick }) => {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      if (!user) return;
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('api_key')
          .eq('id', user.id)
          .single();

        if (fetchError) throw fetchError;
        setApiKey(data.api_key || 'No API key generated yet');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, [user]);

  const handleRegenerate = async () => {
    if (!window.confirm('Are you sure? Your old API key will stop working immediately.')) return;
    
    setRegenerating(true);
    setError(null);
    try {
      const resp = await fetch('/api/profile/regen-api-key', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      const data = await resp.json();
      if (data.success) {
        setApiKey(data.api_key);
      } else {
        throw new Error(data.error || 'Failed to regenerate key');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display text-[#1F2937] dark:text-white">API Settings</h1>
        <p className="text-[#6B7280] dark:text-slate-400">Manage your credentials for integrating VeloxPro into your applications.</p>
      </div>

      <div className="glass p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Key size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1F2937] dark:text-white">Public API Key</h3>
            <p className="text-sm text-[#6B7280] dark:text-slate-500">Your secret key. Keep it secure and never share it publicly.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-sm break-all">
              <span className="flex-grow text-[#1F2937] dark:text-slate-300">
                {apiKey}
              </span>
              <button 
                onClick={copyToClipboard}
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all text-[#6B7280] dark:text-slate-400 group-hover:scale-110 active:scale-95 border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700"
              >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </button>
            </div>
            <AnimatePresence>
              {copied && (
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -top-8 right-0 text-[10px] font-bold text-emerald-500 uppercase tracking-widest"
                >
                  Copied to clipboard
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={handleRegenerate}
              disabled={regenerating}
              className="btn-secondary flex items-center justify-center gap-2 px-8 py-4 rounded-2xl"
            >
              {regenerating ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <RefreshCw size={20} />
              )}
              Regenerate API Key
            </button>
            <button className="flex items-center justify-center gap-2 text-[#6B7280] hover:text-[#1F2937] dark:hover:text-white transition-colors text-sm font-medium">
              <AlertCircle size={18} />
              Revoke all keys
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-8 rounded-[2.5rem] flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
            <Terminal size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2 dark:text-white">API Documentation</h3>
          <p className="text-sm text-[#6B7280] dark:text-slate-400 mb-6">Learn how to authenticate and use our endpoints with detailed guides and code examples.</p>
          <button 
            onClick={onDocumentationClick}
            className="btn-primary w-full py-4 text-sm"
          >
            View Documentation
          </button>
        </div>

        <div className="glass p-8 rounded-[2.5rem] flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
            <ShieldCheck size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2 dark:text-white">Usage Limits</h3>
          <p className="text-sm text-[#6B7280] dark:text-slate-400 mb-6">Current: 5,000 requests / day<br/>Upgrade to a premium plan for higher limits.</p>
          <button className="btn-secondary w-full py-4">Request Higher Limit</button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center gap-3 text-red-500 text-sm">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
    </div>
  );
};
