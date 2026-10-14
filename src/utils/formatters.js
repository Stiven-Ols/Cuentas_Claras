export const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const getPaymentMethodInfo = (id, paymentMethods) => {
  return paymentMethods.find(m => m.id === id) || paymentMethods[0];
};
