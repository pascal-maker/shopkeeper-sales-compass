import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, TranslationKey, Language as TranslationLanguage } from '@/lib/translations';

export type Language = 'en' | 'fr';
export type Currency = 'SLL' | 'GNF' | 'XOF' | 'USD' | 'EUR';

interface SettingsContextType {
  language: Language;
  currency: Currency;
  setLanguage: (language: Language) => void;
  setCurrency: (currency: Currency) => void;
  t: (key: TranslationKey) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [language, setLanguage] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('EUR');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('app-language') as Language;
    const savedCurrency = localStorage.getItem('app-currency') as Currency;
    
    if (savedLanguage && ['en', 'fr'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
    
    if (savedCurrency && ['SLL', 'GNF', 'XOF', 'USD', 'EUR'].includes(savedCurrency)) {
      setCurrency(savedCurrency);
    }
  }, []);

  // Save language to localStorage when it changes
  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('app-language', newLanguage);
  };

  // Save currency to localStorage when it changes
  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('app-currency', newCurrency);
  };

  // Translation function
  const t = (key: TranslationKey): string => {
    return translations[language as TranslationLanguage][key] || key;
  };

  return (
    <SettingsContext.Provider
      value={{
        language,
        currency,
        setLanguage: handleLanguageChange,
        setCurrency: handleCurrencyChange,
        t,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};