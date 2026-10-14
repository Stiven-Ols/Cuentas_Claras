import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Home, Package, Settings, 
  Save, Trash2, X, Moon, Sun, TrendingUp, 
  Wallet, CreditCard, Smartphone, ChevronDown, ChevronUp,
  Cloud, Hash, AlertTriangle, Calendar, CheckCircle, Check, Store, Search, Pencil, UserCheck, List
} from 'lucide-react';

// --- CONFIGURACIÓN FIREBASE ---
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";

// TUS CREDENCIALES REALES
const firebaseConfig = {
  apiKey: "AIzaSyA-CPPHnP3c5BzVSCFlJO5FvGGaKearoE8",
  authDomain: "cuentas-claras-4bba4.firebaseapp.com",
  projectId: "cuentas-claras-4bba4",
  storageBucket: "cuentas-claras-4bba4.firebasestorage.app",
  messagingSenderId: "496676277274",
  appId: "1:496676277274:web:ed6ae7961cd7d1ab2115a3",
  measurementId: "G-3RZVJ69TL0"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// URL DE TU GOOGLE APPS SCRIPT
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbze3X9UH5AsSGsyy4l1XzNjnJ0KBq0OAK84IR7Svfsbx8Uv4YKuwN11_AL74izSf0o_/exec";

// --- CONSTANTES ---

const PAYMENT_METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: Wallet, style: 'text-gray-900 font-black', colorInfo: 'bg-green-100 text-green-700' },
  { id: 'nequi', label: 'Nequi', icon: Smartphone, style: 'text-blue-600 font-bold', colorInfo: 'bg-blue-100 text-blue-700' },
  { id: 'bancolombia', label: 'Bancolombia', icon: CreditCard, style: 'text-yellow-600 font-bold', colorInfo: 'bg-yellow-100 text-yellow-700' },
  { id: 'avvillas', label: 'Av Villas', icon: CreditCard, style: 'text-red-600 font-bold', colorInfo: 'bg-red-100 text-red-700' },
  { id: 'daviplata', label: 'DaviPlata', icon: CreditCard, style: 'text-red-500 font-bold', colorInfo: 'bg-red-100 text-red-700' },
  { id: 'otro', label: 'Otro', icon: CreditCard, style: 'text-gray-500 font-bold', colorInfo: 'bg-gray-100 text-gray-700' },
];

const CATALOG_CATEGORIES = ['avon', 'natura', 'novaventa'];

// --- UTILIDADES ---

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === '' || isNaN(value)) return '$ 0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
  const options = { weekday: 'short', day: 'numeric', month: 'short' };
  return adjustedDate.toLocaleDateString('es-CO', options);
};

const formatDateShort = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return adjustedDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

const getPaymentMethodInfo = (id) => {
    return PAYMENT_METHODS.find(m => m.id === id) || PAYMENT_METHODS[5];
};

const calculatePaymentDates = (startDateStr, installmentsCount) => {
    const dates = [];
    let currentDate = new Date(startDateStr);
    let count = 0;
    let safetyLoop = 0;

    while (count < installmentsCount && safetyLoop < 50) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const day15 = new Date(year, month, 15);
        const dayEnd = new Date(year, month + 1, 0);

        if (currentDate < day15) {
            dates.push(day15.toISOString().split('T')[0]);
            currentDate = day15;
            count++;
        } else if (currentDate < dayEnd) {
            dates.push(dayEnd.toISOString().split('T')[0]);
            currentDate = dayEnd;
            count++;
        } else {
            currentDate = new Date(year, month + 1, 1);
            continue;
        }
        currentDate.setDate(currentDate.getDate() + 1);
        safetyLoop++;
    }
    return dates;
};

const getUpcomingQuincenaDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day15 = new Date(year, month, 15);
    const dayEnd = new Date(year, month + 1, 0);

    if (today <= day15) return day15;
    return dayEnd;
};

// --- ENVÍO ROBUSTO A GOOGLE SHEETS ---
const sendToGoogleSheets = async (data) => {
  try {
    const payload = {
        id: data.id || Date.now(),
        type: data.type || 'VENTA', 
        customer: data.customer || 'Cliente General',
        category: data.category || 'Varios',
        product: data.description || 'Producto', 
        quantity: data.quantity || 1,
        unitPrice: data.unitPrice || 0, 
        totalPrice: data.totalPrice || 0, 
        paidAmount: data.paidAmount || 0, 
        paymentMethod: data.paymentMethod || 'efectivo',
        status: data.status || 'PENDIENTE',
        notes: data.installments ? `A ${data.installments} quincenas` : ''
    };

    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("✅ Datos robustos enviados a Google Sheets");
  } catch (error) {
    console.error("❌ Error enviando a Google Sheets", error);
  }
};

// --- COMPONENTES UI ---

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

// --- VISTAS ---

