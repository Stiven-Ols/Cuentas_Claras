import React from 'react';
import { Plus } from 'lucide-react';

const DesktopLayout = ({ children, showFAB = false, onFABClick }) => {
  return (
    <div className="lg:ml-64 min-h-screen">
      {/* Desktop Header */}
      <header className="hidden lg:block h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8">
        <div className="h-full flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('es-CO', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          
          {showFAB && (
            <button
              onClick={onFABClick}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"
            >
              <Plus size={20} strokeWidth={3} />
              <span>Nueva Venta</span>
            </button>
          )}
        </div>
      </header>

      {/* Content - renders once for both mobile and desktop */}
      <main className="p-4 lg:p-8">
        <div className="max-w-md lg:max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DesktopLayout;
