# 💰 CuentasClaras - Sistema de Gestión de Ventas

Sistema completo de gestión de ventas, inventario y cuentas por cobrar. Diseñado para negocios pequeños con ventas a crédito (fiado) y pagos por cuotas.

## 🚀 Características

### 📊 Gestión de Ventas
- Registro de ventas al contado y a crédito
- Sistema de abonos y cuotas
- Historial de pagos por método (efectivo, Nequi, DaviPlata, etc.)
- Cálculo automático de fechas de pago por quincenas
- Categorización de productos (Avon, Natura, Novaventa, etc.)

### 👥 Gestión de Clientes
- Lista de clientes
- Seguimiento de cuentas por cobrar por cliente
- Recordatorio de cobros próximos por quincena

### 📦 Inventario
- Control de stock en tiempo real
- Descuento automático de inventario al vender
- Calculadora de inversión y ganancias
- Gestión por categorías

### 📋 Encargos
- Sistema de pedidos pendientes
- Seguimiento de estado (Pendiente/Hecho)
- Información de campaña y código

### 🛡️ Seguridad y Backup

#### ✅ Sistema de Backup Automático
- **Backup automático cada 30 minutos**
- Respaldo local en localStorage
- Descarga manual de archivos JSON
- Recuperación automática en caso de fallas

#### 🔄 Modo Offline
- Funcionamiento sin conexión a internet
- Sincronización automática al reconectar
- Persistencia local de todos los datos

#### 🚨 Diagnóstico y Recuperación
- Panel de diagnóstico en Admin
- Detección automática de errores de Firebase
- Herramientas de recuperación de datos
- Indicadores visuales de estado de conexión

## 🏗️ Tecnologías

- **React** 19.2.0 - Framework UI
- **Vite** 7.2.4 - Build tool
- **Firebase Firestore** - Base de datos en tiempo real
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconos
- **Google Sheets API** - Respaldo en hojas de cálculo

## 📱 Instalación

```bash
# Clonar repositorio
git clone [url-del-repo]

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```

## 🔧 Configuración de Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilita Firestore Database
3. Actualiza las credenciales en `src/firebase.js`
4. **Configura las reglas de seguridad** (ver `firestore.rules`)

### ⚠️ IMPORTANTE: Reglas de Firestore

Las reglas de Firebase deben configurarse para permitir acceso:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Ver archivo `firestore.rules` para más detalles.

## 🚨 Recuperación de Datos

Si no aparecen tus ventas o datos guardados:

1. **Lee primero:** `SOLUCION_RAPIDA.md` - Solución en 5 minutos
2. **Guía completa:** `RECUPERACION_DE_DATOS.md` - Instrucciones detalladas
3. **Usa el diagnóstico:** Admin → "🚨 Diagnóstico y Recuperación de Datos"

### Causa Común de Problemas
Las reglas de Firebase en modo test expiran después de 30 días. Tus datos NO se pierden, solo están bloqueados. La solución es actualizar las reglas en Firebase Console.

## 📁 Estructura del Proyecto

```
src/
├── App.jsx                 # Componente principal
├── firebase.js             # Configuración de Firebase
├── components/             # Componentes reutilizables
│   ├── CategoryTag.jsx
│   ├── MoneyInput.jsx
│   ├── NavBtn.jsx
│   ├── PaymentMethodSelector.jsx
│   ├── SaleDetailModal.jsx
│   └── StatCard.jsx
├── views/                  # Vistas principales
│   ├── HomeView.jsx        # Dashboard principal
│   ├── NewSaleView.jsx     # Registro de ventas
│   ├── OrdersView.jsx      # Gestión de encargos
│   ├── InventoryView.jsx   # Control de inventario
│   └── AdminView.jsx       # Administración y diagnóstico
├── utils/                  # Utilidades
│   ├── api.js              # Google Sheets integration
│   ├── backup.js           # Sistema de backup automático
│   ├── diagnostics.js      # Herramientas de diagnóstico
│   ├── colors.js           # Paleta de colores
│   ├── dates.js            # Manejo de fechas
│   └── formatters.js       # Formateadores de texto
└── constants/
    └── index.js            # Constantes globales
```

## 🔥 Colecciones de Firestore

- **ventas**: Registro de todas las ventas
- **clientes**: Lista de clientes
- **inventario**: Productos disponibles
- **encargos**: Pedidos pendientes
- **categorias**: Categorías de productos

## 💾 Sistema de Backup

### Automático
- Se ejecuta cada 30 minutos
- Guarda en localStorage del navegador
- No requiere intervención del usuario

### Manual
1. Ve a **Admin**
2. Sección "🚨 Diagnóstico y Recuperación"
3. Haz clic en "Descargar Backup"
4. Guarda el archivo JSON en un lugar seguro

**Recomendación:** Descarga backups semanalmente.

## 🎨 Características de UI/UX

- ✅ Dark mode
- ✅ Diseño responsive (móvil first)
- ✅ Animaciones suaves
- ✅ Gestos táctiles (swipe para eliminar)
- ✅ Modo offline
- ✅ Indicadores de estado de conexión
- ✅ Notificaciones visuales

## 🔐 Seguridad

- Datos almacenados en Firebase Firestore
- Backup local encriptado en localStorage
- Sincronización en tiempo real
- Detección automática de errores
- Sistema de recuperación robusto

## 📞 Soporte

### Problemas Comunes

**No aparecen las ventas:**
- Ejecuta el diagnóstico en Admin
- Verifica las reglas de Firebase
- Lee `SOLUCION_RAPIDA.md`

**Error "permission-denied":**
- Las reglas de Firebase expiraron
- Sigue las instrucciones en `RECUPERACION_DE_DATOS.md`

**Perdí mis datos:**
- Tus datos NO se pierden si están en Firebase
- Verifica en Firebase Console
- Usa el sistema de backup para recuperar

## 🚀 Deployment

### Firebase Hosting

```bash
# Compilar
npm run build

# Desplegar
firebase deploy --only hosting
```

La app está configurada para desplegarse en Firebase Hosting (ver `firebase.json`).

## 📝 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Compilar para producción
npm run preview  # Vista previa de producción
npm run lint     # Verificar código
```

## 🤝 Contribuir

Este es un proyecto personal, pero sugerencias son bienvenidas.

## 📄 Licencia

Uso personal.

## 🎉 Mejoras Recientes

### v1.1.0 (Diciembre 2024)
- ✅ Sistema de backup automático
- ✅ Panel de diagnóstico
- ✅ Manejo robusto de errores
- ✅ Modo offline mejorado
- ✅ Indicadores visuales de conexión
- ✅ Persistencia local mejorada
- ✅ Herramientas de recuperación de datos

---

**Desarrollado con ❤️ para gestionar tu negocio**

*Última actualización: Diciembre 2024*
