import React, { useState } from 'react';
import { Store } from 'lucide-react';
import MoneyInput from '../components/MoneyInput';
import { formatCurrency } from '../utils/formatters';
import CategoryTag from '../components/CategoryTag';

const InventoryView = ({ inventory, categories, onAddProduct, onEditProduct, onDeleteProduct }) => {
    const [newProd, setNewProd] = useState({ id: null, category: categories[0]?.name || 'Varios', name: '', qty: '', cost: '', price: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [filterCategory, setFilterCategory] = useState('Todas');

    const filteredInventory = inventory.filter(item => {
        if (filterCategory === 'Todas') return true;
        return item.category === filterCategory;
    });

    const handleAddOrUpdate = () => {
        if (!newProd.name || !newProd.qty || !newProd.price) return;
        
        const productData = {
            ...newProd,
            qty: parseInt(newProd.qty),
            initialQty: isEditing ? (newProd.initialQty || parseInt(newProd.qty)) : parseInt(newProd.qty),
            cost: parseInt(newProd.cost || 0),
            price: parseInt(newProd.price)
        };

        if (isEditing) {
            onEditProduct(productData);
            setIsEditing(false);
        } else {
            onAddProduct({ ...productData, id: Date.now(), initialQty: parseInt(newProd.qty) });
        }
        
        setNewProd({ id: null, category: categories[0]?.name || 'Varios', name: '', qty: '', cost: '', price: '' });
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
            setNewProd({ id: null, category: categories[0]?.name || 'Varios', name: '', qty: '', cost: '', price: '' });
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
                
                <div className="flex flex-col gap-3 mb-3">
                    <div className="w-full">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block ml-1">Categoría</label>
                        <select
                            value={newProd.category}
                            onChange={e => setNewProd({...newProd, category: e.target.value})}
                            className="w-full p-3 rounded-xl border-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white font-bold outline-none focus:border-blue-500 transition-colors"
                        >
                            {categories.map(c => {
                                const name = c.name || c;
                                return <option key={c.id || name} value={name}>{name}</option>
                            })}
                        </select>
                    </div>
                    <div className="w-full">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block ml-1">Nombre del Producto</label>
                        <input 
                            type="text" placeholder="Ej: Crema Corporal 400ml" 
                            value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})}
                            className="w-full p-3 bg-white dark:bg-gray-700 border-2 border-gray-100 dark:border-gray-600 rounded-xl text-sm font-bold dark:text-white outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
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
                            textClass="text-lg text-blue-600" 
                        />
                    </div>
                </div>

                <button onClick={handleAddOrUpdate} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-transform">
                    {isEditing ? 'Guardar Cambios' : 'Agregar al Inventario'}
                </button>
                
                {isEditing && (
                    <button onClick={handleDelete} className="w-full mt-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl font-bold text-sm">
                        Eliminar Producto
                    </button>
                )}
            </div>

            {/* FILTROS DE CATEGORÍA */}
            <div className="mb-6 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setFilterCategory('Todas')}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterCategory === 'Todas' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
                    >
                        Todas
                    </button>
                    {categories.map(c => {
                        const name = c.name || c;
                        return (
                            <button 
                                key={c.id || name}
                                onClick={() => setFilterCategory(name)}
                                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterCategory === name ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
                            >
                                {name}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="space-y-3">
                {filteredInventory.map(item => {
                    const percentage = item.price ? Math.round(((item.price - item.cost) / item.price) * 100) : 0;
                    const profit = item.price - item.cost;
                    const isOutOfStock = item.qty <= 0;
                    
                    // Calculate progress percentage safely
                    let progressPercent = 100;
                    if (item.initialQty && item.initialQty > 0) {
                        progressPercent = ((item.qty) / item.initialQty) * 100;
                    } else {
                        // Fallback if no initialQty: if qty > 0 show full, else empty
                        progressPercent = item.qty > 0 ? 100 : 0;
                    }
                    // Clamp between 0 and 100
                    progressPercent = Math.min(100, Math.max(0, progressPercent));

                    return (
                        <div
                            key={item.id}
                            onClick={() => startEdit(item)}
                            className={`p-4 rounded-2xl border transition-all active:scale-[0.99] cursor-pointer ${isOutOfStock ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white text-base leading-tight mb-1">{item.name}</h3>
                                    <CategoryTag category={item.category} />
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-lg text-gray-900 dark:text-white">{formatCurrency(item.price)}</div>
                                    <div className="text-[10px] text-green-600 dark:text-green-400 font-bold">
                                        Ganancia: {formatCurrency(profit)}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-3">
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-1">
                                    <span>Progreso de Venta</span>
                                    <span>{item.qty} restantes</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-blue-500'}`} 
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 mt-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded ${percentage >= 30 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    Margen: {percentage}%
                                </span>
                            </div>
                        </div>
                    )
                })}
                {filteredInventory.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Store size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No hay productos en esta categoría.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryView;
