import React from 'react';
import { formatCurrency } from '../utils/formatters';

const StatCard = ({ title, value, color }) => (
  <div className={`flex-1 p-4 rounded-2xl shadow-sm flex flex-col justify-between border-l-4 ${
    color === 'green' 
      ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
      : 'bg-red-50 dark:bg-red-900/20 border-red-500'
  }`}>
    <span className={`text-xs font-bold uppercase tracking-wide mb-1 ${color === 'green' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
      {title}
    </span>
    <span className={`text-2xl font-black ${color === 'green' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
      {formatCurrency(value)}
    </span>
  </div>
);

export default StatCard;
