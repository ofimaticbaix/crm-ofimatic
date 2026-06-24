# 🚀 Novedades del CRM · 26 de abril 2026

Hola Ferran 👋 — desde el último informe del 23 de abril hemos añadido bastantes cosas y arreglado algunos bugs. Te lo cuento todo aquí en orden.

Pruébalo en **https://crm-ofimaticbaix.vercel.app** o desde la APK. Recuerda hacer un *hard refresh* (Ctrl + Shift + R) para que se carguen las novedades.

---

## 🐛 1. Bug crítico: contadores de Clientes no cuadraban

### Antes ❌
- Vista General decía **178** clientes.
- Activos: **125** · Inactivos: **68**.
- Las cuentas no encajaban: 125 + 68 ≠ 178.

### Ahora ✅
Las tres secciones cuentan **exactamente lo mismo**: clientes reales (con `account_type = customer`).
- Vista General = Activos + Inactivos, **siempre**.
- Los "potenciales", "prospectos" y empresas sin clasificar viven solo en **Empresas** (con su badge "Sin clasificar"), no se mezclan con clientes.

> Si después del refresh los números siguen sin cuadrar, dímelo y miro caso por caso.

---

## 📄 2. Presupuestos como nuevo tipo de contacto

En la cajita **Registrar Contacto** del modal de cualquier empresa hay un **5º botón** además de Llamada / Reunión / Email / Nota:

> 📄 **Presupuesto**

Pulsas → registra un contacto del día tipo "Presupuesto enviado" en el historial.

---

## 📎 3. Adjuntar el archivo del presupuesto

Al pulsar "Presupuesto" aparece **un campo de fecha y un selector de archivo**:

- 📅 **Fecha de envío** (por defecto hoy, editable).
- 📎 **Adjuntar archivo** — PDF, Word, Excel, imágenes (.jpg/.png/.webp). **Máximo 20 MB**.

El archivo se guarda en un almacén privado del CRM y solo se accede mediante un enlace de descarga seguro con caducidad.

---

## 📂 4. Sección "Presupuestos" dentro de cada ficha

Nueva sección en el modal de cada empresa, justo bajo el widget de Actividad y Motivo de Descarte:

> 📂 **Presupuestos** *(N registrados)* ▾

**Funciona como un desplegable** (cerrado por defecto, no abruma) — al pulsarlo se despliegan las cards de cada presupuesto, **del más reciente al más antiguo**.

### Cada card muestra:

```
📄  Presupuesto reforma escalera
    📅 Enviado el 15 mar 2026  ✏️
    Obra completa con barandilla cromada

    [ 📥 Descargar archivo.pdf · 850 KB ]
    [ ⬆ Reemplazar ]   [ 🗑 Eliminar ]
```

### Lo que puedes hacer en cada presupuesto:

- 📥 **Descargar** — abre el archivo en una pestaña nueva.
- ✏️ **Cambiar la fecha de envío** — clic en el calendario de la card y edición inline (Guardar / Cancelar).
- ⬆ **Reemplazar** archivo — útil si subiste el equivocado. Sube uno nuevo, **borra el anterior automáticamente** del almacén.
- 🗑 **Eliminar** — pide confirmación, borra la entrada **y el archivo del storage** en un solo paso.

> 📌 **Importante:** los presupuestos **NO se sobrescriben** entre sí. Cada uno es una entrada independiente. Si envías 5 presupuestos a un cliente durante el año, tendrás los 5 por separado, todos con su archivo y su fecha.

---

## 📜 5. "Historial de Contacto" en cada ficha

Bajo el widget Actividad, una sección nueva que muestra **todos los contactos registrados** con esa empresa (llamadas, reuniones, emails, notas, presupuestos, tareas) ordenados por fecha descendente.

Cada entrada incluye icono según tipo, chip "Hecho" o "Pendiente", fecha, asunto y descripción. Si tiene archivo adjunto (presupuesto), aparece el enlace de descarga.

Si hay más de 5 entradas, aparece *"Ver los N restantes"* para expandir.

---

## ⚠️ 6. Sección "Motivo de Descarte"

Cuando marcas un cliente o potencial con la etiqueta 🟤 **Descartado**, aparece automáticamente una nueva sección en el cuerpo del modal:

> ⚠️ **Motivo de Descarte**
> *Explica brevemente por qué este cliente ha sido descartado.*
> [ caja de texto editable ]

- **Se guarda automáticamente** al salir del campo (sin botón Guardar).
- Si cambias la etiqueta a otra distinta de Descartado, **el motivo se borra** automáticamente para no dejar datos huérfanos.
- La sección solo aparece cuando el tag actual es Descartado.

Ejemplos sugeridos: *"No tiene presupuesto", "Compite con proveedor existente", "Impago anterior"*…

### 🐛 Bug corregido aquí
Antes, una vez marcado un cliente como Descartado, **no se podía cambiar la etiqueta**. Si pulsabas otro tag o "Quitar etiqueta", no pasaba nada. **Arreglado**: ahora siempre puedes cambiar el tag desde cualquier sitio (modal, lista, dropdown).

---

## 🗑️ 7. Eliminar contactos en 3 sitios

En la sección **Contactos**:

- **Tabla desktop** → nueva columna *Acciones* con icono 🗑️.
- **Card móvil** → icono 🗑️ en la esquina superior derecha.
- **Modal de detalle** → botón rojo **"Eliminar"** junto a Editar/Cerrar.

En todos los casos pide confirmación antes de borrar.

---

