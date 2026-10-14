import React from 'react';

const MoneyInput = ({ value, onChange, label, placeholder, autoFocus = false, readOnly = false, containerClass = "mb-4", textClass = "text-lg" }) => {
  const displayValue = (value !== '' && value !== null && value !== undefined && !isNaN(value)) 
    ? new Intl.NumberFormat('es-CO').format(value) 
    : '';

  const handleChange = (e) => {
    if (readOnly) return;
    const rawValue = e.target.value.replace(/\./g, '').replace(/,/g, '').replace(/\D/g, '');
    onChange(rawValue === '' ? '' : parseInt(rawValue, 10));
  };

  return (
    <div className={containerClass}>
      {label && <label className="block text-gray-600 dark:text-gray-300 text-[10px] font-bold mb-1 ml-1 uppercase">{label}</label>}
      <div className="relative">
        <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold ${textClass === 'text-lg' ? 'text-sm' : 'text-xs'}`}>$</div>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          readOnly={readOnly}
          autoFocus={autoFocus}
          placeholder={placeholder || "0"}
          className={`w-full p-2.5 pl-7 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-black transition-colors tracking-tight ${textClass} ${
             readOnly ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500' : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-0'
          }`}
        />
      </div>
    </div>
  );
};

export default MoneyInput;
