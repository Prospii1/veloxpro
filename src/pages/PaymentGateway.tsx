import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { initializeWalletFund, verifyWalletPayment } from '../services/api';
import { useCurrency } from '../contexts/CurrencyContext';
import { Wallet, Loader2, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

export const PaymentGateway: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, profile, refreshProfile } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const [amount, setAmount] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const currentBalance = profile?.wallet_balance || 0;
  const MIN_AMOUNT = 5;

  const handleFundWallet = async () => {
    if (!user || !profile) return;
    if (amount < MIN_AMOUNT) {
      setError(`Minimum funding amount is ${formatPrice(MIN_AMOUNT)}.`);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Step 1: Initialize Korapay checkout
      // We pass the amount directly. The backend/Kora should handle the currency context.
      const resp = await initializeWalletFund(amount, user.email || '', user.id);
      
      if (!resp.success) throw new Error('Failed to initialize payment');

      const { reference, checkout_url, simulated } = resp.data;

      if (checkout_url && !simulated) {
        // Real Korapay — redirect to checkout
        window.location.href = checkout_url;
        return;
      }

      // Simulated flow — process instantly
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 2: Verify payment
      const verifyResp = await verifyWalletPayment(reference);
      if (!verifyResp.success) throw new Error('Payment verification failed');

      // Step 3: Record transaction in Supabase
      // The database trigger will automatically update the profile balance/stats
      const { error: txError } = await supabase.from('transactions').insert([{ 
        user_id: user.id, 
        amount, 
        type: 'credit', // changed to match system convention
        status: 'completed',
        payment_reference: reference,
        payment_provider: 'Korapay',
        payment_method: 'Card/Transfer',
        description: `Wallet funded via Korapay (${currency})`
      }]);
        
      if (txError) throw txError;

      // Step 4: Log the activity
      await supabase.rpc('log_user_activity', {
        p_action_type: 'Wallet Funding',
        p_description: `User funded wallet with ${formatPrice(amount)} via Korapay.`,
        p_device_info: navigator.userAgent
      });

      // Step 5: Refresh and show success
      await refreshProfile();
      setSuccess(true);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-12 px-4 md:px-6 max-w-3xl mx-auto min-h-[60vh]">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-6 font-bold"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 p-6 md:p-10 relative overflow-hidden">
        {success ? (
          <div className="text-center py-12">
            <CheckCircle2 size={80} className="text-emerald-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-2">Payment Successful!</h2>
            <p className="text-slate-500 text-lg mb-2">Added {formatPrice(amount)} to your wallet.</p>
            <p className="text-sm text-slate-400">Your new balance: <span className="font-bold text-emerald-500">{formatPrice(currentBalance + amount)}</span></p>
            <button 
              onClick={onBack}
              className="mt-8 btn-primary px-8 py-3"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-10 text-primary">
              <Wallet size={48} className="mx-auto mb-4" />
              <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-2">Fund Your Wallet</h2>
              <p className="text-slate-500">
                Current Balance: <span className="font-bold text-slate-900 dark:text-white">{formatPrice(currentBalance)}</span>
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Funding Amount ({currency}) <span className="text-slate-400 font-normal">— min {formatPrice(MIN_AMOUNT)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency === 'USD' ? '$' : '₦'}</span>
                  <input 
                    type="number"
                    value={amount}
                    min={MIN_AMOUNT}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-8 py-3 outline-none focus:border-primary font-bold text-lg dark:text-white transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                {[10, 50, 100, 250].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
                      amount === preset 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {formatPrice(preset)}
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-bold mb-1">
                  <Wallet size={16} /> Payment via Korapay
                </div>
                <p className="text-xs text-blue-500/70">You will be redirected to Korapay's secure checkout to complete your payment.</p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-center font-bold flex items-center justify-center gap-2">
                  <AlertTriangle size={16} /> {error}
                </div>
              )}

              <button 
                onClick={handleFundWallet}
                disabled={loading || amount < MIN_AMOUNT}
                className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>Processing <Loader2 size={20} className="animate-spin" /></>
                ) : (
                  `Fund Wallet — ${currency === 'NGN' ? `₦${amount.toLocaleString()}` : formatPrice(amount)}`
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
