import React from 'react';
import { X, Save, Edit2, Trash2 } from 'lucide-react';
import MoneyInput from './MoneyInput';
import PaymentMethodSelector from './PaymentMethodSelector';
import { formatCurrency } from '../utils/formatters';

const SaleDetailModal = ({ 
    sale, 
    onClose, 
    modalTab, 
    setModalTab, 
    abonoAmount, 
    setAbonoAmount, 
    abonoMethod, 
    setAbonoMethod, 
    onAddAbono, 
    onUpdatePaymentPlan, 
    onDateChange, 
    onInstallmentsChange,
    onUpdateSaleTotal,
    onDelete 
}) => {
    const [isEditingTotal, setIsEditingTotal] = React.useState(false);
    const [editTotalValue, setEditTotalValue] = React.useState('');

    if (!sale) return null;

    const handleSaveTotal = () => {
        if (editTotalValue && !isNaN(editTotalValue)) {
            onUpdateSaleTotal(sale.id, parseInt(editTotalValue));
            setIsEditingTotal(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                  <button onClick={() => setModalTab('abono')} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${modalTab === 'abono' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>Abonar</button>
                  <button onClick={() => setModalTab('config')} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${modalTab === 'config' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>Plan Pagos</button>
              </div>
              <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full"><X size={20}/></button>
            </div>
            <div className="text-center mb-4">
                <p className="text-sm text-gray-500">Saldo Pendiente</p>
                <div className="flex items-center justify-center gap-2">
                    {isEditingTotal ? (
                        <div className="flex items-center gap-1">
                            <input 
                                type="number" 
                                value={editTotalValue} 
                                onChange={e => setEditTotalValue(e.target.value)}
                                className="w-32 p-1 text-2xl font-black text-center border-b-2 border-blue-500 outline-none"
                                autoFocus
                            />
                            <button onClick={handleSaveTotal} className="p-1 bg-green-100 text-green-600 rounded-full"><Save size={16}/></button>
                        </div>
                    ) : (
                        <>
                            <p className="text-4xl font-black text-red-500">{formatCurrency(parseInt(sale.totalPrice) - parseInt(sale.paidAmount))}</p>
                            <button onClick={() => { setIsEditingTotal(true); setEditTotalValue(sale.totalPrice); }} className="text-gray-300 hover:text-blue-500"><Edit2 size={16}/></button>
                        </>
                    )}
                </div>
            </div>
            {modalTab === 'abono' && (
                <div className="animate-in slide-in-from-right-4">
                    <MoneyInput label="Valor Abono" value={abonoAmount} onChange={setAbonoAmount} autoFocus />
                    <div className="mb-6"><PaymentMethodSelector selected={abonoMethod} onSelect={setAbonoMethod} /></div>
                    <button onClick={onAddAbono} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-green-500/30">Confirmar Abono</button>
                </div>
            )}
            {modalTab === 'config' && (
                <div className="animate-in slide-in-from-right-4 space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <div className="flex justify-between items-center mb-2"><label className="text-sm font-bold text-blue-800 dark:text-blue-200">Número de Cuotas</label><div className="flex items-center gap-2"><button onClick={() => onInstallmentsChange(sale.installments - 1)} disabled={sale.installments <= 1} className="w-8 h-8 bg-white rounded-full font-bold shadow">-</button><span className="font-black text-xl w-6 text-center dark:text-white">{sale.installments || 0}</span><button onClick={() => onInstallmentsChange(sale.installments + 1)} className="w-8 h-8 bg-white rounded-full font-bold shadow">+</button></div></div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Al cambiar el número, las fechas se calculan automáticamente desde el día de la venta.</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase text-gray-400 ml-1">Fechas de Pago (Editables)</p>
                        {sale.paymentDates && sale.paymentDates.map((date, idx) => (
                            <div key={idx} className="flex items-center gap-2"><span className="text-sm font-bold text-gray-500 w-6">#{idx + 1}</span><input type="date" value={date} onChange={(e) => onDateChange(idx, e.target.value)} className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white font-bold"/></div>
                        ))}
                    </div>
                    <button onClick={onUpdatePaymentPlan} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-lg shadow-lg mt-2 flex items-center justify-center gap-2"><Save size={20} /> Guardar Cambios</button>
                    
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                        <button 
                            onClick={() => { if(window.confirm('¿Eliminar esta venta permanentemente?')) { onDelete(sale.id); onClose(); } }} 
                            className="w-full py-3 rounded-xl text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Trash2 size={18} /> Eliminar Venta
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
    );
};

export default SaleDetailModal;