const HomeView = ({ sales, categories, onSelectSale, darkMode, setDarkMode, customers }) => {
  const [expandedMethod, setExpandedMethod] = useState(null);

  const totalStats = useMemo(() => {
    let cash = 0;
    let receivable = 0;
    sales.forEach(s => {
      const paid = parseInt(s.paidAmount || 0);
      const total = parseInt(s.totalPrice || 0);
      cash += paid;
      receivable += (total - paid);
    });
    return { cash, receivable };
  }, [sales]);

  const methodTransactions = useMemo(() => {
    const transactions = {};
    PAYMENT_METHODS.forEach(m => transactions[m.id] = []);

    sales.forEach(sale => {
      if (sale.history) {
        sale.history.forEach(h => {
          if (transactions[h.method]) {
             const customerName = customers.find(c => c.id === sale.customerId)?.name || 'Cliente';
             transactions[h.method].push({
                 id: sale.id + h.date,
                 amount: parseInt(h.amount || 0),
                 customer: customerName,
                 category: sale.category,
                 product: sale.product,
                 date: h.date
             });
          }
        });
      }
    });
    return transactions;
  }, [sales, customers]);

  const categoryStats = categories.map(cat => {
    const catSales = sales.filter(s => s.category === cat);
    const sold = catSales.reduce((sum, s) => sum + parseInt(s.totalPrice || 0), 0);
    const debt = catSales.reduce((sum, s) => {
        const total = parseInt(s.totalPrice || 0);
        const paid = parseInt(s.paidAmount || 0);
        return sum + (total - paid);
    }, 0);
    return { name: cat, sold, debt };
  });

  const upcomingDebtors = useMemo(() => {
      const nextQuincenaDate = getUpcomingQuincenaDate();
      const nextQuincenaStr = nextQuincenaDate.toISOString().split('T')[0];
      
      return sales.filter(s => {
          const debt = parseInt(s.totalPrice) - parseInt(s.paidAmount);
          if (debt <= 0) return false;
          return s.paymentDates && s.paymentDates.includes(nextQuincenaStr);
      });
  }, [sales]);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white">Hola Mamá 👋</h1>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
            <span>Hoy es {formatDate(new Date().toISOString())}</span>
          </div>
        </div>
        <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-yellow-400">
          {darkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </header>

      <div className="flex gap-3">
        <StatCard title="Recibido Total" value={totalStats.cash} color="green" />
        <StatCard title="Por Cobrar" value={totalStats.receivable} color="red" />
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
          <div className="flex justify-between items-center mb-3">
              <h3 className="text-indigo-900 dark:text-indigo-200 font-bold text-sm flex items-center gap-2">
                  <UserCheck size={18} className="text-indigo-600 dark:text-indigo-400"/>
                  Cobros Próxima Quincena
              </h3>
              <span className="text-xs bg-white dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded font-bold">
                  {formatDate(getUpcomingQuincenaDate().toISOString())}
              </span>
          </div>
          
          {upcomingDebtors.length === 0 ? (
              <p className="text-xs text-indigo-400 dark:text-indigo-400 italic ml-6">¡Todo al día! No hay cobros para esta fecha.</p>
          ) : (
              <div className="space-y-2">
                  {upcomingDebtors.map(sale => {
                      const customer = customers.find(c => c.id === sale.customerId);
                      const debt = parseInt(sale.totalPrice) - parseInt(sale.paidAmount);
                      return (
                          <div key={sale.id} onClick={() => onSelectSale(sale)} className="bg-white dark:bg-indigo-950/50 p-3 rounded-xl flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow">
                              <div>
                                  <p className="font-bold text-indigo-900 dark:text-indigo-100">{customer?.name}</p>
                                  <p className="text-[10px] text-indigo-500 dark:text-indigo-400">{sale.product} ({sale.category})</p>
                              </div>
                              <span className="font-black text-indigo-700 dark:text-indigo-300">{formatCurrency(debt)}</span>
                          </div>
                      );
                  })}
              </div>
          )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
         <h3 className="text-gray-800 dark:text-gray-200 font-bold text-sm flex items-center gap-2 mb-3">
            <Wallet size={18} className="text-blue-500"/>
            ¿Dónde está la plata?
         </h3>
         <div className="space-y-2">
            {PAYMENT_METHODS.map(method => {
               const transactions = methodTransactions[method.id];
               const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
               if (totalAmount === 0) return null;
               
               const isExpanded = expandedMethod === method.id;

               return (
                 <div key={method.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <button 
                        onClick={() => setExpandedMethod(isExpanded ? null : method.id)}
                        className="w-full flex justify-between items-center py-3 group"
                    >
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${method.colorInfo.split(' ')[0]}`}>
                                <method.icon size={16} className={method.colorInfo.split(' ')[1]} />
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-blue-600 transition-colors">{method.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="font-bold text-gray-800 dark:text-white">{formatCurrency(totalAmount)}</span>
                             {isExpanded ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                        </div>
                    </button>
                    
                    {isExpanded && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 mb-3 text-sm space-y-2 animate-in slide-in-from-top-2">
                            {transactions.map((t, idx) => (
                                <div key={idx} className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-bold text-gray-700 dark:text-gray-200">{t.customer}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.product} <span className="text-blue-500">({t.category})</span></p>
                                    </div>
                                    <span className="font-bold text-gray-600 dark:text-gray-300">{formatCurrency(t.amount)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
               )
            })}
            {Object.values(methodTransactions).every(arr => arr.length === 0) && <p className="text-xs text-gray-400 italic text-center">Aún no has recibido pagos hoy.</p>}
         </div>
      </div>

      <div>
        <h3 className="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase mb-3 tracking-wider ml-1">Por Categoría</h3>
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x">
          {categoryStats.map(cat => (
            <div key={cat.name} className="snap-center min-w-[160px] p-4 rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm">
              <div className="font-bold text-gray-800 dark:text-white mb-2 text-lg">{cat.name}</div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Ventas: {formatCurrency(cat.sold)}</span>
                <span className="text-xs text-red-500 dark:text-red-400 font-medium">Deben: {formatCurrency(cat.debt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase mb-3 tracking-wider ml-1">Últimas Ventas</h3>
        <div className="space-y-3">
          {sales.length === 0 ? <p className="text-center text-gray-400 py-8">No hay ventas aún.</p> : sales.slice(0, 10).map(sale => {
            const customer = customers.find(c => c.id === sale.customerId);
            const debt = parseInt(sale.totalPrice) - parseInt(sale.paidAmount);
            const isPaid = debt <= 0;
            
            const lastPayment = sale.history && sale.history.length > 0 ? sale.history[sale.history.length - 1] : null;
            const paymentMethodInfo = lastPayment ? getPaymentMethodInfo(lastPayment.method) : null;
            
            const installmentsCount = parseInt(sale.installments || 0);
            const payDates = sale.paymentDates || [];
            const nextDatesStr = payDates.slice(0, 2).map(d => formatDateShort(d)).join(', ');

            return (
              <div 
                key={sale.id} 
                onClick={() => !isPaid && onSelectSale(sale)}
                className={`relative p-4 rounded-xl bg-white dark:bg-gray-800 border-l-[6px] shadow-sm active:scale-[0.98] transition-transform ${
                  isPaid ? 'border-green-400 dark:border-green-500' : (sale.paidAmount === 0 ? 'border-red-400 dark:border-red-500' : 'border-orange-400 dark:border-orange-500')
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-bold text-lg text-gray-800 dark:text-gray-100">{customer?.name || 'Cliente'}</div>
                    
                    {/* DETALLE DE PRODUCTO MEJORADO CON CANTIDAD */}
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-medium mt-0.5 flex items-center gap-1">
                        <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 rounded">{sale.quantity || 1}x</span>
                        <span>{sale.product}</span>
                        <span className="text-[10px] text-gray-400 font-normal uppercase tracking-wide ml-1">({sale.category})</span>
                    </div>

                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDate(sale.date)}
                    </div>
                    
                    {!isPaid && installmentsCount > 0 && (
                        <div className="mt-2 flex items-center flex-wrap gap-2">
                            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                A {installmentsCount} Quincenas
                            </span>
                            {nextDatesStr && (
                                <span className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                                    <Calendar size={10}/>
                                    Próx: {nextDatesStr}
                                </span>
                            )}
                        </div>
                    )}

                    {!isPaid && <div className="mt-2 inline-block px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-bold rounded">Debe: {formatCurrency(debt)}</div>}
                  </div>
                  
                  <div className="text-right flex flex-col items-end justify-between h-full pl-2">
                    <div className="font-black text-gray-900 dark:text-white text-lg">{formatCurrency(sale.totalPrice)}</div>
                    
                    <div className="flex flex-col items-end gap-1 mt-1">
                        <div className={`text-[10px] font-bold uppercase ${isPaid ? 'text-green-600' : 'text-orange-500'}`}>
                            {sale.status}
                        </div>
                        
                        {paymentMethodInfo && sale.paidAmount > 0 && (
                            <div className="flex items-center gap-1">
                                <span className={`text-[10px] uppercase ${paymentMethodInfo.style}`}>
                                    {paymentMethodInfo.label}
                                </span>
                            </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const InventoryView = ({ inventory, categories, onAddProduct, onEditProduct, onDeleteProduct }) => {
    const [newProd, setNewProd] = useState({ id: null, category: categories[0], name: '', qty: '', cost: '', price: '' });
    const [isEditing, setIsEditing] = useState(false);

    const handleAddOrUpdate = () => {
        if (!newProd.name || !newProd.qty || !newProd.price) return;
        
        const productData = {
            ...newProd,
            qty: parseInt(newProd.qty),
            initialQty: isEditing ? newProd.initialQty : parseInt(newProd.qty),
            cost: parseInt(newProd.cost || 0),
            price: parseInt(newProd.price)
        };

        if (isEditing) {
            onEditProduct(productData);
            setIsEditing(false);
        } else {
            onAddProduct({ ...productData, id: Date.now(), initialQty: parseInt(newProd.qty) });
        }
        
        setNewProd({ id: null, category: categories[0], name: '', qty: '', cost: '', price: '' });
    };

    const startEdit = (prod) => {
        setNewProd(prod);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = () => {
        if (window.confirm('¿Borrar este producto del inventario?')) {
            onDeleteProduct(newProd.id);
            setIsEditing(false);
            setNewProd({ id: null, category: categories[0], name: '', qty: '', cost: '', price: '' });
        }
    };

    return (
        <div className="pb-24 animate-in slide-in-from-right-4">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Store className="text-blue-600" /> Inventario
            </h2>

            <div className={`p-4 rounded-xl shadow-sm border mb-8 transition-colors ${isEditing ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white border-blue-100 dark:bg-gray-800 dark:border-blue-900/30'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-blue-700 dark:text-blue-400 text-sm uppercase">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                    {isEditing && (
                        <button onClick={() => { setIsEditing(false); setNewProd({ category: categories[0], name: '', qty: '', cost: '', price: '' }); }} className="text-xs text-gray-500 underline">Cancelar</button>
                    )}
                </div>
                
                <div className="flex gap-2 mb-3">
                    <select 
                        value={newProd.category} 
                        onChange={e => setNewProd({...newProd, category: e.target.value})}
                        className="p-3 bg-white dark:bg-gray-700 border-none rounded-xl text-sm font-bold dark:text-white w-1/2 shadow-sm"
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input 
                        type="text" placeholder="Nombre Producto" 
                        value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})}
                        className="w-1/2 p-3 bg-white dark:bg-gray-700 border-none rounded-xl text-sm font-bold dark:text-white shadow-sm"
                    />
                </div>

                {/* INPUTS DE INVENTARIO OPTIMIZADOS Y AMPLIOS */}
                <div className="flex gap-3 mb-3 items-end">
                    <div className="w-[20%]">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Cant.</label>
                        <input 
                            type="number" 
                            value={newProd.qty} 
                            onChange={e => setNewProd({...newProd, qty: e.target.value})} 
                            className="w-full p-2.5 rounded-xl border-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-bold text-center text-lg focus:border-blue-500 focus:ring-0" 
                            placeholder="0"
                        />
                    </div>
                    <div className="w-[40%]">
                        <MoneyInput 
                            label="Costo ($)" 
                            value={newProd.cost} 
                            onChange={v => setNewProd({...newProd, cost: v})} 
                            containerClass="mb-0" 
                            textClass="text-lg" 
                        />
                    </div>
                    <div className="w-[40%]">
                        <MoneyInput 
                            label="Venta ($)" 
                            value={newProd.price} 
                            onChange={v => setNewProd({...newProd, price: v})} 
                            containerClass="mb-0" 
                            textClass="text-lg text-blue-600 dark:text-blue-400" 
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    {isEditing && (
                        <button onClick={handleDelete} className="w-1/4 py-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200">
                            <Trash2 size={20} className="mx-auto"/>
                        </button>
                    )}
                    <button onClick={handleAddOrUpdate} disabled={!newProd.name} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 ${isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {isEditing ? 'Guardar Cambios' : 'Agregar al Inventario'}
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {inventory.map(item => {
                    const percentage = Math.min(100, Math.max(0, (item.qty / item.initialQty) * 100));
                    const profit = item.price - item.cost;
                    const isOutOfStock = item.qty === 0;
                    const isLowStock = !isOutOfStock && percentage < 20;
                    
                    return (
                        <div 
                            key={item.id} 
                            onClick={() => startEdit(item)}
                            className={`p-4 rounded-xl border relative overflow-hidden transition-all active:scale-95 cursor-pointer ${isOutOfStock ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}
                        >
                            {isOutOfStock && (
                                <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-bl-xl shadow-sm tracking-wider z-20">
                                    ¡AGOTADO!
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">
                                        {item.name}
                                        <Pencil size={14} className="text-gray-300 opacity-50"/>
                                    </h4>
                                    <span className="text-xs text-blue-500 font-bold uppercase">{item.category}</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-xl text-gray-900 dark:text-white">{formatCurrency(item.price)}</div>
                                    <div className="text-[10px] text-gray-400">Ganas: <span className="text-green-500 font-bold">{formatCurrency(profit)}</span></div>
                                </div>
                            </div>

                            <div className="mt-3 relative z-10">
                                <div className="flex justify-between text-xs font-bold mb-1 text-gray-500 dark:text-gray-400">
                                    <span className={isLowStock ? 'text-orange-500' : ''}>Stock: {item.qty}</span>
                                    <span>Inicial: {item.initialQty}</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                    <div className={`h-2.5 rounded-full transition-all duration-500 ${isOutOfStock ? 'bg-red-500' : (isLowStock ? 'bg-orange-500' : 'bg-blue-500')}`} style={{ width: `${percentage}%` }}></div>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {inventory.length === 0 && <div className="text-center text-gray-400 mt-10">No hay productos registrados.</div>}
            </div>
        </div>
    );
};

const NewSaleView = ({ categories, customers, inventory, onSave, onAddCustomer }) => {
  const [data, setData] = useState({
    customerId: null, category: categories[0] || '', description: '', price: '', quantity: 1, paidAmount: '', paymentMethod: 'efectivo', installments: '', productId: null
  });
  
  // Buscador Clientes
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const selectedCustomer = customers.find(c => c.id === data.customerId);

  const [prodSearch, setProdSearch] = useState('');
  const [isProdSearching, setIsProdSearching] = useState(false);
  const filteredProducts = inventory.filter(p => 
      p.category === data.category && p.name.toLowerCase().includes(prodSearch.toLowerCase())
  );

  const selectedProduct = inventory.find(p => p.id === data.productId);
  const hasStock = selectedProduct ? selectedProduct.qty >= parseInt(data.quantity || 0) : true;

  useEffect(() => {
      if (data.productId && data.quantity) {
          const product = inventory.find(p => p.id === data.productId);
          if (product) {
              const total = product.price * parseInt(data.quantity);
              setData(prev => ({ ...prev, price: total }));
          }
      }
  }, [data.quantity, data.productId, inventory]);

  const handleSave = () => {
    if (!data.customerId || !data.price) return;
    if (!hasStock) return; 
    onSave(data);
  };

  const debt = data.price && data.paidAmount !== '' ? parseInt(data.price) - parseInt(data.paidAmount) : 0;
  const isFiado = data.price && (data.paidAmount === '' ? false : debt > 0);

  const handleSelectProduct = (prod) => {
      setData({
          ...data,
          description: prod.name,
          price: prod.price, 
          productId: prod.id,
          quantity: 1 
      });
      setProdSearch(prod.name);
      setIsProdSearching(false);
  };

  return (
    <div className="pb-24 animate-in zoom-in-95 duration-300">
      <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-6">Nueva Venta</h2>
      
      {/* CLIENTE */}
      <div className="mb-6">
        <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2 ml-1">Cliente</label>
        {selectedCustomer ? (
           <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-3 rounded-xl">
             <span className="font-bold text-lg dark:text-blue-200">{selectedCustomer.name}</span>
             <button onClick={() => setData({...data, customerId: null})}><X className="text-gray-500" /></button>
           </div>
        ) : (
          <div className="relative">
            <input 
               type="text" placeholder="Buscar cliente..." 
               value={search}
               onChange={e => { setSearch(e.target.value); setIsSearching(true); }}
               className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white text-lg"
            />
            {isSearching && (search || filteredCustomers.length > 0) && (
               <div className="absolute z-20 w-full bg-white dark:bg-gray-800 shadow-xl rounded-xl mt-1 border dark:border-gray-700 max-h-60 overflow-y-auto">
                  {filteredCustomers.map(c => (
                    <button key={c.id} onClick={() => { setData({...data, customerId: c.id}); setSearch(''); setIsSearching(false); }} className="w-full text-left p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium dark:text-white">
                       {c.name}
                    </button>
                  ))}
                  {filteredCustomers.length === 0 && search && (
                    <button onClick={() => { const newId = onAddCustomer(search); setData({...data, customerId: newId}); setSearch(''); setIsSearching(false); }} className="w-full text-left p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold flex items-center gap-2">
                       <Plus size={18}/> Crear a "{search}"
                    </button>
                  )}
               </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2 ml-1">Categoría</label>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => {
                  setData({...data, category: cat, productId: null, description: '', price: ''});
                  setProdSearch('');
              }}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                data.category === cat 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-2">
        <div className="col-span-2 relative">
          <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-1 ml-1">Producto</label>
          <input 
            type="text" placeholder="Buscar producto..." 
            value={data.productId ? data.description : prodSearch} 
            onChange={e => { 
                setProdSearch(e.target.value); 
                setData({...data, description: e.target.value, productId: null}); 
                setIsProdSearching(true); 
            }}
            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white"
          />
          {isProdSearching && filteredProducts.length > 0 && (
              <div className="absolute z-20 w-full bg-white dark:bg-gray-800 shadow-xl rounded-xl mt-1 border dark:border-gray-700 max-h-40 overflow-y-auto">
                  {filteredProducts.map(p => (
                      <button key={p.id} onClick={() => handleSelectProduct(p)} className="w-full text-left p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center">
                          <span className="font-bold dark:text-white">{p.name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${p.qty === 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {p.qty === 0 ? 'Agotado' : `Stock: ${p.qty}`}
                          </span>
                      </button>
                  ))}
              </div>
          )}
        </div>
        <div>
          <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-1 ml-1">Cant.</label>
          <input 
            type="number" placeholder="1" value={data.quantity} onChange={e => setData({...data, quantity: e.target.value})}
            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white text-center font-bold"
          />
        </div>
      </div>

      {!hasStock && (
          <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 flex items-center gap-2 text-sm font-bold animate-bounce">
              <AlertTriangle size={20} />
              ¡Solo tienes {selectedProduct?.qty} en inventario!
          </div>
      )}

      <MoneyInput 
        label="Valor Total Venta" 
        value={data.price} 
        onChange={val => setData({...data, price: val})} 
        autoFocus 
      />

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-2xl border border-yellow-100 dark:border-yellow-800/50 mb-6">
        <div className="flex justify-between items-center mb-4">
          <label className="text-gray-700 dark:text-yellow-100 font-bold text-sm">¿Cuánto pagan ya?</label>
          {data.price && <span className="text-xs bg-yellow-200 text-yellow-900 px-2 py-1 rounded font-bold">Total: {formatCurrency(data.price)}</span>}
        </div>
        
        <MoneyInput 
          placeholder="Vacío = Contado / 0 = Fiado"
          value={data.paidAmount}
          onChange={val => setData({...data, paidAmount: val})}
        />
        
        {(data.paidAmount !== '' && data.paidAmount !== 0) && (
           <PaymentMethodSelector 
              selected={data.paymentMethod} 
              onSelect={id => setData({...data, paymentMethod: id})} 
           />
        )}

        {isFiado && (
            <div className="mt-4 pt-4 border-t border-yellow-200 dark:border-yellow-700 animate-in slide-in-from-top-2">
                <label className="block text-gray-700 dark:text-yellow-100 text-xs font-bold mb-2 uppercase">¿A cuántas quincenas?</label>
                <div className="flex items-center gap-2">
                    <Calendar className="text-yellow-600 dark:text-yellow-400" />
                    <input 
                        type="number" 
                        min="1"
                        placeholder="Ej: 1"
                        value={data.installments}
                        onChange={e => {
                            const val = parseInt(e.target.value);
                            if (val < 1 && e.target.value !== '') return;
                            setData({...data, installments: e.target.value})
                        }}
                        className="w-full p-3 rounded-xl border-2 border-yellow-300 dark:border-yellow-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-lg"
                    />
                </div>
            </div>
        )}
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
           Vacío = Contado | 0 = Fiado Total | Monto menor = Abono
        </p>
      </div>

      <button 
        onClick={handleSave} disabled={!data.customerId || !data.price || !hasStock}
        className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-xl shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
      >
        <Save size={24} /> Guardar Venta
      </button>
    </div>
  );
};

const OrdersView = ({ orders, categories, customers, onSave, onDelete, onAddCustomer, onMarkDone }) => {
    const [data, setData] = useState({
        customerId: null, category: categories[0] || '', product: '', quantity: 1, estimatedPrice: '', code: '', campaign: ''
    });
    
    const [search, setSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    const selectedCustomer = customers.find(c => c.id === data.customerId);

    const handleSave = () => {
        if (!data.customerId || !data.product) return;
        onSave(data);
        setData({ customerId: null, category: categories[0], product: '', quantity: 1, estimatedPrice: '', code: '', campaign: '' });
        setSearch('');
    };

    const isCatalogCategory = CATALOG_CATEGORIES.includes(data.category.toLowerCase());

    return (
        <div className="pb-24 animate-in slide-in-from-right-4">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Package className="text-purple-600" /> Encargos
            </h2>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-purple-100 dark:border-purple-900/30 mb-8">
                <h3 className="font-bold text-purple-700 dark:text-purple-400 mb-4 text-sm uppercase">Nuevo Pedido</h3>
                
                <div className="mb-4">
                    {selectedCustomer ? (
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                            <span className="font-bold dark:text-white">{selectedCustomer.name}</span>
                            <button onClick={() => setData({...data, customerId: null})}><X size={18}/></button>
                        </div>
                    ) : (
                        <div className="relative">
                             <input 
                                type="text" placeholder="¿Quién encarga?" 
                                value={search}
                                onChange={e => { setSearch(e.target.value); setIsSearching(true); }}
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                             />
                             {isSearching && (search || filteredCustomers.length > 0) && (
                                <div className="absolute z-20 w-full bg-white dark:bg-gray-800 shadow-lg rounded-xl mt-1 border dark:border-gray-700 max-h-40 overflow-y-auto">
                                    {filteredCustomers.map(c => (
                                        <button key={c.id} onClick={() => { setData({...data, customerId: c.id}); setSearch(''); setIsSearching(false); }} className="w-full text-left p-2 border-b dark:border-gray-700 dark:text-white">
                                            {c.name}
                                        </button>
                                    ))}
                                    {filteredCustomers.length === 0 && search && (
                                        <button onClick={() => { const newId = onAddCustomer(search); setData({...data, customerId: newId}); setSearch(''); setIsSearching(false); }} className="w-full text-left p-2 text-green-600 font-bold">
                                            Crear a "{search}"
                                        </button>
                                    )}
                                </div>
                             )}
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mb-3">
                    <select 
                        value={data.category} 
                        onChange={e => setData({...data, category: e.target.value})}
                        className="p-3 bg-gray-50 dark:bg-gray-700 border-none rounded-xl text-sm font-bold dark:text-white w-2/3"
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="w-1/3 relative">
                         <span className="absolute top-1 right-2 text-[10px] text-gray-400 font-bold uppercase">Cant.</span>
                         <input 
                            type="number" placeholder="1"
                            value={data.quantity} onChange={e => setData({...data, quantity: e.target.value})}
                            className="w-full p-3 text-center bg-gray-50 dark:bg-gray-700 border-none rounded-xl font-bold dark:text-white"
                        />
                    </div>
                </div>

                <div className={`flex gap-2 mb-3 transition-all ${isCatalogCategory ? 'opacity-100' : 'opacity-30 grayscale pointer-events-none'}`}>
                     <div className="relative w-1/2">
                       <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"><Hash size={14}/></div>
                       <input 
                           type="text" placeholder="Código" disabled={!isCatalogCategory}
                           value={data.code} onChange={e => setData({...data, code: e.target.value})}
                           className="w-full p-3 pl-7 bg-gray-50 dark:bg-gray-700 border-none rounded-xl text-sm font-bold dark:text-white"
                       />
                    </div>
                    <div className="relative w-1/2">
                       <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"><Calendar size={14}/></div>
                       <input 
                           type="number" placeholder="Campaña" disabled={!isCatalogCategory}
                           value={data.campaign} onChange={e => setData({...data, campaign: e.target.value})}
                           className="w-full p-3 pl-8 bg-gray-50 dark:bg-gray-700 border-none rounded-xl text-sm font-bold dark:text-white"
                       />
                    </div>
                </div>

                <input 
                    type="text" placeholder="Nombre del Producto" 
                    value={data.product} onChange={e => setData({...data, product: e.target.value})}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-none rounded-xl text-sm mb-3 dark:text-white"
                />
                
                <MoneyInput placeholder="Precio aprox." value={data.estimatedPrice} onChange={v => setData({...data, estimatedPrice: v})} />
                
                <button 
                    onClick={handleSave} 
                    disabled={!data.customerId || !data.product}
                    className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold mt-2"
                >
                    Anotar Encargo
                </button>
            </div>

            <div className="space-y-3">
                {[...orders].sort((a,b) => (a.status === 'HECHO' ? 1 : -1)).map(order => {
                    const customer = customers.find(c => c.id === order.customerId);
                    const isDone = order.status === 'HECHO';

                    return (
                        <div 
                            key={order.id} 
                            className={`relative p-4 rounded-xl border flex justify-between items-center transition-all ${
                                isDone 
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                            }`}
                        >
                            {isDone && (
                                <div className="absolute -top-2 right-4 bg-green-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm tracking-wider">
                                    ¡ENTREGADO!
                                </div>
                            )}

                            <div className={`flex-1 ${isDone ? 'opacity-60' : ''}`}>
                                <div className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                   {customer?.name}
                                   {order.code && (
                                       <span className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-0.5 font-mono">
                                           #{order.code}
                                       </span>
                                   )}
                                   {order.campaign && (
                                        <span className="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                            C-{order.campaign}
                                        </span>
                                   )}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                    <span className="font-bold text-gray-700 dark:text-gray-300">{order.quantity}x</span> 
                                    <span className={isDone ? 'line-through decoration-2 decoration-green-500' : ''}>{order.product}</span>
                                    <span className="text-purple-500 text-xs ml-1">({order.category})</span>
                                </div>
                                {order.estimatedPrice && <div className="text-xs font-bold text-gray-400 mt-1">~ {formatCurrency(order.estimatedPrice)}</div>}
                            </div>
                            
                            <div className="flex gap-2 ml-2">
                                <button 
                                    onClick={() => onMarkDone(order)} 
                                    className={`p-3 rounded-lg transition-colors shadow-sm ${isDone ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-500'}`}
                                >
                                    {isDone ? <CheckCircle size={20}/> : <Check size={20}/>}
                                </button>
                                <button onClick={() => onDelete(order)} className="p-3 text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100">
                                    <Trash2 size={20}/>
                                </button>
                            </div>
                        </div>
                    )
                })}
                {orders.length === 0 && <div className="text-center text-gray-400 mt-10">No hay encargos pendientes.</div>}
            </div>
        </div>
    );
};

// --- PEGA ESTE COMPONENTE QUE FALTA ---
const AdminView = ({ categories, onAddCategory }) => {
    const [newCat, setNewCat] = useState('');
    const [calcData, setCalcData] = useState({ totalInvestment: '', units: '', shipping: '', sellPrice: '' });
    const unitCost = (calcData.totalInvestment && calcData.units) ? Math.ceil(parseInt(calcData.totalInvestment) / parseInt(calcData.units)) : 0;
    const totalCost = (parseInt(calcData.totalInvestment || 0) + parseInt(calcData.shipping || 0));
    const totalRevenue = (parseInt(calcData.sellPrice || 0) * parseInt(calcData.units || 0));
    const totalProfit = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    return (
        <div className="pb-24 animate-in fade-in">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-6">Administración</h2>
            <section className="mb-8 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2"><Settings size={18} /> Categorías de Venta</h3>
                <div className="flex gap-2 mb-4 flex-wrap">{categories.map(c => <span key={c} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300">{c}</span>)}</div>
                <div className="flex gap-2"><input className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border dark:border-gray-700 dark:text-white" placeholder="Nueva (ej: Postres)" value={newCat} onChange={e => setNewCat(e.target.value)}/><button onClick={() => { if(newCat){ onAddCategory(newCat); setNewCat(''); }}} className="bg-blue-600 text-white p-3 rounded-xl font-bold">Agregar</button></div>
            </section>
            <section className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-green-500" /> Calculadora de Inversión</h3>
                <div className="space-y-3 mb-6">
                    <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-gray-500 uppercase">Inversión Total ($)</label><MoneyInput placeholder="Ej: 40.000" value={calcData.totalInvestment} onChange={v => setCalcData({...calcData, totalInvestment: v})} /></div><div><label className="text-xs font-bold text-gray-500 uppercase">Unidades</label><input type="number" placeholder="Ej: 10" className="w-full p-4 rounded-xl border-2 dark:bg-gray-900 dark:border-gray-700 dark:text-white font-bold text-xl" value={calcData.units} onChange={e => setCalcData({...calcData, units: e.target.value})} /></div></div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl flex justify-between items-center border border-blue-100 dark:border-blue-800"><span className="text-sm text-blue-800 dark:text-blue-200 font-medium">Costo Unitario Real:</span><span className="text-xl font-black text-blue-700 dark:text-blue-300">{formatCurrency(unitCost)}</span></div>
                    <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-gray-500 uppercase">Costo Envío</label><MoneyInput value={calcData.shipping} onChange={v => setCalcData({...calcData, shipping: v})} /></div><div><label className="text-xs font-bold text-gray-500 uppercase">Precio Venta (Unitario)</label><MoneyInput value={calcData.sellPrice} onChange={v => setCalcData({...calcData, sellPrice: v})} /></div></div>
                </div>
                {unitCost > 0 && calcData.sellPrice && (<div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl space-y-3 border-t-4 border-gray-200 dark:border-gray-700"><div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>Inversión Total (+Envío):</span><span>{formatCurrency(totalCost)}</span></div><div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>Venta Total Proyectada:</span><span>{formatCurrency(totalRevenue)}</span></div><div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-end"><div><p className="text-xs font-bold uppercase text-gray-400">Ganancia Neta</p><p className={`text-2xl font-black ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totalProfit)}</p></div><div className="text-right"><p className="text-xs font-bold uppercase text-gray-400">Margen</p><span className={`text-lg font-bold px-2 py-1 rounded ${totalProfit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{marginPercent}%</span></div></div></div>)}
            </section>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [view, setView] = useState('home');

  const [customers, setCustomers] = useState(() => JSON.parse(localStorage.getItem('customers')) || [
    { id: 1, name: 'Betty' }, { id: 2, name: 'Tito' }, { id: 3, name: 'La Vecina' }
  ]);
  
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('categories')) || [
    'Arequipe', 'Natura', 'Novaventa', 'Velas', 'Brownies'
  ]);

  const [sales, setSales] = useState(() => JSON.parse(localStorage.getItem('sales')) || []);
  const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem('orders')) || []);
  const [inventory, setInventory] = useState(() => JSON.parse(localStorage.getItem('inventory')) || []);

  const [selectedSale, setSelectedSale] = useState(null);
  const [modalTab, setModalTab] = useState('abono'); 
  const [orderToDelete, setOrderToDelete] = useState(null); 
  const [abonoAmount, setAbonoAmount] = useState('');
  const [abonoMethod, setAbonoMethod] = useState('efectivo');

  // --- DATOS EN TIEMPO REAL FIREBASE ---
  useEffect(() => {
    // Escuchar Ventas
    const unsubSales = onSnapshot(collection(db, "ventas"), (snapshot) => {
       // Ordenamos por fecha descendente (más reciente primero)
       const salesData = snapshot.docs
         .map(doc => ({ ...doc.data(), id: doc.id }))
         .sort((a, b) => new Date(b.date) - new Date(a.date));
       setSales(salesData);
    });

    // Escuchar Inventario
    const unsubInventory = onSnapshot(collection(db, "inventario"), (snapshot) => {
       const inventoryData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
       setInventory(inventoryData);
    });

    // Escuchar Clientes
    const unsubCustomers = onSnapshot(collection(db, "clientes"), (snapshot) => {
        const customerData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        // Si está vacío (primera vez), dejamos los default, si no, usamos la DB
        if (customerData.length > 0) setCustomers(customerData);
    });

    // Escuchar Encargos
    const unsubOrders = onSnapshot(collection(db, "encargos"), (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setOrders(ordersData);
    });

    return () => {
        unsubSales();
        unsubInventory();
        unsubCustomers();
        unsubOrders();
    };
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // YA NO NECESITAMOS LOCALSTORAGE SETTERS PORQUE FIREBASE LO HACE AUTOMATICO AL ESCRIBIR

  const handleAddCustomer = async (name) => {
    // Creamos en Firebase
    const newCustomer = { name };
    const docRef = await addDoc(collection(db, "clientes"), newCustomer);
    return docRef.id;
  };

  const handleAddProduct = async (prod) => {
      await addDoc(collection(db, "inventario"), prod);
  };

  const handleEditProduct = async (updatedProd) => {
      const productRef = doc(db, "inventario", updatedProd.id);
      await updateDoc(productRef, updatedProd);
  };

  const handleDeleteProduct = async (id) => {
      await deleteDoc(doc(db, "inventario", id));
  };

  const handleSaveSale = async (data) => {
    const total = parseInt(data.price);
    let paid = data.paidAmount === '' ? total : parseInt(data.paidAmount);
    const installmentsCount = parseInt(data.installments || 0);
    
    let initialPaymentDates = [];
    if (paid < total && installmentsCount > 0) {
        initialPaymentDates = calculatePaymentDates(new Date().toISOString(), installmentsCount);
    }

    // LOGICA DE STOCK: Actualizar en Firebase
    if (data.productId) {
        const productRef = doc(db, "inventario", data.productId);
        // Buscamos el producto actual en el estado local para saber cuanto restar
        const currentProduct = inventory.find(p => p.id === data.productId);
        if (currentProduct) {
            const newQty = Math.max(0, currentProduct.qty - parseInt(data.quantity));
            await updateDoc(productRef, { qty: newQty });
        }
    }

    const sale = {
      date: new Date().toISOString(),
      customerId: data.customerId,
      category: data.category,
      product: data.description || 'Varios',
      quantity: data.quantity,
      totalPrice: total,
      paidAmount: paid,
      status: total === paid ? 'PAGADO' : (paid === 0 ? 'FIADO' : 'ABONO'),
      installments: installmentsCount, 
      paymentDates: initialPaymentDates, 
      history: paid > 0 ? [{ date: new Date().toISOString(), amount: paid, method: data.paymentMethod }] : []
    };
    
    // Guardar Venta en Firebase
    const docRef = await addDoc(collection(db, "ventas"), sale);

    let descriptionExtended = data.description || 'Venta';
    if (sale.installments > 0) descriptionExtended += ` (a ${sale.installments} quincenas)`;

    sendToGoogleSheets({
        id: docRef.id, // Usamos el ID real de Firebase
        type: 'VENTA',
        customer: customers.find(c => c.id === data.customerId)?.name,
        category: data.category,
        description: descriptionExtended,
        product: data.description,
        quantity: data.quantity,
        unitPrice: total / parseInt(data.quantity),
        totalPrice: total,
        paidAmount: paid,
        paymentMethod: data.paymentMethod,
        status: sale.status,
        installments: data.installments
    });

    setView('home');
  };

  const handleAddAbono = async () => {
    if (!selectedSale || !abonoAmount) return;
    const amount = parseInt(abonoAmount);
    
    // Calculamos nuevos valores
    const currentPaid = parseInt(selectedSale.paidAmount || 0);
    const newPaid = currentPaid + amount;
    const total = parseInt(selectedSale.totalPrice || 0);
    const newStatus = newPaid >= total ? 'PAGADO' : 'ABONO';
    const newHistory = [...(selectedSale.history || []), { date: new Date().toISOString(), amount: amount, method: abonoMethod }];

    // Actualizamos en Firebase
    const saleRef = doc(db, "ventas", selectedSale.id);
    await updateDoc(saleRef, { 
        paidAmount: newPaid,
        status: newStatus,
        history: newHistory
    });

    sendToGoogleSheets({
        id: selectedSale.id,
        type: 'ABONO',
        customer: customers.find(c => c.id === selectedSale.customerId)?.name,
        category: selectedSale.category,
        description: `ABONO A (${selectedSale.product || 'Cuenta'})`,
        product: selectedSale.product,
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0, 
        paidAmount: amount,
        paymentMethod: abonoMethod,
        status: 'ABONO EXTRA'
    });

    setSelectedSale(null);
    setAbonoAmount('');
  };

  const handleUpdatePaymentPlan = async () => {
      const saleRef = doc(db, "ventas", selectedSale.id);
      await updateDoc(saleRef, {
          installments: selectedSale.installments,
          paymentDates: selectedSale.paymentDates
      });
      setSelectedSale(null); 
  };

  const handleDateChange = (index, newDateStr) => {
      const newDates = [...(selectedSale.paymentDates || [])];
      newDates[index] = newDateStr;
      setSelectedSale({ ...selectedSale, paymentDates: newDates });
  };

  const handleInstallmentsChange = (newCountStr) => {
      const newCount = parseInt(newCountStr || 0);
      const newDates = calculatePaymentDates(selectedSale.date, newCount);
      setSelectedSale({ ...selectedSale, installments: newCount, paymentDates: newDates });
  };

  const handleAddCategory = (newCat) => {
     setCategories([...categories, newCat]);
     // Opcional: Guardar categorías en Firebase si quisieras
  };

  const handleSaveOrder = async (orderData) => {
     const order = {
       date: new Date().toISOString(),
       customerId: orderData.customerId,
       category: orderData.category,
       product: orderData.product,
       code: orderData.code, 
       campaign: orderData.campaign,
       quantity: orderData.quantity,
       estimatedPrice: orderData.estimatedPrice,
       status: 'PENDIENTE'
     };
     await addDoc(collection(db, "encargos"), order);
  };

  const confirmDeleteOrder = async () => {
      if (orderToDelete) {
          await deleteDoc(doc(db, "encargos", orderToDelete.id));
          setOrderToDelete(null);
      }
  };

  const handleMarkOrderDone = async (order) => {
      const newStatus = order.status === 'HECHO' ? 'PENDIENTE' : 'HECHO';
      const orderRef = doc(db, "encargos", order.id);
      await updateDoc(orderRef, { status: newStatus });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300 select-none">
      <main className="max-w-md mx-auto p-4 min-h-screen">
        {view === 'home' && (
          <HomeView 
            sales={sales} 
            categories={categories} 
            customers={customers}
            darkMode={darkMode} 
            setDarkMode={setDarkMode}
            onSelectSale={(s) => { setSelectedSale(s); setModalTab('abono'); }}
          />
        )}
        
        {view === 'new-sale' && <NewSaleView categories={categories} customers={customers} inventory={inventory} onSave={handleSaveSale} onAddCustomer={handleAddCustomer} />}
        
        {view === 'orders' && <OrdersView orders={orders} categories={categories} customers={customers} onSave={handleSaveOrder} onDelete={setOrderToDelete} onAddCustomer={handleAddCustomer} onMarkDone={handleMarkOrderDone} />}
        
        {view === 'inventory' && <InventoryView inventory={inventory} categories={categories} onAddProduct={handleAddProduct} onEditProduct={handleEditProduct} onDeleteProduct={handleDeleteProduct} />}
        
        {view === 'admin' && <AdminView categories={categories} onAddCategory={handleAddCategory} />}
      </main>

      {selectedSale && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                  <button onClick={() => setModalTab('abono')} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${modalTab === 'abono' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>Abonar</button>
                  <button onClick={() => setModalTab('config')} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${modalTab === 'config' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>Plan Pagos</button>
              </div>
              <button onClick={() => setSelectedSale(null)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full"><X size={20}/></button>
            </div>
            <div className="text-center mb-4">
                <p className="text-sm text-gray-500">Saldo Pendiente</p>
                <p className="text-4xl font-black text-red-500">{formatCurrency(parseInt(selectedSale.totalPrice) - parseInt(selectedSale.paidAmount))}</p>
            </div>
            {modalTab === 'abono' && (
                <div className="animate-in slide-in-from-right-4">
                    <MoneyInput label="Valor Abono" value={abonoAmount} onChange={setAbonoAmount} autoFocus />
                    <div className="mb-6"><PaymentMethodSelector selected={abonoMethod} onSelect={setAbonoMethod} /></div>
                    <button onClick={handleAddAbono} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-green-500/30">Confirmar Abono</button>
                </div>
            )}
            {modalTab === 'config' && (
                <div className="animate-in slide-in-from-right-4 space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <div className="flex justify-between items-center mb-2"><label className="text-sm font-bold text-blue-800 dark:text-blue-200">Número de Cuotas</label><div className="flex items-center gap-2"><button onClick={() => handleInstallmentsChange(selectedSale.installments - 1)} disabled={selectedSale.installments <= 1} className="w-8 h-8 bg-white rounded-full font-bold shadow">-</button><span className="font-black text-xl w-6 text-center dark:text-white">{selectedSale.installments || 0}</span><button onClick={() => handleInstallmentsChange(selectedSale.installments + 1)} className="w-8 h-8 bg-white rounded-full font-bold shadow">+</button></div></div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Al cambiar el número, las fechas se calculan automáticamente desde el día de la venta.</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase text-gray-400 ml-1">Fechas de Pago (Editables)</p>
                        {selectedSale.paymentDates && selectedSale.paymentDates.map((date, idx) => (
                            <div key={idx} className="flex items-center gap-2"><span className="text-sm font-bold text-gray-500 w-6">#{idx + 1}</span><input type="date" value={date} onChange={(e) => handleDateChange(idx, e.target.value)} className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white font-bold"/></div>
                        ))}
                    </div>
                    <button onClick={handleUpdatePaymentPlan} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-lg shadow-lg mt-2 flex items-center justify-center gap-2"><Save size={20} /> Guardar Cambios</button>
                </div>
            )}
          </div>
        </div>
      )}

      {orderToDelete && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
                <h3 className="text-xl font-black mb-2">¿Eliminar Encargo?</h3>
                <p className="text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
                <div className="flex gap-3"><button onClick={() => setOrderToDelete(null)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 font-bold text-gray-700 dark:text-gray-300">Cancelar</button><button onClick={confirmDeleteOrder} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold">Sí, Eliminar</button></div>
            </div>
         </div>
      )}

      <div className="fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 pb-safe pt-1 px-2 flex justify-around items-center z-40 shadow-2xl">
        <NavBtn icon={Home} label="Inicio" active={view === 'home'} onClick={() => setView('home')} />
        <NavBtn icon={Package} label="Encargos" active={view === 'orders'} onClick={() => setView('orders')} />
        <div className="relative -top-5">
          <button onClick={() => setView('new-sale')} className="bg-blue-600 text-white p-4 rounded-full shadow-xl shadow-blue-500/40 hover:scale-105 transition-transform ring-4 ring-gray-50 dark:ring-gray-900">
            <Plus size={32} strokeWidth={3} />
          </button>
        </div>
        <NavBtn icon={Store} label="Inventario" active={view === 'inventory'} onClick={() => setView('inventory')} />
        <NavBtn icon={Settings} label="Admin" active={view === 'admin'} onClick={() => setView('admin')} />
      </div>
    </div>
  );
}

const NavBtn = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center p-3 rounded-2xl transition-all ${active ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 dark:text-gray-500'}`}>
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-bold mt-1">{label}</span>
  </button>
);