// Colores predefinidos por el usuario
const PREDEFINED_COLORS = {
  'natura': 'bg-orange-100 text-orange-700 border-orange-200',
  'novaventa': 'bg-blue-900 text-blue-100 border-blue-800',
  'avon': 'bg-red-100 text-red-700 border-red-200',
  'brownies': 'bg-amber-800 text-amber-100 border-amber-900',
  'arequipe': 'bg-amber-100 text-amber-800 border-amber-200',
};

// Paleta de colores para nuevas categorías (tonos pastel/suaves para mantener legibilidad)
const FALLBACK_PALETTES = [
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'bg-lime-100 text-lime-700 border-lime-200',
  'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-rose-100 text-rose-700 border-rose-200',
];

export const getCategoryColor = (categoryName) => {
  if (!categoryName) return 'bg-gray-100 text-gray-600 border-gray-200';
  
  const key = categoryName.toLowerCase();
  
  // 1. Verificar si es predefinido
  if (PREDEFINED_COLORS[key]) {
    return PREDEFINED_COLORS[key];
  }
  
  // 2. Si no, generar un color consistente basado en el nombre (hash)
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % FALLBACK_PALETTES.length;
  return FALLBACK_PALETTES[index];
};
