# 🚀 Novedades del CRM · 21 de abril 2026

Hola Ferran 👋 — estas son todas las mejoras que hemos aplicado hoy en tu CRM. Puedes probarlas directamente entrando en **https://crm-ofimaticbaix.vercel.app** o abriendo la APK.

---

## 🧹 1. Tus datos restaurados y limpios

### Clientes Activos
- Antes: solo veías **93-120** clientes.
- Ahora: **196 clientes activos** completos.
- Hemos recuperado los que se habían borrado por error en la limpieza anterior y puesto todos los datos correctos (dirección, teléfonos, emails, persona de contacto, forma de pago…).

### Clientes Potenciales
- Importados los **907 leads** del Excel que nos pasaste.
- Nombres limpios (sin anotaciones tipo "NO LES INTERESA" mezcladas).
- Auto-detectados los tags: leads marcados como "NO INTERESA" ya tienen su etiqueta correspondiente.

---

## 🏷️ 2. Nueva etiqueta: **"Descartado"**

Tanto en Clientes Activos como en Clientes Potenciales tienes ahora un estado extra llamado **Descartado** (gris). Ideal para marcar clientes que no son interesantes pero sin borrarlos.

---

## 👥 3. Más personas de contacto por cliente

En el modal de cada cliente se han añadido:
- **Persona Contacto 2**
- **Persona Contacto 3**
- **Móvil 2** (segundo teléfono móvil)

Cada campo tiene su **botón 🗑️** para eliminar a esa persona si deja la empresa.

---

## 💰 4. Forma de Pago como desplegable

Ya no es un campo de texto libre. Ahora es un menú con las opciones B2B habituales:

- Contado / Contado antes entregar
- Transferencia 30/60/90 días
- **Recibo 30/60/90 días**
- Recibo domiciliado
- Giro bancario · Confirming · Pagaré · Tarjeta
- Aplazado 60 días

### Nuevo campo: **"Día de Cobro"**
Al lado de la Forma de Pago, un campo numérico (1-31) para indicar el día del mes en que se realiza el cobro.

---

## 📅 5. Cobros del día

Al entrar en el dashboard, si hoy es día de cobro de algún cliente, aparece un **recuadro verde en grande**:

> 💰 **Cobros de hoy (día 21)** · 5 clientes
> MORENO DEL OLMO · TALLERES ROY · ACME... y 2 más

Click → te lleva directo a Activos filtrado por los que cobras hoy.

También dentro de Clientes Activos hay un **botón destacado** con el mismo filtro.

---

## 🔔 6. Notificaciones mejoradas

### Campana con badge
Arriba a la derecha sigue la campana 🔔. Ahora:
- **Badge rojo** con número → te avisa de **notificaciones nuevas** (tareas vencidas, a 1 hora, a 24 h).
- **Click en la campana** → marcas todo como leído → badge desaparece, campana deja de moverse.
- No vuelven a aparecer animación/badge hasta que llegue una **nueva** notificación.

### Dropdown con dos pestañas
Al abrir la campana ves:
1. **Pendientes** — tareas que necesitan atención ahora.
2. **Historial** — todas las notificaciones que han saltado recientemente, con su fecha.
   Botón "Borrar historial" al final.

### Limpieza automática
Si borras una tarea del calendario, **desaparece automáticamente** de:
- El banner rojo de arriba
- La campana
- Los toasts
- El historial

En máximo 1 minuto queda todo sincronizado.

---

## 📆 7. Bug del calendario de tareas arreglado

Antes: algunas tareas programadas con hora (tipo "Llamar a las 18:34") aparecían en notificaciones pero **no en el calendario de tareas**. Ya se ve todo correctamente, tanto tareas con fecha suelta como tareas con hora específica.

---

## 🎨 8. Favicon con tu logo

El icono de la pestaña del navegador ahora es **tu logo** (versión naranja). Igual que el icono de la APK.

---

## 📊 Resumen de lo que tienes disponible

| Sección | Contenido actual |
|---|---|
| Clientes Activos | **196** clientes |
| Clientes Potenciales | **907** leads |
| Contactos | 1 |
| Pipeline Oportunidades | Kanban con drag & drop |
| Tareas | Calendario + notificaciones |
| Personalización | Logo, subtítulo, imagen de fondo |

---

## ✅ Lo que puedes probar ahora

1. **Abrir un cliente** → verás los nuevos campos (contactos 2/3, móvil 2, día de cobro, forma de pago dropdown)
2. **Dashboard** → si hay cobros hoy (día 21), aparece el recuadro verde
3. **Campana** → click y desaparece el aviso, comprueba el Historial
4. **Tareas** → las que se borren ya no vuelven en notificaciones

---

¿Dudas o algo no funciona como esperas? Dímelo y lo revisamos.

— Alex
