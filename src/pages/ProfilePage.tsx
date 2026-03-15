import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { supabase } from '../lib/supabase';
import { 
  Wallet, DollarSign, TrendingDown, 
  User, Mail, Phone, MessageCircle, 
  Calendar, Clock, Shield, Edit3, Save, X, Loader2, Monitor,
  LogOut, Activity, CreditCard, Key, Settings, Layout, ChevronRight,
  ShieldCheck, Smartphone, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

interface ProfilePageProps {
  onLoginClick?: () => void;
}

type TabType = 'personal' | 'security' | 'activity' | 'transactions' | 'password';

export const ProfilePage: React.FC<ProfilePageProps> = ({ onLoginClick }) => {
  const { user, profile, isLoading, refreshProfile, signOut } = useAuth();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    telegram_chat_id: ''
  });

  // Authentication Guard
  useEffect(() => {
    if (!isLoading && !user && onLoginClick) {
      onLoginClick();
    }
  }, [isLoading, user, onLoginClick]);

  // Sync Form Data
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        telegram_chat_id: profile.telegram_chat_id || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setUpdateError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id);
      
      if (error) throw error;
      
      await refreshProfile();
      setEditing(false);
    } catch (err: any) {
      console.error('Update error:', err);
      setUpdateError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    if (onLoginClick) onLoginClick();
  };

  if (isLoading || !user || !profile) {
    return (
      <div className="pt-32 pb-12 px-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="text-slate-500 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const walletStats = [
    { label: 'Current Balance', value: profile.wallet_balance || 0, icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Total Deposit', value: profile.total_deposit || 0, icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Used', value: profile.total_used || 0, icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const sidebarItems = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'password', label: 'Change Password', icon: Key },
  ];

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 shrink-0">
        <div className="glass p-6 rounded-3xl space-y-2 sticky top-32">
          {/* User Brief */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary/20 shrink-0">
              {(profile?.full_name || user.email)?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white truncate">
                {user.user_metadata?.username || user.email?.split('@')[0]}
              </h3>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group",
                  activeTab === item.id
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  {item.label}
                </div>
                {activeTab !== item.id && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
              </button>
            ))}
          </nav>

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 space-y-8">
        {/* Wallet Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {walletStats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 rounded-3xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
                  <stat.icon size={20} className={stat.color} />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
              </div>
              <h3 className="text-2xl font-bold dark:text-white">{formatPrice(stat.value)}</h3>
            </motion.div>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'personal' && (
            <motion.div
              key="personal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass p-8 rounded-[2.5rem]"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <h2 className="text-2xl font-bold font-display dark:text-white mb-1">Personal Information</h2>
                  <p className="text-slate-500 text-sm">Manage your account identity and contact details.</p>
                </div>
                
                {!editing ? (
                  <button 
                    onClick={() => setEditing(true)}
                    className="btn-secondary py-2 px-6 text-sm flex items-center gap-2"
                  >
                    <Edit3 size={16} />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary py-2 px-6 text-sm flex items-center gap-2"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Save Changes
                    </button>
                    <button 
                      onClick={() => { setEditing(false); setUpdateError(null); }}
                      className="btn-secondary py-2 px-6 text-sm flex items-center gap-2"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {updateError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 text-sm font-medium flex items-center gap-3">
                  <X size={16} className="shrink-0" />
                  {updateError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Username', value: user.user_metadata?.username || user.email?.split('@')[0], icon: User, readonly: true },
                  { label: 'Email Address', value: user.email, icon: Mail, readonly: true },
                  { label: 'Full Name', value: formData.full_name || '—', icon: User, key: 'full_name' },
                  { label: 'Phone Number', value: formData.phone || '—', icon: Phone, key: 'phone' },
                  { label: 'Telegram Chat ID', value: formData.telegram_chat_id || '—', icon: MessageCircle, key: 'telegram_chat_id' },
                  { label: 'Device Info', value: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Computer', icon: Smartphone, readonly: true },
                  { label: 'Signup Date', value: new Date(profile.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }), icon: Calendar, readonly: true },
                  { label: 'Last Login', value: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '—', icon: Clock, readonly: true },
                ].map((field) => (
                  <div key={field.label} className="group p-5 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-lg hover:shadow-black/[0.02]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <field.icon size={16} />
                      </div>
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">{field.label}</span>
                    </div>
                    
                    {editing && !field.readonly && field.key ? (
                      <input 
                        type="text"
                        value={(formData as any)[field.key]}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key!]: e.target.value }))}
                        placeholder={`Enter your ${field.label.toLowerCase()}`}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate px-1">
                        {field.value}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass p-8 rounded-[2.5rem]"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold font-display dark:text-white mb-1">Security Settings</h2>
                <p className="text-slate-500 text-sm">Protect your account and transactions with enhanced security features.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold dark:text-white">OTP Verification</h3>
                      <p className="text-sm text-slate-500 max-w-sm">Require a code for sensitive actions like funding and large purchases.</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={async () => {
                      const { error } = await supabase
                        .from('profiles')
                        .update({ otp_enabled: !profile.otp_enabled })
                        .eq('id', user.id);
                      if (!error) refreshProfile();
                    }}
                    className={cn(
                      "relative w-14 h-8 rounded-full transition-all duration-300",
                      profile.otp_enabled ? "bg-primary shadow-lg shadow-primary/20" : "bg-slate-300 dark:bg-slate-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300",
                      profile.otp_enabled ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass p-8 rounded-[2.5rem]"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold font-display dark:text-white mb-1">Change Password</h2>
                <p className="text-slate-500 text-sm">Ensure your account is secure by using a strong password.</p>
              </div>

              <div className="max-w-md space-y-6">
                {[
                  { id: 'current', label: 'Current Password', type: 'password' },
                  { id: 'new', label: 'New Password', type: 'password' },
                  { id: 'confirm', label: 'Confirm New Password', type: 'password' },
                ].map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                    <input 
                      type={field.type}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder={`••••••••`}
                      id={`pwd-${field.id}`}
                    />
                  </div>
                ))}

                <button 
                  onClick={async () => {
                    const current = (document.getElementById('pwd-current') as HTMLInputElement).value;
                    const newPw = (document.getElementById('pwd-new') as HTMLInputElement).value;
                    const confirm = (document.getElementById('pwd-confirm') as HTMLInputElement).value;

                    if (!current || !newPw || !confirm) return alert('All fields are required');
                    if (newPw !== confirm) return alert('Passwords do not match');

                    setSaving(true);
                    try {
                      // 1. Re-authenticate to verify current password
                      const { error: authError } = await supabase.auth.signInWithPassword({
                        email: user.email!,
                        password: current,
                      });
                      if (authError) throw new Error('Incorrect current password');

                      // 2. Update password
                      const { error: updateError } = await supabase.auth.updateUser({ password: newPw });
                      if (updateError) throw updateError;

                      // 3. Log activity
                      await supabase.rpc('log_user_activity', {
                        p_action_type: 'Password Change',
                        p_description: 'User successfully changed their password.',
                        p_device_info: navigator.userAgent
                      });

                      alert('Password updated successfully!');
                      (document.getElementById('pwd-current') as HTMLInputElement).value = '';
                      (document.getElementById('pwd-new') as HTMLInputElement).value = '';
                      (document.getElementById('pwd-confirm') as HTMLInputElement).value = '';
                    } catch (err: any) {
                      alert(err.message);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black tracking-widest uppercase text-xs"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                  Update Password
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass p-8 rounded-[2.5rem]"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold font-display dark:text-white mb-1">Activity Log</h2>
                <p className="text-slate-500 text-sm">Monitor recent security and account events.</p>
              </div>

              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th className="px-6 pb-2">Action</th>
                      <th className="px-6 pb-2">Description</th>
                      <th className="px-6 pb-2 text-right">Date & Time</th>
                    </tr>
                  </thead>
                  <ActivityRows userId={user.id} />
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass p-8 rounded-[2.5rem]"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold font-display dark:text-white mb-1">Financial History</h2>
                <p className="text-slate-500 text-sm">Track your wallet funding and purchase transactions.</p>
              </div>

              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th className="px-6 pb-2">Details</th>
                      <th className="px-6 pb-2">Status</th>
                      <th className="px-6 pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <TransactionRows userId={user.id} formatPrice={formatPrice} />
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const ActivityRows: React.FC<{ userId: string }> = ({ userId }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setLogs(data || []);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <tbody><tr><td colSpan={3} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-slate-300" /></td></tr></tbody>;
  if (logs.length === 0) return <tbody><tr><td colSpan={3} className="text-center py-10 text-slate-400 text-sm">No recent activities found.</td></tr></tbody>;

  return (
    <tbody>
      {logs.map((log) => (
        <tr key={log.id} className="group bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-colors">
          <td className="px-6 py-4 rounded-l-2xl border-l border-t border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-900 dark:text-white">{log.action_type}</span>
          </td>
          <td className="px-6 py-4 border-t border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 line-clamp-1">{log.description}</p>
          </td>
          <td className="px-6 py-4 text-right rounded-r-2xl border-r border-t border-b border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-black text-slate-400 uppercase tabular-nums">
              {new Date(log.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

const TransactionRows: React.FC<{ userId: string, formatPrice: (a: number) => string }> = ({ userId, formatPrice }) => {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setTxs(data || []);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <tbody><tr><td colSpan={3} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-slate-300" /></td></tr></tbody>;
  if (txs.length === 0) return <tbody><tr><td colSpan={3} className="text-center py-10 text-slate-400 text-sm">No transactions found.</td></tr></tbody>;

  return (
    <tbody>
      {txs.map((tx) => (
        <tr key={tx.id} className="group bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-colors">
          <td className="px-6 py-4 rounded-l-2xl border-l border-t border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center translate-y-[-1px]",
                tx.type === 'credit' ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
              )}>
                {tx.type === 'credit' ? <Globe size={14} /> : <CreditCard size={14} />}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{tx.description || tx.type}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter tabular-nums">
                  {new Date(tx.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 border-t border-b border-slate-100 dark:border-slate-800">
            <span className={cn(
              "text-[9px] font-black uppercase px-2 py-1 rounded-md",
              tx.status === 'completed' || tx.status === 'success' ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
            )}>
              {tx.status}
            </span>
          </td>
          <td className="px-6 py-4 text-right rounded-r-2xl border-r border-t border-b border-slate-100 dark:border-slate-800">
            <span className={cn(
              "text-sm font-bold tabular-nums",
              tx.type === 'credit' ? "text-emerald-500" : "text-primary"
            )}>
              {tx.type === 'credit' ? '+' : '-'}{formatPrice(tx.amount)}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  );
};




