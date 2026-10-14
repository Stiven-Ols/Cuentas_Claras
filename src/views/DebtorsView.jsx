import React, { useState, useMemo } from 'react';
import { Users, ChevronDown, ChevronUp, TrendingDown, Calendar, Package } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { formatDate } from '../utils/dates';
import CategoryTag from '../components/CategoryTag';

const DebtorsView = ({ sales, customers }) => {
  const [expandedDebtor, setExpandedDebtor] = useState(null);

  // Calcular deudas agrupadas por cliente
  const debtorsData = useMemo(() => {
    const debtorsMap = {};

    sales.forEach(sale => {
      const debt = sale.totalPrice - sale.paidAmount;
      
      // Solo considerar ventas con deuda pendiente
      if (debt <= 0) return;

      const customerId = sale.customerId;
      const customer = customers.find(c => c.id === customerId);
      const customerName = customer?.name || 'Cliente Desconocido';

      if (!debtorsMap[customerId]) {
        debtorsMap[customerId] = {
          customerId,
          customerName,
          totalDebt: 0,
          itemCount: 0,
          items: []
        };
      }

      debtorsMap[customerId].totalDebt += debt;
      debtorsMap[customerId].itemCount += 1;
      debtorsMap[customerId].items.push({
        saleId: sale.id,
        product: sale.product || 'Producto',
        category: sale.category,
        date: sale.date,
        totalPrice: sale.totalPrice,
        paidAmount: sale.paidAmount,
        remainingDebt: debt,
        installments: sale.installments || 0
      });
    });

    // Convertir a array y ordenar por deuda descendente
    return Object.values(debtorsMap).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [sales, customers]);

  // Calcular total general de cartera
  const totalPortfolio = useMemo(() => {
    return debtorsData.reduce((sum, debtor) => sum + debtor.totalDebt, 0);
  }, [debtorsData]);

  const toggleDebtor = (customerId) => {
    setExpandedDebtor(expandedDebtor === customerId ? null : customerId);
  };

  return (
    <div className="pb-24 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800 dark:text-white">Cartera</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Users size={16} />
          <span>{debtorsData.length} deudores</span>
        </div>
      </div>

      {/* Total de Cartera - Card Destacada */}
      <div className="mb-6 bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 p-6 rounded-2xl shadow-lg text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm font-medium opacity-90">Total en Cartera</p>
            <p className="text-3xl font-black">{formatCurrency(totalPortfolio)}</p>
          </div>
        </div>
        <p className="text-xs opacity-75 mt-2">
          💡 Dinero pendiente de cobro de {debtorsData.length} cliente{debtorsData.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Lista de Deudores */}
      {debtorsData.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={40} className="text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
            ¡Todo cobrado! 🎉
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay cuentas pendientes por cobrar
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {debtorsData.map((debtor) => {
            const isExpanded = expandedDebtor === debtor.customerId;
            
            return (
              <div
                key={debtor.customerId}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all"
              >
                {/* Tarjeta Principal del Cliente */}
                <button
                  onClick={() => toggleDebtor(debtor.customerId)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                      <Users size={20} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-800 dark:text-white">
                        {debtor.customerName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {debtor.itemCount} producto{debtor.itemCount !== 1 ? 's' : ''} pendiente{debtor.itemCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-black text-red-600 dark:text-red-400">
                        {formatCurrency(debtor.totalDebt)}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Acordeón - Detalle de Ventas */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 animate-in slide-in-from-top-2">
                    <div className="space-y-3">
                      {debtor.items.map((item) => (
                        <div
                          key={item.saleId}
                          className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <Package size={16} className="text-gray-400 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-sm text-gray-800 dark:text-white">
                                  {item.product}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <CategoryTag category={item.category} small />
                                  {item.installments > 0 && (
                                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">
                                      {item.installments} quincenas
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                            <Calendar size={12} />
                            <span>{formatDate(item.date)}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">Total</p>
                              <p className="font-bold text-gray-700 dark:text-gray-300">
                                {formatCurrency(item.totalPrice)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">Pagado</p>
                              <p className="font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(item.paidAmount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">Debe</p>
                              <p className="font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(item.remainingDebt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DebtorsView;
