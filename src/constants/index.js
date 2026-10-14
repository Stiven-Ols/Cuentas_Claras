import { 
  Wallet, CreditCard, Smartphone 
} from 'lucide-react';

// URL DE TU GOOGLE APPS SCRIPT
export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby__QsEfSMOWA2hYi7dzz1tfg_TYKUm4nDJOSlAod8fSbPAbuf56WBEKlWrvtNAArAN/exec";

export const PAYMENT_METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: Wallet, style: 'text-gray-900 font-black', colorInfo: 'bg-green-100 text-green-700' },
  { id: 'nequi', label: 'Nequi', icon: Smartphone, style: 'text-purple-600 font-bold', colorInfo: 'bg-purple-100 text-purple-700' },
  { id: 'daviplata', label: 'DaviPlata', icon: Smartphone, style: 'text-red-600 font-bold', colorInfo: 'bg-red-100 text-red-700' },
  { id: 'bancolombia', label: 'Bancolombia', icon: CreditCard, style: 'text-yellow-600 font-bold', colorInfo: 'bg-yellow-100 text-yellow-700' },
  { id: 'otro', label: 'Otro', icon: CreditCard, style: 'text-gray-500 font-bold', colorInfo: 'bg-gray-100 text-gray-700' },
];

export const CATALOG_CATEGORIES = ['avon', 'natura', 'novaventa'];

