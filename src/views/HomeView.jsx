import React, { useState, useMemo, useRef } from 'react';
import { Sun, Moon, UserCheck } from 'lucide-react';
import StatCard from '../components/StatCard';
import { PAYMENT_METHODS } from '../constants';
import { formatCurrency } from '../utils/formatters';
import { formatDate, formatDateShort, getUpcomingQuincenaDate } from '../utils/dates';
import { 
  Wallet, ChevronDown, ChevronUp, Calendar, Edit2, Trash2
} from 'lucide-react';
import CategoryTag from '../components/CategoryTag';

const HomeView = ({ sales, categories, onSelectSale, darkMode, setDarkMode, customers, onDeleteSale }) => {
  const [expandedMethod, setExpandedMethod] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);
  
  // Swipe state
  const [swipedSaleId, setSwipedSaleId] = useState(null);
  
  // Refs for gesture tracking to avoid state batching issues with onClick
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const isSwipingRef = useRef(false);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
      touchEndRef.current = null; 
      touchStartRef.current = e.targetTouches[0].clientX;
      isSwipingRef.current = false;
  }

  const onTouchMove = (e) => {
      touchEndRef.current = e.targetTouches[0].clientX;
      // If moving significantly, mark as potential swipe
      if (touchStartRef.current && Math.abs(touchStartRef.current - touchEndRef.current) > 10) {
          isSwipingRef.current = true;
      }
  }

  const onTouchEndHandler = (saleId) => {
      if (!touchStartRef.current || !touchEndRef.current) return;
      const distance = touchStartRef.current - touchEndRef.current;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;
      
      if (isLeftSwipe) {
          setSwipedSaleId(saleId);
          isSwipingRef.current = true;
      } else if (isRightSwipe && swipedSaleId === saleId) {
          setSwipedSaleId(null);
          isSwipingRef.current = true;
      }
      
      // Reset refs after a short delay to ensure onClick sees the flag, 
      // but actually onClick fires immediately after. 
      // We'll reset isSwipingRef in the click handler or on next start.
  }

  // Mouse handlers for desktop testing
  const onMouseDown = (e) => {
      touchEndRef.current = null;
      touchStartRef.current = e.clientX;
      isSwipingRef.current = false;
  }

  const onMouseMove = (e) => {
      if (touchStartRef.current) {
          touchEndRef.current = e.clientX;
          if (Math.abs(touchStartRef.current - touchEndRef.current) > 10) {
              isSwipingRef.current = true;
          }
      }
  }

  const onMouseUpHandler = (saleId) => {
      onTouchEndHandler(saleId);
      // Clear refs for mouse specifically since it might not trigger click if dragged off?
      // But we need it for click.
      touchStartRef.current = null;
  }

  const onMouseLeave = () => {
      touchStartRef.current = null;
      touchEndRef.current = null;
      isSwipingRef.current = false;
  }

  const handleSaleClick = (sale) => {
      // If it was a swipe (flagged true), ignore the click
      if (isSwipingRef.current) {
          isSwipingRef.current = false; // Reset for next time
          return;
      }
      onSelectSale(sale);
  }

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
    const catName = cat.name || cat; // Handle object or string for backward compat
    const catSales = sales.filter(s => s.category === catName);
    const sold = catSales.reduce((sum, s) => sum + parseInt(s.totalPrice || 0), 0);
    const debt = catSales.reduce((sum, s) => {
        const total = parseInt(s.totalPrice || 0);
        const paid = parseInt(s.paidAmount || 0);
        return sum + (total - paid);
    }, 0);
    return { name: catName, sold, debt };
  });

  const upcomingDebtors = useMemo(() => {
      const nextQuincenaDate = getUpcomingQuincenaDate();
      const nextQuincenaStr = nextQuincenaDate.toISOString().split('T')[0];
      
      const debtors = sales.filter(s => {
          const debt = parseInt(s.totalPrice) - parseInt(s.paidAmount);
          if (debt <= 0) return false;
          return s.paymentDates && s.paymentDates.includes(nextQuincenaStr);
      });

      // Group by customer name (normalized) to merge duplicates
      const grouped = {};
      debtors.forEach(sale => {
          const customer = customers.find(c => c.id === sale.customerId) || { name: 'Cliente' };
          const customerNameKey = customer.name.toLowerCase().trim();
          
          if (!grouped[customerNameKey]) {
              grouped[customerNameKey] = {
                  customer: customer,
                  items: [],
                  totalDebt: 0
              };
          }
          // Check if item already exists in group to prevent duplicates
          if (!grouped[customerNameKey].items.some(item => item.id === sale.id)) {
              const debt = parseInt(sale.totalPrice) - parseInt(sale.paidAmount);
              grouped[customerNameKey].items.push({ ...sale, debt });
              grouped[customerNameKey].totalDebt += debt;
          }
      });

      return Object.values(grouped);
  }, [sales, customers]);

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
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                  {upcomingDebtors.map(group => (
                      <div key={group.customer.id} className="bg-white dark:bg-indigo-950/50 p-4 rounded-xl border border-transparent hover:border-indigo-200 dark:hover:border-indigo-700">
                          <div className="flex justify-between items-center mb-2 border-b border-indigo-50 dark:border-indigo-900/50 pb-2">
                              <p className="font-bold text-indigo-900 dark:text-indigo-100 text-lg">{group.customer.name}</p>
                              <span className="font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/50 px-2 py-1 rounded-lg">
                                  Total: {formatCurrency(group.totalDebt)}
                              </span>
                          </div>
                          <div className="space-y-2">
                              {group.items.map(sale => (
                                  <div key={sale.id} onClick={() => handleSaleClick(sale)} className="flex justify-between items-center text-sm cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-1.5 rounded transition-colors">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                          <CategoryTag category={sale.category} className="scale-75 origin-left shrink-0" />
                                          <span className="text-gray-600 dark:text-gray-300 font-medium truncate">{sale.product}</span>
                                      </div>
                                      <span className="font-bold text-red-500 dark:text-red-400 whitespace-nowrap ml-2">{formatCurrency(sale.debt)}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
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
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 mb-3 text-sm space-y-2 animate-in slide-in-from-top-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
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
        {categoryStats.length === 0 ? (
            <p className="text-gray-400 text-xs italic ml-1">No hay categorías registradas.</p>
        ) : (
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x min-h-[100px]">
            {categoryStats.map(cat => (
                <div key={cat.name || 'unknown'} className="snap-center min-w-[160px] p-4 rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm">
                <div className="font-bold text-gray-800 dark:text-white mb-2 text-lg flex items-center gap-2">
                    <CategoryTag category={cat.name} />
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Ventas: {formatCurrency(cat.sold)}</span>
                    <span className="text-xs text-red-500 dark:text-red-400 font-medium">Deben: {formatCurrency(cat.debt)}</span>
                </div>
                </div>
            ))}
            </div>
        )}
      </div>

      <div>
        <h3 className="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase mb-3 tracking-wider ml-1">Últimas Ventas</h3>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
          {sales.length === 0 ? <p className="text-center text-gray-400 py-8">No hay ventas aún.</p> : sales.map(sale => {
            const customer = customers.find(c => c.id === sale.customerId);
            const debt = parseInt(sale.totalPrice) - parseInt(sale.paidAmount);
            const isPaid = debt <= 0;
            
            const lastPayment = sale.history && sale.history.length > 0 ? sale.history[sale.history.length - 1] : null;
            
            // Helper to get payment method info locally since it was not exported
            const getPaymentMethodInfo = (id) => {
                return PAYMENT_METHODS.find(m => m.id === id) || PAYMENT_METHODS[5];
            };

            const paymentMethodInfo = lastPayment ? getPaymentMethodInfo(lastPayment.method) : null;
            
            const installmentsCount = parseInt(sale.installments || 0);
            const payDates = sale.paymentDates || [];
            const nextDatesStr = payDates.slice(0, 2).map(d => formatDateShort(d)).join(', ');

            return (
              <div 
                key={sale.id} 
                className="relative overflow-hidden rounded-xl mb-3"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={() => onTouchEndHandler(sale.id)}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={() => onMouseUpHandler(sale.id)}
                onMouseLeave={onMouseLeave}
              >
                  {/* DELETE BACKGROUND ACTION */}
                  <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 rounded-xl">
                      <Trash2 className="text-white animate-pulse" size={24} />
                  </div>

                  {/* CARD CONTENT */}
                  <div 
                    onClick={() => handleSaleClick(sale)}
                    className={`relative p-4 bg-white dark:bg-gray-800 border-l-[6px] shadow-sm active:scale-[0.98] transition-transform duration-300 ease-out ${
                      isPaid ? 'border-green-400 dark:border-green-500' : (sale.paidAmount === 0 ? 'border-red-400 dark:border-red-500' : 'border-orange-400 dark:border-orange-500')
                    }`}
                    style={{ transform: swipedSaleId === sale.id ? 'translateX(-80px)' : 'translateX(0)' }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-bold text-lg text-gray-800 dark:text-gray-100">{customer?.name || 'Cliente'}</div>
                        
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
                          <div className="flex items-center gap-1 group/edit">
                              <div className="font-black text-gray-900 dark:text-white text-lg">{formatCurrency(sale.totalPrice)}</div>
                          </div>
                        
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
                  
                  {/* DELETE BUTTON OVERLAY (Clickable when swiped) */}
                  {swipedSaleId === sale.id && (
                      <button 
                          onClick={(e) => { e.stopPropagation(); setSaleToDelete(sale); }}
                          className="absolute top-0 right-0 w-[80px] h-full z-10 opacity-0"
                      >
                          Delete
                      </button>
                  )}
              </div>
            );
          })}
        </div>
      </div>


      {/* DELETE CONFIRMATION MODAL */}
      {saleToDelete && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-black mb-2 text-gray-800 dark:text-white">¿Eliminar Venta?</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Estás a punto de eliminar la venta de <strong>{customers.find(c => c.id === saleToDelete.customerId)?.name}</strong> por <strong>{formatCurrency(saleToDelete.totalPrice)}</strong>.
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setSaleToDelete(null)} 
                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 font-bold text-gray-700 dark:text-gray-300"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => { onDeleteSale(saleToDelete.id); setSaleToDelete(null); }} 
                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/30"
                    >
                        Sí, Eliminar
                    </button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default HomeView;
