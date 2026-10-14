import React from 'react';

const NavBtn = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center p-3 rounded-2xl transition-all ${active ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 dark:text-gray-500'}`}>
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-bold mt-1">{label}</span>
  </button>
);

export default NavBtn;
