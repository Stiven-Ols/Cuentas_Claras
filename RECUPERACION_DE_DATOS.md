# 🚨 GUÍA DE RECUPERACIÓN DE DATOS - CuentasClaras

## ¿Qué pasó?

Lo más probable es que las **reglas de seguridad de Firebase Firestore** hayan expirado. Firebase en modo de prueba solo permite acceso durante 30 días. Después de eso, bloquea todas las lecturas y escrituras.

**¡IMPORTANTE!** ✅ **Tus datos NO se han perdido**. Están seguros en Firebase, solo están bloqueados.

---

## 📋 PASOS PARA RECUPERAR TUS DATOS

### Paso 1: Verificar el Problema

1. Abre la aplicación CuentasClaras
2. Ve a la sección **Admin** (ícono de configuración)
3. Busca la sección **"🚨 Diagnóstico y Recuperación de Datos"**
4. Haz clic en **"Ejecutar Diagnóstico"**

Si ves el error `permission-denied`, confirma que el problema son las reglas de Firebase.

---

### Paso 2: Acceder a Firebase Console

1. Ve a: [https://console.firebase.google.com](https://console.firebase.google.com)
2. Inicia sesión con tu cuenta de Google
3. Selecciona el proyecto: **"cuentas-claras-4bba4"**

---

### Paso 3: Verificar que tus Datos Existen

1. En el menú lateral, haz clic en **"Firestore Database"**
2. Deberías ver tus colecciones:
   - `ventas` (aquí están todas tus ventas 💰)
   - `clientes`
   - `inventario`
   - `encargos`
   - `categorias`

3. **Haz clic en la colección "ventas"** para verificar que tus datos están ahí
4. Si ves documentos con fechas, clientes y montos: **¡Tus datos están seguros!** ✅

---

### Paso 4: ARREGLAR LAS REGLAS DE SEGURIDAD (PERMANENTE)

#### Opción A: Reglas Básicas (Recomendado para empezar)

1. En Firebase Console → **Firestore Database**
2. Haz clic en la pestaña **"Rules"** (Reglas)
3. **BORRA** todo el contenido actual
4. **COPIA Y PEGA** estas reglas:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acceso total (SOLO para desarrollo/uso personal)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Haz clic en **"Publish"** (Publicar)
6. **¡IMPORTANTE!** Estas reglas permiten acceso completo. Están bien si solo TÚ usas la app.

#### Opción B: Reglas con Autenticación (Más Seguro)

Si quieres más seguridad en el futuro, usa estas reglas (requiere que agregues autenticación):

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acceso solo si estás autenticado
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Nota:** Para usar esta opción, necesitarías agregar Firebase Authentication a tu app.

---

### Paso 5: Verificar que Funciona

1. Guarda las reglas nuevas en Firebase Console
2. Vuelve a tu aplicación CuentasClaras
3. **Recarga la página** (F5 o Cmd+R)
4. Tus ventas deberían aparecer automáticamente ✨

---

## 💾 SISTEMA DE BACKUP IMPLEMENTADO

He agregado un sistema automático de backup para prevenir este problema en el futuro:

### Características:

1. **Backup Automático cada 30 minutos**: La app ahora guarda automáticamente todos tus datos localmente
2. **Backup Manual**: Puedes crear backups manualmente desde Admin → "Crear Backup"
3. **Descargar Backup**: Descarga un archivo JSON con todos tus datos
4. **Modo Offline**: Si Firebase falla, la app carga datos desde localStorage

### Cómo usar el Backup:

#### Descargar tus datos:
1. Ve a **Admin**
2. En la sección de Diagnóstico, haz clic en **"Descargar Backup"**
3. Se descargará un archivo `cuentasclaras_backup_[fecha].json`
4. **Guárdalo en un lugar seguro** (Google Drive, USB, etc.)

---

## 🔧 MEJORAS IMPLEMENTADAS

### 1. Manejo de Errores Mejorado
- La app ahora detecta automáticamente errores de Firebase
- Muestra un banner rojo cuando hay problemas de conexión
- Carga datos desde localStorage como respaldo

### 2. Persistencia Local
- Todos los datos se guardan automáticamente en localStorage
- Si Firebase falla, puedes seguir viendo tus datos

### 3. Herramientas de Diagnóstico
- Panel de diagnóstico en Admin
- Información detallada sobre el estado de cada colección
- Verificación de backups locales

### 4. Backup Automático
- Backup cada 30 minutos
- Descarga manual de backups
- Historial de backups en localStorage

---

## 📱 INDICADORES VISUALES

La app ahora muestra:

- 🔴 **Banner Rojo**: Error de conexión con Firebase (reglas bloqueadas)
- 🟠 **Banner Naranja**: Sin conexión a internet (modo offline)
- ✅ **Verde**: Todo funciona correctamente

---

## 🆘 SI AÚN NO APARECEN TUS DATOS

### Opción 1: Verificar localStorage
Tus datos podrían estar en el navegador:

1. Abre la aplicación
2. Presiona **F12** (o Cmd+Option+I en Mac)
3. Ve a la pestaña **"Application"** → **"Local Storage"**
4. Busca:
   - `sales` → Tus ventas
   - `customers` → Clientes
   - `inventory` → Inventario
   - `cuentasclaras_backup` → Backup completo

### Opción 2: Exportar desde Firebase
1. En Firebase Console → Firestore Database
2. Haz clic en los **tres puntos** (...) en la colección "ventas"
3. Exporta los datos manualmente

### Opción 3: Restaurar desde Google Sheets
Si configuraste la integración con Google Sheets, tus datos deberían estar allí también.

---

## 🛡️ PREVENCIÓN FUTURA

Para evitar que esto vuelva a pasar:

### 1. Descarga backups regularmente
- Al menos una vez por semana
- Antes de hacer cambios importantes

### 2. Verifica las reglas de Firebase
- Las reglas que pusimos no expiran
- Pero verifica cada mes que sigan activas

### 3. Usa el diagnóstico periódicamente
- Una vez al mes, ejecuta el diagnóstico desde Admin
- Verifica que todo esté OK

### 4. Mantén múltiples copias
- Backup local (automático)
- Backup descargado (manual, semanal)
- Google Sheets (si está configurado)
- Firebase (siempre activo)

---

## 📞 INFORMACIÓN TÉCNICA

**Proyecto Firebase:** cuentas-claras-4bba4
**Project ID:** cuentas-claras-4bba4

### Colecciones en Firestore:
- `ventas` - Todas las ventas registradas
- `clientes` - Lista de clientes
- `inventario` - Productos en inventario
- `encargos` - Pedidos pendientes
- `categorias` - Categorías de productos

---

## ✅ CHECKLIST DE RECUPERACIÓN

- [ ] Ejecutar diagnóstico en la app
- [ ] Acceder a Firebase Console
- [ ] Verificar que los datos existen en Firestore
- [ ] Actualizar las reglas de seguridad
- [ ] Publicar las nuevas reglas
- [ ] Recargar la aplicación
- [ ] Verificar que las ventas aparecen
- [ ] Descargar un backup de seguridad
- [ ] Guardar el backup en un lugar seguro

---

## 🎉 UNA VEZ RECUPERADO

1. **Descarga un backup inmediatamente**
2. **Guárdalo en múltiples lugares** (Google Drive, USB, email)
3. **Configura recordatorios** para descargar backups semanalmente
4. **Las reglas nuevas no expiran**, pero verifica mensualmente

---

**¿Necesitas ayuda adicional?** 

Revisa la consola del navegador (F12) para ver errores específicos y compártelos si necesitas más asistencia.



