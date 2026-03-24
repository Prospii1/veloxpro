import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type Currency = 'USD' | 'NGN';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (usdAmount: number) => string;
  exchangeRate: number;
}

const DEFAULT_EXCHANGE_RATE = 1700;
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('velox_currency');
    return (saved === 'NGN' || saved === 'USD') ? saved : 'USD';
  });
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_EXCHANGE_RATE);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'currency_settings')
          .single();

        if (data?.value?.naira_rate) {
          setExchangeRate(Number(data.value.naira_rate));
        }
      } catch (e) {
        console.error("Failed to fetch exchange rate", e);
      }
    };
    fetchRate();

    // Listen for changes
    const channel = supabase.channel('currency-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: "key=eq.currency_settings" }, (payload) => {
        if (payload.new?.value?.naira_rate) {
          setExchangeRate(Number(payload.new.value.naira_rate));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('velox_currency', c);
  };

  const formatPrice = (usdAmount: number) => {
    if (currency === 'NGN') {
      const ngnAmount = usdAmount * exchangeRate;
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(ngnAmount);
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(usdAmount);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, exchangeRate }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
