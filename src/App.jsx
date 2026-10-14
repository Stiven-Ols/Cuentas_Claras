import React, { useState, useEffect } from 'react';
import { 
  Plus, Home, Package, Settings, Store, AlertTriangle, Users
} from 'lucide-react';
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from './firebase';
import { sendToGoogleSheets } from './utils/api';
import { calculatePaymentDates } from './utils/dates';

// Components
import NavBtn from './components/NavBtn';
import SaleDetailModal from './components/SaleDetailModal';
import Sidebar from './components/Sidebar';
import DesktopLayout from './components/DesktopLayout';

// Views
import HomeView from './views/HomeView';
import NewSaleView from './views/NewSaleView';
import DebtorsView from './views/DebtorsView';
import OrdersView from './views/OrdersView';
import InventoryView from './views/InventoryView';
import AdminView from './views/AdminView';

// Hooks
import { useBreakpoint } from './hooks/useBreakpoint';

export default function App() {
  const { isDesktop } = useBreakpoint();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [view, setView] = useState('home');

  const [customers, setCustomers] = useState(() => JSON.parse(localStorage.getItem('customers')) || [
    { id: 1, name: 'Betty' }, { id: 2, name: 'Tito' }, { id: 3, name: 'La Vecina' }
  ]);
  
  const [categories, setCategories] = useState([]);

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
      if (customerData.length > 0) setCustomers(customerData);
    });

    // Escuchar Encargos
    const unsubOrders = onSnapshot(collection(db, "encargos"), (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setOrders(ordersData);
    });

    // Escuchar Categorías
    const unsubCategories = onSnapshot(collection(db, "categorias"), (snapshot) => {
      const catsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setCategories(catsData.sort((a, b) => a.name.localeCompare(b.name)));
    });

    return () => {
      unsubSales();
      unsubInventory();
      unsubCustomers();
      unsubOrders();
      unsubCategories();
    };
  }, []);
  


  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleAddCustomer = async (name) => {
    const existing = customers.find(c => c.name.toLowerCase().trim() === name.toLowerCase().trim());
    if (existing) return existing.id;

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
    if (data.items && data.items.length > 0) {
        for (const item of data.items) {
            if (item.productId) {
                const productRef = doc(db, "inventario", item.productId);
                const currentProduct = inventory.find(p => p.id === item.productId);
                if (currentProduct) {
                    const newQty = Math.max(0, currentProduct.qty - parseInt(item.quantity));
                    await updateDoc(productRef, { qty: newQty });
                }
            }
        }
    } else if (data.productId) {
        // Fallback for single item (should not happen with new view but good for safety)
        const productRef = doc(db, "inventario", data.productId);
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
    
    const docRef = await addDoc(collection(db, "ventas"), sale);

    let descriptionExtended = 'Venta';
    let productDescription = data.description || 'Varios';

    // Reconstruct description from items for robustness
    if (data.items && data.items.length > 0) {
        productDescription = data.items.map(i => `${i.quantity}x ${i.description}`).join(', ');
    }
    
    // Final safety check
    if (!productDescription || productDescription.trim() === '') {
        productDescription = 'Producto sin nombre';
    }

    if (sale.installments > 0) descriptionExtended = `${productDescription} (a ${sale.installments} quincenas)`;
    else descriptionExtended = productDescription;

    sendToGoogleSheets({
        id: docRef.id, 
        type: 'VENTA',
        customer: customers.find(c => c.id === data.customerId)?.name,
        category: data.category,
        description: descriptionExtended,
        product: productDescription || 'Producto sin nombre',
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
    
    // MATEMÁTICA CORREGIDA: El saldo restante es el Total Original - Lo Pagado Totalmente (Antes + Ahora)
    const realRemainingBalance = total - newPaid;

    const newStatus = newPaid >= total ? 'PAGADO' : 'ABONO';
    
    // Generamos el texto inteligente para la nota
    let abonoNote = "";
    if (newPaid >= total) {
        abonoNote = `Abonó $${amount.toLocaleString('es-CO')} y saldó la deuda`;
    } else {
        abonoNote = `Abono de $${amount.toLocaleString('es-CO')}. Restan $${realRemainingBalance.toLocaleString('es-CO')}`;
    }

    const newHistory = [...(selectedSale.history || []), { date: new Date().toISOString(), amount: amount, method: abonoMethod }];

    // 1. Actualizamos en Firebase (Base de datos real)
    const saleRef = doc(db, "ventas", selectedSale.id);
    await updateDoc(saleRef, { 
        paidAmount: newPaid,
        status: newStatus,
        history: newHistory
    });

    // 2. Enviamos el reporte corregido a Google Sheets
    sendToGoogleSheets({
        id: selectedSale.id,
        type: 'ABONO',
        customer: customers.find(c => c.id === selectedSale.customerId)?.name,
        category: selectedSale.category,
        description: `ABONO A (${selectedSale.product || 'Cuenta'})`,
        product: selectedSale.product,
        quantity: 0,
        unitPrice: 0,
        totalPrice: total, // Enviamos el total original para referencia
        paidAmount: amount, // Lo que entró en caja HOY
        paymentMethod: abonoMethod,
        status: 'ABONO',
        notes: abonoNote, // La nota explicativa corregida
        remainingBalance: realRemainingBalance // El número matemático correcto para la columna N
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

  const handleUpdateSaleTotal = async (saleId, newTotal) => {
      const saleRef = doc(db, "ventas", saleId);
      // We also need to check if status changes (e.g. if new total <= paid)
      // For simplicity, we just update total. Status update might be complex if paid > newTotal.
      // Let's assume user knows what they are doing.
      await updateDoc(saleRef, { totalPrice: newTotal });
  };

  const handleDeleteSale = async (saleId) => {
      await deleteDoc(doc(db, "ventas", saleId));
      // Optional: Restore inventory? For now, simple delete.
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

  const handleAddCategory = async (newCatName) => {
     // Evitar duplicados
     if (categories.some(c => c.name.toLowerCase() === newCatName.toLowerCase())) return;
     await addDoc(collection(db, "categorias"), { name: newCatName });
  };

  const handleDeleteCategory = async (catId) => {
      await deleteDoc(doc(db, "categorias", catId));
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
      {/* Desktop Sidebar */}
      {isDesktop && (
        <Sidebar 
          view={view} 
          setView={setView} 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
        />
      )}

      {/* Main Content */}
      <DesktopLayout 
        showFAB={view === 'home' && isDesktop}
        onFABClick={() => setView('new-sale')}
      >
        {view === 'home' && (
          <HomeView 
            sales={sales} 
            categories={categories} 
            customers={customers}
            darkMode={darkMode} 
            setDarkMode={setDarkMode}
            onSelectSale={(s) => { setSelectedSale(s); setModalTab('abono'); }}
            onUpdateSaleTotal={handleUpdateSaleTotal}
            onDeleteSale={handleDeleteSale}
          />
        )}
        
        {view === 'new-sale' && <NewSaleView categories={categories} customers={customers} inventory={inventory} onSave={handleSaveSale} onAddCustomer={handleAddCustomer} />}
        
        {view === 'debtors' && <DebtorsView sales={sales} customers={customers} />}
        
        {view === 'orders' && <OrdersView orders={orders} categories={categories} customers={customers} onSave={handleSaveOrder} onDelete={setOrderToDelete} onAddCustomer={handleAddCustomer} onMarkDone={handleMarkOrderDone} />}
        
        {view === 'inventory' && <InventoryView inventory={inventory} categories={categories} onAddProduct={handleAddProduct} onEditProduct={handleEditProduct} onDeleteProduct={handleDeleteProduct} />}
        
        {view === 'admin' && <AdminView categories={categories} onAddCategory={handleAddCategory} onDeleteCategory={handleDeleteCategory} onAddProduct={handleAddProduct} />}
      </DesktopLayout>

      {/* Sale Detail Modal */}
      <SaleDetailModal 
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
        modalTab={modalTab}
        setModalTab={setModalTab}
        abonoAmount={abonoAmount}
        setAbonoAmount={setAbonoAmount}
        abonoMethod={abonoMethod}
        setAbonoMethod={setAbonoMethod}
        onAddAbono={handleAddAbono}
        onUpdatePaymentPlan={handleUpdatePaymentPlan}
        onDateChange={handleDateChange}
        onInstallmentsChange={handleInstallmentsChange}
        onUpdateSaleTotal={handleUpdateSaleTotal}
        onDelete={handleDeleteSale}
      />

      {/* Delete Order Confirmation Modal */}
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

      {/* Mobile FAB - Floating Action Button (Bottom Right) */}
      <button 
        onClick={() => setView('new-sale')}
        className="lg:hidden fixed bottom-20 right-4 z-50 bg-blue-600 text-white p-4 rounded-full shadow-2xl shadow-blue-500/50 hover:scale-105 active:scale-95 transition-transform"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      {/* Mobile Bottom Navigation - Hidden on Desktop */}
      <div className="lg:hidden fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 pb-safe pt-2 px-2 flex justify-around items-center z-40 shadow-2xl">
        <NavBtn icon={Home} label="Inicio" active={view === 'home'} onClick={() => setView('home')} />
        <NavBtn icon={Users} label="Cartera" active={view === 'debtors'} onClick={() => setView('debtors')} />
        <NavBtn icon={Package} label="Pedidos" active={view === 'orders'} onClick={() => setView('orders')} />
        <NavBtn icon={Store} label="Stock" active={view === 'inventory'} onClick={() => setView('inventory')} />
        <NavBtn icon={Settings} label="Config" active={view === 'admin'} onClick={() => setView('admin')} />
      </div>
    </div>
  );
}