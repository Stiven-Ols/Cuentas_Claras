import React, { useState } from 'react';
import { Settings, TrendingUp } from 'lucide-react';
import MoneyInput from '../components/MoneyInput';
import { formatCurrency } from '../utils/formatters';

const AdminView = ({ categories, onAddCategory, onDeleteCategory, onAddProduct }) => {
    const [newCat, setNewCat] = useState('');
    const [calcData, setCalcData] = useState({ totalInvestment: '', units: '', shipping: '', sellPrice: '', name: '' });
    
    const unitCost = (calcData.totalInvestment && calcData.units) ? Math.ceil(parseInt(calcData.totalInvestment) / parseInt(calcData.units)) : 0;
    const totalCost = (parseInt(calcData.totalInvestment || 0) + parseInt(calcData.shipping || 0));
    const totalRevenue = (parseInt(calcData.sellPrice || 0) * parseInt(calcData.units || 0));
    const totalProfit = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    const [showNotification, setShowNotification] = useState(false);

    const handleSaveToInventory = () => {
        if (!calcData.name || !calcData.units || !calcData.sellPrice) return;
        onAddProduct({
            name: calcData.name,
            qty: parseInt(calcData.units),
            cost: unitCost,
            price: parseInt(calcData.sellPrice),
            category: categories[0]?.name || 'Varios' // Default category
        });
        // Reset form and notify
        setCalcData({ ...calcData, name: '', units: '', totalInvestment: '', shipping: '' });
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    };

    return (
        <div className="pb-24 animate-in fade-in">
            {showNotification && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-xl z-50 animate-in slide-in-from-top-4 flex items-center gap-2 font-bold">
                    ✅ ¡Operación completada!
                </div>
            )}
            
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-6">Administración</h2>
            
            <section className="mb-8 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2"><Settings size={18} /> Categorías de Venta</h3>
                <div className="flex gap-2 mb-4 flex-wrap">
                    {categories.map(c => (
                        <div key={c.id} className="flex items-center gap-1 pl-3 pr-1 py-1 bg-gray-100 dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600">
                            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{c.name}</span>
                            <button 
                                onClick={() => onDeleteCategory(c.id)}
                                className="p-1 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors"
                            >
                                <Settings size={12} className="rotate-45" /> {/* Using rotated settings as close icon or we can import X */}
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input 
                        className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Nueva (ej: Postres)" 
                        value={newCat} 
                        onChange={e => setNewCat(e.target.value)}
                    />
                    <button 
                        onClick={() => { if(newCat){ onAddCategory(newCat); setNewCat(''); }}} 
                        className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                    >
                        Agregar
                    </button>
                </div>
            </section>

            <section className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-green-500" /> Calculadora de Inversión</h3>
                <div className="space-y-3 mb-6">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre Producto (Opcional para guardar)</label>
                        <input 
                            type="text" 
                            placeholder="Ej: Caja de Brownies" 
                            className="w-full p-3 rounded-xl border-2 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                            value={calcData.name} 
                            onChange={e => setCalcData({...calcData, name: e.target.value})} 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Inversión Total ($)</label>
                            <MoneyInput placeholder="Ej: 40.000" value={calcData.totalInvestment} onChange={v => setCalcData({...calcData, totalInvestment: v})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Unidades</label>
                            <input type="number" placeholder="Ej: 10" className="w-full p-2.5 rounded-xl border-2 dark:bg-gray-900 dark:border-gray-700 dark:text-white font-bold text-lg" value={calcData.units} onChange={e => setCalcData({...calcData, units: e.target.value})} />
                        </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl flex justify-between items-center border border-blue-100 dark:border-blue-800">
                        <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">Costo Unitario Real:</span>
                        <span className="text-xl font-black text-blue-700 dark:text-blue-300">{formatCurrency(unitCost)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Costo Envío</label>
                            <MoneyInput value={calcData.shipping} onChange={v => setCalcData({...calcData, shipping: v})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Precio Venta (Unitario)</label>
                            <MoneyInput value={calcData.sellPrice} onChange={v => setCalcData({...calcData, sellPrice: v})} />
                        </div>
                    </div>
                </div>

                {unitCost > 0 && calcData.sellPrice && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl space-y-3 border-t-4 border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>Inversión Total (+Envío):</span><span>{formatCurrency(totalCost)}</span></div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>Venta Total Proyectada:</span><span>{formatCurrency(totalRevenue)}</span></div>
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-end">
                            <div>
                                <p className="text-xs font-bold uppercase text-gray-400">Ganancia Neta</p>
                                <p className={`text-2xl font-black ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totalProfit)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold uppercase text-gray-400">Margen</p>
                                <span className={`text-lg font-bold px-2 py-1 rounded ${totalProfit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{marginPercent}%</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveToInventory}
                            className="w-full mt-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:scale-[0.98] transition-transform flex justify-center items-center gap-2"
                        >
                            <TrendingUp size={18} />
                            Guardar en Inventario
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminView;
