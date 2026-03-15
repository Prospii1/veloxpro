import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Package, Copy, ExternalLink, Calendar, KeyRound } from 'lucide-react';
import { cn } from '../utils';

export const AccountRoom: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from('purchased_accounts')
          .select(`
            id,
            credentials,
            status,
            created_at,
            products (
              name,
              type,
              description
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setAccounts(data || []);
      } catch (err) {
        console.error('Error fetching accounts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [user]);

  if (loading) {
    return (
      <div className="pt-28 pb-12 px-4 md:px-6 max-w-7xl mx-auto min-h-[60vh] flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="pt-28 pb-12 px-4 md:px-6 max-w-7xl mx-auto min-h-[60vh]">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <KeyRound size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white">Account Room</h1>
          <p className="text-slate-500 dark:text-slate-400">View and manage all your purchased digital accounts.</p>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="glass p-12 rounded-3xl text-center flex flex-col items-center">
          <Package size={64} className="text-slate-300 dark:text-slate-700 mb-6" />
          <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2">No purchased accounts yet</h3>
          <p className="text-slate-500">When you buy a VPN, Number, or Social account, it will appear here safely stored.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => {
            const product = acc.products || {};
            const creds = acc.credentials || {};
            
            return (
              <div key={acc.id} className="glass p-6 rounded-2xl relative overflow-hidden group border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 pr-2">
                    {product.name || 'Unknown Product'}
                  </h3>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                    acc.status === 'Active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                    acc.status === 'Expired' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  )}>
                    {acc.status}
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                    <Calendar size={14} /> 
                    Purchased on {new Date(acc.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {product.type}
                  </p>
                </div>

                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                  {creds.username && (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 font-bold block mb-0.5">Username/Email</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white select-all">{creds.username}</span>
                      </div>
                      <button onClick={() => navigator.clipboard.writeText(creds.username)} className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                        <Copy size={14} />
                      </button>
                    </div>
                  )}
                  {creds.password && (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 font-bold block mb-0.5">Password</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white select-all">{creds.password}</span>
                      </div>
                      <button onClick={() => navigator.clipboard.writeText(creds.password)} className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                        <Copy size={14} />
                      </button>
                    </div>
                  )}
                  {creds.notes && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase text-slate-400 font-bold block mb-0.5">Notes</span>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{creds.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
