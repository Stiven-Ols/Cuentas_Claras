import { GOOGLE_SCRIPT_URL } from '../constants';

// --- ENVÍO ROBUSTO A GOOGLE SHEETS ---
export const sendToGoogleSheets = async (data) => {
  try {
    const totalPrice = data.totalPrice || 0;
    const paidAmount = data.paidAmount || 0;
    
    // IMPORTANTE: Si viene remainingBalance pre-calculado (como en ABONOS), usarlo.
    // Si no, calcularlo (como en VENTAS nuevas)
    const remainingBalance = data.remainingBalance !== undefined 
      ? data.remainingBalance 
      : totalPrice - paidAmount;
    
    // Create visual status note
    let statusNote = '';
    if (data.installments && data.installments > 0) {
      statusNote = `A ${data.installments} quincenas`;
    }
    
    // Si ya viene una nota personalizada (como en ABONOS), usarla
    // Si no, generar el indicador de deuda automático
    let finalNotes = '';
    if (data.notes) {
      finalNotes = data.notes;
    } else {
      // Add debt status indicator (para ventas nuevas)
      let debtIndicator = '';
      if (remainingBalance <= 0) {
        debtIndicator = '[✅ PAGADO]';
      } else if (paidAmount === 0) {
        debtIndicator = `[🔴 FIADO (Debe: $${remainingBalance.toLocaleString('es-CO')})]`;
      } else {
        debtIndicator = `[🟡 ABONO (Debe: $${remainingBalance.toLocaleString('es-CO')})]`;
      }
      finalNotes = `${statusNote} ${debtIndicator}`.trim();
    }
    
    const payload = {
        id: data.id || Date.now(),
        type: data.type || 'VENTA', 
        customer: data.customer || 'Cliente General',
        category: data.category || 'Varios',
        product: data.product || data.description || 'Producto', 
        quantity: data.quantity || 1,
        unitPrice: data.unitPrice || 0, 
        totalPrice: totalPrice, 
        paidAmount: paidAmount, 
        paymentMethod: data.paymentMethod || 'efectivo',
        status: data.status || 'PENDIENTE',
        remainingBalance: remainingBalance,
        notes: finalNotes
    };

    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", 
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Ignore specific Chrome extension error that is harmless
    if (error.message && error.message.includes('message channel closed')) return;
    console.error("❌ Error enviando a Google Sheets", error);
  }
};
