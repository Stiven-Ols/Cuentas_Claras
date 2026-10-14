import React from 'react';
import { PAYMENT_METHODS } from '../constants';

const PaymentMethodSelector = ({ selected, onSelect }) => (
  <div className="mb-4">
    <label className="block text-gray-600 dark:text-gray-300 text-xs font-bold mb-2 ml-1 uppercase">Método de Pago</label>
    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar snap-x">
      {PAYMENT_METHODS.map(m => {
        const Icon = m.icon;
        const isSelected = selected === m.id;
        return (
          <button 
            key={m.id} 
            onClick={() => onSelect(m.id)}
            className={`flex-shrink-0 flex flex-col items-center justify-center p-3 min-w-[80px] rounded-xl border-2 transition-all snap-start ${
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-bold mt-1">{m.label}</span>
          </button>
        )
      })}
    </div>
  </div>
);

export default PaymentMethodSelector;
