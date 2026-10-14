 **Web App Progresiva (PWA) completa de gestión empresarial** (ERP simplificado).

Aquí tienes el contexto detallado de tu proyecto **"Cuentas Claras"**:

-----

### 1\. El Objetivo del Proyecto

Crear una herramienta digital hecha a la medida para tu madre, diseñada para reemplazar el cuaderno de cuentas. Su objetivo es gestionar la venta de productos físicos (Arequipes, Velas, Brownies) y ventas por catálogo (Natura, Avon, Novaventa), controlando el dinero, los fiados (créditos), el inventario y los encargos.

-----

### 2\. Arquitectura Técnica (El "Motor")

Actualmente, tu proyecto funciona con tecnologías modernas y profesionales:

  * **Frontend (Lo que se ve):** React + Vite. Es rápido y ligero.
  * **Estilos:** Tailwind CSS. Nos permite esos diseños limpios, tarjetas redondeadas y el modo oscuro.
  * **Base de Datos (Memoria):** **Firebase Firestore (Google)**.
      * *Antes:* Guardábamos en el navegador del celular (`localStorage`). Si se borraba el caché, se perdía todo.
      * *Ahora:* Los datos viven en la nube. Tu madre puede entrar desde cualquier celular o PC y ver sus cuentas actualizadas en tiempo real.
  * **Reportes (Backup):** Google Sheets.
      * Cada venta o abono envía una señal a un **Google Apps Script** que inserta una fila en tu Excel personal para que tú puedas hacer análisis de datos profundos más tarde.
  * **Hosting (Alojamiento):** Firebase Hosting. La página vive en servidores de Google (`.web.app`), segura y rápida.

-----

### 3\. Funcionalidades Implementadas (Módulo por Módulo)

Todo el código está centralizado actualmente en `src/App.jsx` para facilitar la edición rápida, pero está dividido lógicamente en estas secciones:

#### A. 🏠 Inicio (Dashboard)

  * **Tarjetas Financieras:** Muestra en grande cuánto dinero entró hoy (Caja) y cuánto hay en la calle (Por cobrar).
  * **Cobros Próxima Quincena (NUEVO):** Un radar inteligente que detecta la fecha de hoy y le dice a tu madre: *"Oye, el 30 de noviembre Fulanito te debe pagar X plata"*.
  * **Arqueo de Caja ("¿Dónde está la plata?"):** Desglosa el dinero recibido por método (Efectivo, Nequi, Bancolombia, etc.) con listas desplegables.
  * **Resumen por Categoría:** Carrusel que muestra cuánto ha vendido de Natura vs. Arequipes.

#### B. ➕ Nueva Venta (El Núcleo)

  * **Buscador de Clientes:** Escribe "Be" y sale "Betty". Si no existe, permite crearlo ahí mismo.
  * **Integración con Inventario:**
      * Busca productos por nombre.
      * Rellena el precio automáticamente.
      * **Control de Stock:** Si intenta vender más de lo que hay, le sale una alerta roja rebotando.
  * **Cálculos Automáticos:** `Cantidad * Precio Unitario = Total`.
  * **Gestión de Fiados:**
      * Si pagan $0 o menos del total, el sistema marca "FIADO" o "ABONO".
      * Pregunta automáticamente: **"¿A cuántas quincenas?"** y calcula las fechas de pago (15 y 30) automáticamente.

#### C. 📦 Encargos (Pedidos de Revista)

  * Especial para Avon/Natura.
  * Campos especiales: **Código de revista** y **Campaña**.
  * Estados: "Pendiente" y "Entregado" (con check visual verde).
  * Botón para borrar encargos con confirmación de seguridad.

#### D. 🏪 Inventario (Gestión de Stock)

  * Reemplazó a la sección simple de clientes.
  * Permite Crear/Editar/Borrar productos.
  * Inputs optimizados para ver Costo vs. Venta y calcular ganancia.
  * **Visualización:** Barras de progreso que muestran cuánto queda. Si llega a 0, muestra una etiqueta **"¡AGOTADO\!"**.

#### E. ⚙️ Administración

  * Gestión de categorías (crear nuevas líneas de negocio).
  * **Calculadora de Rentabilidad:** Una herramienta donde ella pone "Invertí $50.000 en 10 productos + $5.000 de envío" y el sistema le dice a cuánto debe vender cada uno y cuánto gana.

-----

### 4\. Estructura de Archivos en tu PC

Tu proyecto local en la carpeta `CuentasClaras` se ve así:

```text
CuentasClaras/
├── dist/                   # Carpeta generada para subir a internet (npm run build)
├── node_modules/           # Librerías (React, Firebase, etc.)
├── public/                 # Iconos y favicon
├── src/
│   ├── App.jsx             # EL CEREBRO: Aquí está toda la lógica (Versión 13.0)
│   ├── index.css           # Estilos base de Tailwind
│   └── main.jsx            # Punto de entrada
├── firebase.json           # Configuración del hosting
├── index.html              # La página web base (Título "Cuentas Claras")
├── package.json            # Lista de dependencias
├── tailwind.config.js      # Configuración de diseño
└── vite.config.js          # Configuración del compilador
```

-----

### 5\. Flujo de Trabajo Actual

Ahora, cada vez que quieras hacer una mejora, este es tu ciclo:

1.  **Editar:** Modificas `App.jsx` en VS Code.
2.  **Probar:** Usas `npm run dev` para ver los cambios en tu PC (`localhost`).
3.  **Publicar:**
      * `npm run build` (Empaqueta todo).
      * `firebase deploy` (Sube los cambios a la web de tu madre).

Estamos en un punto muy sólido. Tenemos una aplicación **Full Stack** (Frontend + Backend + Base de Datos) funcionando de manera gratuita y escalable.