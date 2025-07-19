import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Currency } from "@/contexts/SettingsContext"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: Currency): string {
  const currencyMap: Record<Currency, { symbol: string; locale: string }> = {
    SLL: { symbol: 'Le', locale: 'en-SL' },
    GNF: { symbol: 'GNF', locale: 'fr-GN' },
    XOF: { symbol: 'CFA', locale: 'fr-BF' },
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'en-EU' }
  };

  const config = currencyMap[currency];
  
  // For currencies with specific formatting needs
  if (currency === 'SLL' || currency === 'GNF' || currency === 'XOF') {
    return `${config.symbol}${amount.toLocaleString()}`;
  }
  
  // For USD and EUR, use standard currency formatting
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}
