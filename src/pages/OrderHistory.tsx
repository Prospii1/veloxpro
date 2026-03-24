import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Receipt, ArrowUpRight, ArrowDownRight, Clock, PlusCircle } from 'lucide-react';
import { cn } from '../utils';

export const OrderHistory: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            products (
              name
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
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
        <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
          <Receipt size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display text-[#1F2937] dark:text-white">Order History</h1>
          <p className="text-[#6B7280] dark:text-slate-400">View your wallet funding and purchase activity.</p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="glass p-12 rounded-3xl text-center flex flex-col items-center">
          <Receipt size={64} className="text-slate-300 dark:text-slate-700 mb-6" />
          <h3 className="text-xl font-bold text-[#6B7280] dark:text-slate-300 mb-2">No transaction history</h3>
          <p className="text-[#6B7280]">Your purchases and top-ups will be listed here.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Transaction</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider text-center">Qty</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider text-center">Unit Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          tx.type === 'Funding' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-primary/10 text-primary"
                        )}>
                          {tx.type === 'Funding' ? <PlusCircle size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <span className="font-bold text-sm text-[#1F2937] dark:text-white">
                          {tx.type === 'Funding' ? 'Wallet Top-up' : 'Purchase'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#1F2937] dark:text-white">
                      {tx.products?.name ? tx.products.name : (tx.description?.split('x ')[1] || '-')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        {tx.quantity || 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-[#1F2937] dark:text-white">
                        ${Number(tx.unit_price || tx.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "font-bold text-sm",
                        tx.type === 'Funding' ? "text-emerald-500" : "text-primary"
                      )}>
                        {tx.type === 'Funding' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                        <Clock size={12} />
                        {new Date(tx.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider inline-flex items-center",
                        tx.status === 'Completed' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" :
                        tx.status === 'Failed' ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" :
                        "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                      )}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
