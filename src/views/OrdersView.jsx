import React, { useState } from 'react';
import { Package, X, Plus } from 'lucide-react';
import { CATALOG_CATEGORIES } from '../constants';

const OrdersView = ({ orders, categories, customers, onSave, onDelete, onAddCustomer, onMarkDone }) => {
    const [newOrder, setNewOrder] = useState({
        customerId: '',
        category: categories[0]?.name || '',
        product: '',
        code: '',
        campaign: '',
        quantity: 1,
        estimatedPrice: ''
    });
    
    const [search, setSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    const selectedCustomer = customers.find(c => c.id === newOrder.customerId);

    const handleSave = () => {
        if (!newOrder.customerId || !newOrder.product) return;
        onSave(newOrder);
        setNewOrder({ customerId: '', category: categories[0]?.name || '', product: '', quantity: 1, estimatedPrice: '', code: '', campaign: '' });
        setSearch('');
    };

    const isCatalogCategory = CATALOG_CATEGORIES.includes(newOrder.category.toLowerCase());

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
                            <button onClick={() => setNewOrder({...newOrder, customerId: ''})}><X size={18}/></button>
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
                                        <button key={c.id} onClick={() => { setNewOrder({...newOrder, customerId: c.id}); setSearch(''); setIsSearching(false); }} className="w-full text-left p-2 border-b dark:border-gray-700 dark:text-white">
                                            {c.name}
                                        </button>
                                    ))}
                                    {filteredCustomers.length === 0 && search && (
                                        <button onClick={() => { const newId = onAddCustomer(search); setNewOrder({...newOrder, customerId: newId}); setSearch(''); setIsSearching(false); }} className="w-full text-left p-2 text-green-600 font-bold">
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
                    value={newOrder.category}
                    onChange={e => setNewOrder({...newOrder, category: e.target.value})}
                    className="w-full p-3 rounded-xl border-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white font-bold"
                >
                    {categories.map(c => {
                        const name = c.name || c;
                        return <option key={c.id || name} value={name}>{name}</option>
                    })}
                </select>
                    <div className="w-1/3 relative">
                         <span className="absolute top-1 right-2 text-[10px] text-gray-400 font-bold uppercase">Cant.</span>
                         <input 
                            type="number" placeholder="1"
                            value={newOrder.quantity} onChange={e => setNewOrder({...newOrder, quantity: e.target.value})}
                            className="w-full p-3 text-center bg-gray-50 dark:bg-gray-700 border-none rounded-xl font-bold dark:text-white"
                        />
                    </div>
                </div>

                <div className={`flex gap-2 mb-3 transition-all ${isCatalogCategory ? 'opacity-100' : 'opacity-30 grayscale pointer-events-none'}`}>
                    <input 
                        type="text" placeholder="Cód. Revista" 
                        value={newOrder.code} onChange={e => setNewOrder({...newOrder, code: e.target.value})}
                        className="w-1/2 p-3 bg-gray-50 dark:bg-gray-700 border-none rounded-xl text-sm dark:text-white"
                    />
                    <input 
                        type="text" placeholder="Campaña" 
                        value={newOrder.campaign} onChange={e => setNewOrder({...newOrder, campaign: e.target.value})}
                        className="w-1/2 p-3 bg-gray-50 dark:bg-gray-700 border-none rounded-xl text-sm dark:text-white"
                    />
                </div>

                <input 
                    type="text" placeholder="Descripción del Producto" 
                    value={newOrder.product} onChange={e => setNewOrder({...newOrder, product: e.target.value})}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-none rounded-xl font-bold dark:text-white mb-4"
                />

                <button onClick={handleSave} disabled={!newOrder.customerId || !newOrder.product} className="w-full bg-purple-600 text-white p-3 rounded-xl font-bold disabled:opacity-50">
                    Guardar Encargo
                </button>
            </div>

            <div className="space-y-3">
                {orders.map(order => {
                     const customer = customers.find(c => c.id === order.customerId);
                     return (
                        <div key={order.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border-l-4 border-purple-500 shadow-sm relative">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-black text-gray-800 dark:text-white">{customer?.name}</h4>
                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">{order.category}</span>
                                    {order.campaign && <span className="text-xs text-gray-400 ml-2">Campaña: {order.campaign}</span>}
                                </div>
                                <button onClick={() => onDelete(order.id)} className="text-gray-300 hover:text-red-500"><X size={16}/></button>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 font-medium mb-2">{order.product} <span className="text-gray-400">x{order.quantity}</span></p>
                            {order.code && <p className="text-xs text-gray-400 mb-3">Código: {order.code}</p>}
                            
                            <button onClick={() => onMarkDone(order)} className="w-full py-2 border-2 border-purple-100 dark:border-purple-900 text-purple-600 dark:text-purple-400 font-bold rounded-lg text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20">
                                Marcar como Entregado
                            </button>
                        </div>
                     );
                })}
            </div>
        </div>
    );
};

export default OrdersView;