## ✏️ 8. Editar y eliminar tareas en el widget Actividad

Dentro de "Actividad" (Última tarea / Próxima tarea), ahora hay 2 iconos en la esquina superior derecha de cada tarjeta:

- ✏️ **Editar** — cambia el tipo, fecha, hora o descripción.
- 🗑️ **Eliminar** — pide confirmación, borra la tarea (y la quita del calendario global de Tareas).

Solo aparecen si hay una tarea (sin tarea no hay nada que editar).

---

## 🧩 9. Ficha de Empresa unificada con Clientes

Antes, cuando abrías una empresa desde la sección **Empresas**, veías un modal distinto al de Clientes. Ahora **es exactamente la misma ficha** que en *Vista General* e *Inactivos*:

- Mismo diseño visual.
- Mismos campos.
- Mismo widget de Actividad.
- Mismas acciones rápidas (Llamada / Reunión / Email / Nota / Presupuesto).
- Mismo "Historial de Contacto" y "Presupuestos".

**Da igual desde dónde abras una empresa, la ficha es idéntica.**

---

## 🆕 10. Nueva Empresa: ahora también eliges Activo o Inactivo

Al pulsar "Nueva Empresa" en la sección Empresas:

```
¿Dónde se guarda? *
┌──────────────────────┬─────────────────────┐
│ 🟡 Cliente Potencial │ 🟢 Cliente          │
└──────────────────────┴─────────────────────┘
                              ↓ (al elegir Cliente)
  ┌────────────────────────────────────────┐
  │ ¿En qué sección de Clientes lo guardamos? │
  │ ┌─────────────────┬──────────────────┐ │
  │ │ 🟢 Cliente Activo│🟠 Cliente Inactivo│ │
  │ └─────────────────┴──────────────────┘ │
  └────────────────────────────────────────┘
```

**Resultado:**
- Cliente Potencial → va a **Clientes Potenciales**.
- Cliente Activo → va a **Clientes Activos**.
- Cliente Inactivo → va a **Clientes Inactivos** (con `manual_status` ya marcado).

El toast de confirmación dice **exactamente dónde** quedó guardada la empresa al crearla.

---

## 📊 11. Métricas: card "Resumen de Actividades" eliminada

Quitada de la página **Métricas** según pediste.

---

## 🐛 12. Métricas: bugs en "Resumen de Tareas" arreglados

### Antes ❌
La card de Resumen de Tareas mostraba todo en cero:
- Pendientes: **0**, Vencidas: **0**, Alta Prioridad: **0**.

### Causas que encontré:
- **Pendientes** contaba *todas* las activities (incluyendo notas y registros sin fecha) y daba 0 por mezclar tipos.
- **Vencidas** miraba solo el campo `due_date`, ignorando las tareas programadas que usan `scheduled_at` desde el widget.
- **Alta Prioridad** filtraba por una metadata `priority='high'` que no existe (no hay UI para asignar prioridad).

### Ahora ✅
- 🔵 **Pendientes** — tareas no completadas con fecha asignada.
- 🔴 **Vencidas** — pendientes con fecha anterior a hoy (mira `due_date` y `scheduled_at`).
- 🟡 **Para Hoy** — pendientes con fecha = hoy *(reemplaza "Alta Prioridad")*.

> Mejora colateral: ahora se calculan con **una sola consulta** en vez de cinco → la página de Métricas carga más rápido.

---

## 📋 Resumen visual

```
✅ BUG: Cuentas de Clientes ahora cuadran (Vista = Activos + Inactivos)
✅ Nuevo botón "Presupuesto" en Registrar Contacto
✅ Adjuntar archivos a presupuestos (PDF, Word, Excel, imágenes — 20 MB máx)
✅ Sección "Presupuestos" desplegable con descarga/reemplazar/eliminar
✅ Fecha de envío editable inline en cada presupuesto
✅ Sección "Historial de Contacto" en cada ficha
✅ Sección "Motivo de Descarte" cuando el tag es Descartado
✅ BUG: Etiqueta Descartado ahora se puede cambiar/quitar
✅ Eliminar contactos desde tabla, móvil y modal
✅ Editar y eliminar tareas en widget Actividad
✅ Modal Empresa idéntico al de Clientes
✅ Nueva empresa: elegir Activo o Inactivo al crearla
✅ Métricas: card "Resumen de Actividades" eliminada
✅ BUG: Métricas de tareas (Pendientes/Vencidas) ahora cuentan bien
```

---

## 🤔 ¿Qué puedes probar hoy?

1. Entra en **Métricas** → mira que ahora "Pendientes" y "Vencidas" tienen números reales.
2. Crea una **nueva empresa** desde Empresas → elige Cliente → elige Inactivo → comprueba que aparece directamente en *Clientes Inactivos*.
3. Abre cualquier ficha de cliente → pulsa **Presupuesto** → adjunta un PDF → comprueba que aparece la sección "Presupuestos" desplegable.
4. Sube un archivo equivocado → pulsa **Reemplazar** en la card → sube el correcto.
5. Marca un cliente como **Descartado** → escribe el motivo → cambia luego la etiqueta a otra → comprueba que el motivo se limpia.
6. Ve a **Contactos** → elimina uno desde el icono 🗑️ de la fila (sin abrir el modal).
7. En la ficha de un cliente con tareas, pulsa el lápiz ✏️ junto a la próxima tarea → cámbiale la fecha → revisa que se actualizó en el calendario.

Cualquier cosa rara o que quieras mejorar, me lo dices.

— Tu equipo técnico 🔧
