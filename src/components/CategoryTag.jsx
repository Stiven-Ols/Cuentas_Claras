import React from 'react';
import { getCategoryColor } from '../utils/colors';

const CategoryTag = ({ category, className = "" }) => {
  const safeCategory = typeof category === 'string' ? category : (category?.name || 'Sin Categoría');
  const colorClass = getCategoryColor(safeCategory);
  
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colorClass} uppercase tracking-wide ${className}`}>
      {safeCategory}
    </span>
  );
};

export default CategoryTag;
