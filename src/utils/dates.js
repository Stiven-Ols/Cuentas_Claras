export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Si es una fecha simple YYYY-MM-DD, agregamos T00:00:00 para evitar problemas de timezone
  // Pero si ya tiene T (ISO), la usamos tal cual
  const dateToUse = dateString.includes('T') ? date : new Date(dateString + 'T00:00:00');
  
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateToUse);
};

export const formatDateShort = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const dateToUse = dateString.includes('T') ? date : new Date(dateString + 'T00:00:00');
  
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(dateToUse);
};

export const calculatePaymentDates = (startDateStr, installmentsCount) => {
  if (!startDateStr || installmentsCount <= 0) return [];
  
  const dates = [];
  // Fix: Check if it's already ISO or just YYYY-MM-DD
  let currentDate = startDateStr.includes('T') ? new Date(startDateStr) : new Date(startDateStr + 'T00:00:00');
  
  // Si la fecha es > 15, la primera quincena es el 30 (o fin de mes)
  // Si la fecha es <= 15, la primera quincena es el 15
  
  // Lógica simplificada: encontrar la SIGUIENTE quincena (15 o 30)
  let day = currentDate.getDate();
  let month = currentDate.getMonth();
  let year = currentDate.getFullYear();
  
  for (let i = 0; i < installmentsCount; i++) {
    if (day < 15) {
      // Próximo pago: 15 del mismo mes
      day = 15;
    } else {
      // Próximo pago: Fin de mes (aprox 30) o saltar al 15 del otro mes
      // Si hoy es 15, el próximo es fin de mes
      // Si hoy es 20, el próximo es fin de mes
      // Si hoy es 30, el próximo es 15 del otro mes
      
      if (day >= 15 && day < 28) {
         // Fin de mes
         day = new Date(year, month + 1, 0).getDate();
      } else {
         // 15 del siguiente mes
         month++;
         if (month > 11) {
           month = 0;
           year++;
         }
         day = 15;
      }
    }
    
    // Ajustar fecha
    const dateObj = new Date(year, month, day);
    dates.push(dateObj.toISOString().split('T')[0]);
    
    // Avanzar para la siguiente iteración (simular que estamos en esa fecha de pago)
    // Truco: sumar 1 día para romper el ciclo del mismo día
    // Pero mejor: forzar la lógica de alternancia
    // Si pagó el 15, el siguiente es fin de mes. Si pagó fin de mes, siguiente es 15.
    if (day === 15) {
       day = new Date(year, month + 1, 0).getDate(); // Fin de mes actual
    } else {
       day = 15;
       month++;
       if (month > 11) {
         month = 0;
         year++;
       }
    }
  }
  
  return dates;
};

export const getUpcomingQuincenaDate = () => {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth();
  const year = today.getFullYear();
  
  if (day <= 15) {
    return new Date(year, month, 15);
  } else {
    return new Date(year, month + 1, 0); // Fin de mes
  }
};
