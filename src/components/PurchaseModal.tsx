import React, { useState } from 'react';
import { X, Wallet, Loader2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { purchaseSupplierAccount, generateOTP, verifyOTP } from '../services/api';
import { supabase } from '../lib/supabase';
import { Service } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { cn } from '../utils';

interface PurchaseModalProps {
  product: Service | null;
  onClose: () => void;
  onAddFunds: () => void;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ product, onClose, onAddFunds }) => {
  const { user, profile, refreshProfile } = useAuth();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // OTP States
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);

  if (!product || !user || !profile) return null;

  const currentBalance = profile.wallet_balance || 0;
  const price = product.pricePer1000;
  const canAfford = currentBalance >= price;

  const handleInitiatePurchase = async () => {
    if (!canAfford) {
      onAddFunds();
      return;
    }

    if (profile.otp_enabled) {
      setLoading(true);
      try {
        await generateOTP(user.id, user.email || '');
        setOtpStep(true);
      } catch (err: any) {
        setError("Failed to send verification code.");
      } finally {
        setLoading(false);
      }
    } else {
      executePurchase();
    }
  };

  const handleVerifyOTP = async () => {
    setOtpVerifying(true);
    setError('');
    try {
      const resp = await verifyOTP(user.id, otpCode);
      if (resp.success) {
        setOtpStep(false);
        executePurchase();
      } else {
        throw new Error(resp.error || "Invalid code");
      }
    } catch (err: any) {
      setError(err.message || "Invalid verification code.");
      setOtpVerifying(false);
    }
  };

  const executePurchase = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 1. Call Supplier API proxy (Backend now handles wallet deduction and order logging)
      const supplierResponse = await purchaseSupplierAccount(
        product.id, 
        product.name,
        "the-socialmarket", 
        user.id, 
        price
      );
      
      if (!supplierResponse.success) throw new Error(supplierResponse.error || "Supplier API failed.");
      
      // 2. Log the activity locally for analytics
      await supabase.rpc('log_user_activity', {
        p_action_type: 'Product Purchase',
        p_description: `User purchased ${product.name} for ${formatPrice(price)}.`,
        p_device_info: navigator.userAgent
      });

      await refreshProfile();
      setSuccess(true);
      
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2500);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Purchase failed.");
    } finally {
      if (!success) setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X size={20} />
        </button>

        {success ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={48} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">Success!</h2>
            <p className="text-slate-500">Your account is ready in the Account Room.</p>
          </div>
        ) : otpStep ? (
          <div className="py-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display dark:text-white">Security Check</h2>
                <p className="text-sm text-slate-500">Enter the 6-digit code sent to your email.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <input 
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-primary outline-none transition-colors dark:text-white"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-500/5 p-3 rounded-xl">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <button 
                onClick={handleVerifyOTP}
                disabled={otpCode.length < 6 || otpVerifying}
                className="w-full py-4 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {otpVerifying ? <Loader2 size={20} className="animate-spin" /> : 'Verify & Pay'}
              </button>

              <button 
                onClick={() => setOtpStep(false)}
                className="w-full text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-2">
            <h2 className="text-2xl font-bold font-display mb-6 dark:text-white">Confirm Purchase</h2>
            
            <div className="space-y-4 mb-8">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Product</p>
                <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{product.name}</p>
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">Price</span>
                  <span className="text-xl font-black text-primary">{formatPrice(price)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-2 text-primary">
                  <Wallet size={18} />
                  <span className="font-bold text-sm">Wallet Balance</span>
                </div>
                <span className="text-lg font-bold text-primary">{formatPrice(currentBalance)}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm text-center font-bold">
                {error}
              </div>
            )}

            <button 
              onClick={handleInitiatePurchase}
              disabled={loading}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-white transition-all shadow-xl flex items-center justify-center gap-2",
                !canAfford 
                  ? 'bg-amber-500 shadow-amber-500/20' 
                  : 'bg-primary shadow-primary/20 hover:scale-[1.02] active:scale-95'
              )}
            >
              {loading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : !canAfford ? (
                'Add Funds to Wallet'
              ) : (
                'Confirm & Pay'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
