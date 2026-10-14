import React, { useState } from 'react';
import { X, Plus, Search, Calendar } from 'lucide-react';
import MoneyInput from '../components/MoneyInput';
import PaymentMethodSelector from '../components/PaymentMethodSelector';

// Helper function for currency formatting (assuming it's available or needs to be defined)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
};

const NewSaleView = ({ categories, customers, inventory, onSave, onAddCustomer }) => {
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    category: categories[0]?.name || '',
    description: '',
    price: '',
    quantity: 1,
    productId: null
  });
  
  const [saleData, setSaleData] = useState({
    customerId: null,
    paidAmount: '',
    paymentMethod: 'efectivo',
    installments: ''
  });

  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [prodSearch, setProdSearch] = useState('');
  const [isProdSearching, setIsProdSearching] = useState(false);

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const selectedCustomer = customers.find(c => c.id === saleData.customerId);

  // Filter products based on currentItem's category and prodSearch
  const filteredProducts = inventory.filter(p => 
      p.category === currentItem.category && p.name.toLowerCase().includes(prodSearch.toLowerCase())
  );

  // Calculate totals
  const currentItemTotal = (parseInt(currentItem.price || 0) * parseInt(currentItem.quantity || 1));
  const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const grandTotal = itemsTotal + (currentItem.description && currentItem.price ? currentItemTotal : 0);
  
  const debt = grandTotal - (parseInt(saleData.paidAmount || 0));
  const isFiado = grandTotal > 0 && (saleData.paidAmount === '' ? false : debt > 0);

  const handleAddItem = () => {
    if (!currentItem.description || !currentItem.price || currentItem.quantity <= 0) return;
    setItems([...items, { ...currentItem, total: currentItemTotal }]);
    setCurrentItem({
        category: categories[0]?.name || '',
        description: '',
        price: '',
        quantity: 1,
        productId: null
    });
    setProdSearch('');
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSave = () => {
    if (!saleData.customerId) return;
    
    // If there is a current item filled out, add it to the list effectively
    let finalItems = [...items];
    if (currentItem.description && currentItem.price && currentItem.quantity > 0) {
        finalItems.push({ ...currentItem, total: currentItemTotal });
    }

    if (finalItems.length === 0) return;

    const totalSalePrice = finalItems.reduce((sum, i) => sum + i.total, 0);

    // Construct the sale object expected by App.jsx
    // We will concatenate descriptions for the main record, but App.jsx might need update to handle inventory deduction for multiple items
    onSave({
        customerId: saleData.customerId,
        items: finalItems,
        price: totalSalePrice,
        paidAmount: saleData.paidAmount,
        paymentMethod: saleData.paymentMethod,
        installments: saleData.installments,
        // Legacy fields for backward compatibility if needed (will be derived in App.jsx)
        category: finalItems[0].category, 
        description: finalItems.map(i => `${i.quantity}x ${i.description}`).join(', '),
        quantity: finalItems.reduce((sum, i) => sum + parseInt(i.quantity), 0)
    });
    // Reset form after saving
    setItems([]);
    setCurrentItem({
        category: categories[0]?.name || '',
        description: '',
        price: '',
        quantity: 1,
        productId: null
    });
    setSaleData({
        customerId: null,
        paidAmount: '',
        paymentMethod: 'efectivo',
        installments: ''
    });
    setSearch('');
    setProdSearch('');
  };

  const selectProduct = (prod) => {
      setCurrentItem({
          ...currentItem,
          description: prod.name,
          price: prod.price, // This should be unit price
          category: prod.category,
          productId: prod.id
      });
      setProdSearch(prod.name);
      setIsProdSearching(false);
  };

  return (
    <div className="pb-24 animate-in zoom-in-95 duration-300">
      <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-6">Nueva Venta</h2>

      {/* SELECCIÓN DE CLIENTE */}
      <div className="mb-6 relative">
        <label className="block text-gray-600 dark:text-gray-300 text-xs font-bold mb-2 ml-1 uppercase">Cliente</label>
        {selectedCustomer ? (
            <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                <span className="font-black text-xl text-blue-800 dark:text-blue-200">{selectedCustomer.name}</span>
                <button onClick={() => setSaleData({...saleData, customerId: null})} className="p-2 bg-white dark:bg-gray-800 rounded-full text-gray-500 shadow-sm"><X size={20}/></button>
            </div>
        ) : (
            <div className="relative">
                <Search className="absolute left-4 top-4 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar cliente..." 
                    className="w-full p-4 pl-12 rounded-2xl border-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white font-bold text-lg shadow-sm focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setIsSearching(true); }}
                    onFocus={() => setIsSearching(true)}
                />
                {isSearching && (search || filteredCustomers.length > 0) && (
                    <div className="absolute z-20 w-full bg-white dark:bg-gray-800 shadow-2xl rounded-2xl mt-2 border dark:border-gray-700 max-h-60 overflow-y-auto">
                        {filteredCustomers.map(c => (
                            <button key={c.id} onClick={() => { setSaleData({...saleData, customerId: c.id}); setSearch(''); setIsSearching(false); }} className="w-full text-left p-4 border-b dark:border-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">
                                {c.name}
                            </button>
                        ))}
                        {search && (
                            <button onClick={async () => { 
                                const newId = await onAddCustomer(search); 
                                setSaleData(prev => ({...prev, customerId: newId})); 
                                setSearch(''); 
                                setIsSearching(false); 
                            }} className="w-full text-left p-4 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20">
                                + Crear nuevo cliente "{search}"
                            </button>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>

      {/* LISTA DE PRODUCTOS AGREGADOS */}
      {items.length > 0 && (
          <div className="mb-6 space-y-2">
              <label className="block text-gray-600 dark:text-gray-300 text-xs font-bold ml-1 uppercase">Carrito</label>
              {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div>
                          <p className="font-bold text-gray-800 dark:text-white">{item.description}</p>
                          <p className="text-xs text-gray-500">{item.quantity} x {formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(item.total)}</span>
                          <button onClick={() => handleRemoveItem(idx)} className="text-red-500 p-1"><X size={16}/></button>
                      </div>
                  </div>
              ))}
              <div className="text-right font-black text-lg text-gray-800 dark:text-white pt-2 border-t dark:border-gray-700">
                  Total: {formatCurrency(itemsTotal)}
              </div>
          </div>
      )}

      {/* FORMULARIO DE PRODUCTO ACTUAL */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500"></div>
        <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                {items.length + 1}
            </span>
            Agregar Producto
        </h3>
        
        <div className="space-y-4">
          <div className="relative z-10">
             <label className="block text-gray-500 dark:text-gray-400 text-[10px] font-bold mb-1 uppercase">Categoría</label>
             <select
                value={currentItem.category}
                onChange={e => setCurrentItem({...currentItem, category: e.target.value, productId: null, description: '', price: ''})}
                className="w-full p-3 rounded-xl border-2 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white font-bold outline-none focus:border-blue-500 transition-colors"
             >
                {categories.map(cat => {
                    const catName = cat.name || cat;
                    return <option key={cat.id || catName} value={catName}>{catName}</option>
                })}
             </select>
          </div>

          <div className="relative">
            <label className="block text-gray-500 dark:text-gray-400 text-[10px] font-bold mb-1 uppercase">Producto</label>
            <div className="relative">
                <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Buscar o escribir..." 
                    className="w-full p-3 pl-9 rounded-xl border-2 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white font-bold outline-none focus:border-blue-500 transition-colors"
                    value={prodSearch}
                    onChange={e => { 
                        setProdSearch(e.target.value); 
                        setCurrentItem({...currentItem, description: e.target.value, productId: null}); 
                        setIsProdSearching(true); 
                    }}
                    onFocus={() => setIsProdSearching(true)}
                    onBlur={() => setTimeout(() => setIsProdSearching(false), 100)} // Delay to allow click on results
                />
            </div>
            {isProdSearching && prodSearch && (
                <div className="absolute z-20 w-full bg-white dark:bg-gray-800 shadow-xl rounded-xl mt-1 border dark:border-gray-700 max-h-40 overflow-y-auto">
                    {filteredProducts.map(p => (
                        <button key={p.id} onClick={() => selectProduct(p)} className="w-full text-left p-3 border-b dark:border-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center group">
                            <span className="font-medium group-hover:text-blue-600 transition-colors">{p.name}</span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500 dark:text-gray-300">{formatCurrency(p.price)}</span>
                        </button>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="p-3 text-xs text-gray-400 italic">No encontrado en inventario. Se usará como texto libre.</div>
                    )}
                </div>
            )}
          </div>

          <div className="flex gap-3">
             <div className="w-1/3">
                <label className="block text-gray-500 dark:text-gray-400 text-[10px] font-bold mb-1 uppercase">Cant.</label>
                <input 
                    type="number" 
                    inputMode="numeric"
                    value={currentItem.quantity}
                    onChange={e => setCurrentItem({...currentItem, quantity: e.target.value})}
                    className="w-full p-3 text-center rounded-xl border-2 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white font-bold text-lg outline-none focus:border-blue-500"
                />
             </div>
             <div className="w-2/3">
                <MoneyInput
                   label="Precio Unitario"
                   value={currentItem.price}
                   onChange={v => setCurrentItem({...currentItem, price: v})}
                   containerClass=""
                />
             </div>
          </div>

          <button 
            onClick={handleAddItem}
            disabled={!currentItem.description || !currentItem.price || currentItem.quantity <= 0}
            className="w-full py-3 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            Agregar otro producto
          </button>
        </div>
      </div>

      {/* TOTALES Y PAGO */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 mb-24">
         <div className="flex justify-between items-end mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
             <div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total a Pagar</p>
                 <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(grandTotal)}</h3>
             </div>
             {isFiado && (
                 <div className="text-right">
                     <p className="text-xs text-red-500 font-bold uppercase">Queda debiendo</p>
                     <p className="text-xl font-black text-red-600">{formatCurrency(debt)}</p>
                 </div>
             )}
         </div>

         <MoneyInput
           label="¿Cuánto pagó hoy?"
           placeholder="Dejar vacío si es todo fiado"
           value={saleData.paidAmount}
           onChange={v => setSaleData({...saleData, paidAmount: v})}
           containerClass="mb-6"
           textClass="text-2xl"
         />

         <PaymentMethodSelector selected={saleData.paymentMethod} onSelect={id => setSaleData({...saleData, paymentMethod: id})} />

         {isFiado && (
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800 animate-in fade-in">
                <label className="block text-orange-800 dark:text-orange-200 text-xs font-bold mb-2 uppercase flex items-center gap-2">
                    <Calendar size={14}/> Plan de Pagos (Quincenas)
                </label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 6, 8].map(n => (
                        <button
                            key={n}
                            onClick={() => setSaleData({...saleData, installments: n})}
                            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                                saleData.installments === n 
                                ? 'bg-orange-500 text-white shadow-md scale-105' 
                                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-orange-200 dark:border-orange-800'
                            }`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </div>
         )}
      </div>

      {/* BOTÓN GUARDAR (EN FLUJO) */}
      <div className="mt-6 mb-12">
          <button 
            onClick={handleSave}
            disabled={!saleData.customerId || (!currentItem.description && items.length === 0)}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none transform transition-all active:scale-95 flex justify-center items-center gap-2"
          >
            <Plus size={24} />
            Guardar Venta
          </button>
      </div>
    </div>
  );
};

export default NewSaleView;
