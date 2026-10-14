import React from 'react';
import { Home, Package, Store, Settings, Moon, Sun, Users } from 'lucide-react';

const Sidebar = ({ view, setView, darkMode, setDarkMode }) => {
  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'debtors', label: 'Cartera', icon: Users },
    { id: 'orders', label: 'Encargos', icon: Package },
    { id: 'inventory', label: 'Inventario', icon: Store },
    { id: 'admin', label: 'Administración', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Logo/Brand */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-black text-blue-600 dark:text-blue-400">
          Cuentas Claras
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Dark Mode Toggle */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
