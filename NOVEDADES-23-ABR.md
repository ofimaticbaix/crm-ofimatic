# 🚀 Novedades del CRM · 23 de abril 2026

Hola Ferran 👋 — aquí tienes todas las mejoras aplicadas hoy en tu CRM.
Puedes probarlas directamente en **https://crm-ofimaticbaix.vercel.app** o desde la APK.

---

## 🧹 1. Adiós a "Cliente Cerrado"

Esta categoría ya no existe en ningún sitio:

- ❌ Fuera del menú lateral de **Clientes**
- ❌ Fuera de los desplegables de Estado dentro de las fichas
- ❌ La pestaña `/clients/cerrados` ya no es accesible

A partir de ahora solo hay **dos estados posibles** para un cliente:
**Activo** o **Inactivo**. Más simple, más claro.

---

## 🎯 2. "Inactivo" lo decides TÚ

### Antes ❌
Un cliente pasaba a Inactivo **automáticamente** si llevaba más de 7 días sin contactarse. Resultado: clientes aparecían como "inactivos" sin que tú lo hubieras decidido, y a veces salían a la vez en Activos e Inactivos.

### Ahora ✅
Un cliente **solo es Inactivo cuando tú lo marcas manualmente** desde su ficha.
Garantizado: **un cliente no puede estar en Activos e Inactivos al mismo tiempo**. O uno, o el otro.

> El banner amarillo de "Acción requerida. Estos clientes llevan más de 7 días sin contacto" también se ha eliminado — ya no tiene sentido.

---

## 🏷️ 3. Empresas con etiquetas de un vistazo

En la sección **Empresas** ahora cada tarjeta muestra una etiqueta de color junto al nombre:

| Color | Etiqueta | Qué significa |
|---|---|---|
| 🟢 | **Cliente Activo** | Cliente real marcado como activo |
| 🟡 | **Cliente Potencial** | Está en Clientes Potenciales |
| 🟠 | **Cliente Inactivo** | Cliente que has marcado como inactivo |
| ⚪ | **Sin clasificar** | Empresa antigua sin categoría definida |

Así sabes en qué estado está cada empresa sin tener que entrar en la ficha.

---

## 🔍 4. Filtros rápidos en Empresas

Justo debajo del buscador, tienes **5 botones de filtro** con el contador real de cada grupo:

```
[ Todas 1136 ]  [ Cliente Activo 196 ]  [ Cliente Potencial 920 ]
[ Cliente Inactivo 19 ]  [ Sin clasificar 1 ]
```

Pulsa uno y la rejilla de empresas se filtra al instante. El número del lado es el total **real**, no una estimación.

---

## 🆕 5. Nueva empresa: decides dónde va

Al crear una empresa desde la sección **Empresas**, el primer paso del formulario es ahora:

> **¿Dónde se guarda?** *(obligatorio)*
>
> 🟡 **Cliente Potencial** → irá a la sección "Clientes Potenciales"
> 🟢 **Cliente** → irá a la sección "Clientes Activos"

**No puedes crear la empresa sin elegir uno de los dos**. Fin del limbo: antes las empresas creadas aquí no aparecían en ninguna sección.

También se han retirado del formulario opciones que no usabas: Prospecto, Partner, Proveedor, Canal de adquisición, País (por defecto España), etc. Menos ruido.

---

## 🧩 6. Fichas unificadas en todas las secciones

Hemos hecho que los formularios de todas las secciones muestren **exactamente los mismos campos**:

| Sección | Ver | Editar | Campos iguales |
|---|---|---|---|
| 📂 Empresas | ✅ | ✅ | ✅ |
| 🟢 Clientes Activos | ✅ | ✅ | ✅ |
| 🟠 Clientes Inactivos | ✅ | ✅ | ✅ |
| 🟡 Clientes Potenciales | ✅ | ✅ | ✅ |
| 🔵 Vista General | ✅ | ✅ | ✅ |
| ➕ Crear empresa | — | ✅ | ✅ |

Ahora no importa desde dónde abras la ficha de una empresa: siempre verás y podrás editar los mismos datos.

---

## 📋 7. Campos nuevos, todos opcionales

Se han añadido **5 campos opcionales** a todas las fichas, útiles pero que no molestan si no los rellenas:

- 🏭 **Sector / Industria** — texto libre (ej: "Carpintería metálica")
- 👥 **Tamaño (empleados)** — desplegable: 1-10, 11-50, 51-200, 201-500, 501+
- 🌐 **Sitio Web** — con enlace directo clicable
- 💼 **LinkedIn** — URL del perfil de la empresa
- 💵 **Facturación Anual (€)** — para segmentar cuentas grandes/pequeñas

Aparecen en la sección "Información" de la ficha, y en el formulario de creación dentro del apartado **"Información adicional (opcional)"**. Si no los rellenas, se muestra simplemente un guion (—).

---

## 🐛 8. BUG CORREGIDO: Ya se ven TODAS las empresas

### El problema
En Empresas solo aparecían **1000 empresas**, cuando tú tienes más de **1100**. Los números de los filtros eran:

> Todas: **1000** · Activos: 91 · Potenciales: 890 · Inactivos: 19

Todo eso estaba mal. El sistema estaba cortando los resultados por un límite técnico de Supabase (tope de 1000 filas por consulta).

### La solución
Ahora el CRM carga las empresas en lotes sucesivos hasta que no quedan más. Los números que verás son los **reales**.

> Todas: **~1136** · Activos: **~196** · Potenciales: **~920** · Inactivos: **~19**

Este bug afectaba también a otras partes: cualquier pantalla que llamara a "todas las empresas" tenía el mismo problema. Ya está corregido en todas ellas.

---

## 🗓️ 9. Programar tarea desde la ficha (confirmado)

Verificación end-to-end: cuando programas una **próxima tarea** desde la ficha de un cliente (widget "Actividad"):

1. ✅ Se guarda como tarea en el calendario de **Tareas**
2. ✅ Aparece en la fecha (y hora si la pusiste) que indicaste
3. ✅ Queda vinculada al cliente (se ve el nombre de la empresa en el calendario)
4. ✅ **Dispara las notificaciones automáticas**: 24h antes y 1h antes
5. ✅ Si la cancelas con la X del widget, desaparece también del calendario

Una sola fuente de verdad. No hay duplicados ni desincronización.

---

## ⚡ 10. Todo más rápido

Hemos aplicado mejoras internas al motor del CRM para que vaya más fluido:

### Búsquedas instantáneas
Al escribir en el buscador de Empresas, Activos o Potenciales con muchos registros, ya **no se congela**. Antes reordenaba toda la lista con cada letra; ahora solo recalcula cuando cambias lo que buscas.

### Cargas iniciales más veloces
Las consultas a la base de datos ahora se hacen **en paralelo** en vez de una detrás de otra. La Vista General y los listados tardan notablemente menos en aparecer la primera vez.

### Sin llamadas duplicadas
Si dos partes de la app necesitan los mismos datos a la vez, ahora **se comparten** — antes pedía lo mismo dos veces al servidor.

### Clasificaciones más rápidas
El cálculo interno de qué empresa es Activa/Inactiva se ha optimizado: ahora hace 1 pasada sobre los datos en vez de 3.

---

---

## 🧑 11. Eliminar contactos — ahora en 3 sitios

Antes solo se podía eliminar un contacto desde dentro de su ficha, y tampoco de forma clara. Ahora:

### En la tabla de Contactos (desktop)
Cada fila tiene ahora una columna **"Acciones"** con un icono 🗑️ a la derecha. Pulsas → confirma → borrado.

### En la vista móvil
Cada tarjeta de contacto tiene la 🗑️ en la esquina superior derecha. Idéntico comportamiento.

### Dentro del modal de contacto
En el pie del modal de detalle, junto a **Editar** y **Cerrar**, hay ahora un botón **"Eliminar"** en rojo.

En los tres casos se pide confirmación (`¿Estás seguro…?`) antes de borrar. **Sin sustos**.

---

## 📅 12. Editar y eliminar tareas desde la ficha de empresa

Dentro de cada ficha de cliente/empresa, en el apartado **"Actividad"** (donde aparecen la **Última tarea** y la **Próxima tarea**), ahora tienes dos iconos nuevos en la esquina superior derecha de cada tarjeta:

- ✏️ **Editar** — cambia el tipo, fecha, hora o descripción sin tener que borrar y volver a crear.
- 🗑️ **Eliminar** — pide confirmación y borra la tarea. Si era una próxima tarea programada, desaparece también del calendario global.

### Diferencia entre editar "Última" vs "Próxima"
- **Última tarea** (ya completada): puedes cambiar tipo y descripción. La fecha de cuándo ocurrió se mantiene (porque fue real).
- **Próxima tarea** (programada): puedes cambiar todo — tipo, fecha, hora, descripción.

> Importante: los botones solo se muestran **si existe una tarea**. Si en una empresa no has programado nada ni has registrado contactos, los iconos no aparecerán porque no hay nada que editar/eliminar.

Esta funcionalidad se ve igual en **todas las fichas de cliente** (Activos, Inactivos, Potenciales, Vista General y Empresas).

---

## 🧩 13. Ficha de Empresa unificada con la de Clientes

Antes, cuando abrías una empresa desde la sección **Empresas**, veías un modal distinto al de Clientes (diferente diseño, diferentes campos). Eso **confundía** y hacía que no supieras dónde podías editar qué.

### Ahora
La ficha de **Empresas** es **exactamente la misma** que la de **Vista General** e **Inactivos**:

- Mismo diseño visual
- Mismos campos (todos los que añadimos esta semana)
- Mismos botones de acción rápida (Llamada / Reunión / Email / Nota)
- Mismo widget de Actividad (con los botones editar/eliminar del punto 12)
- Mismo dropdown de Tipo (Potencial / Cliente) y Estado (Activo / Inactivo)

### Qué significa esto para ti
Abras donde abras una empresa, la experiencia será **idéntica**. No tienes que aprender 5 fichas distintas.

---

## 📊 Resumen visual

```
✓ Eliminada la categoría "Cliente Cerrado"
✓ "Inactivo" ahora es 100% decisión tuya
✓ Cada empresa tiene etiqueta visible de su estado
✓ Filtros rápidos con contadores reales en Empresas
✓ Obligatorio elegir destino al crear empresa (Potencial/Cliente)
✓ Fichas idénticas en todas las secciones
✓ 5 campos nuevos opcionales (sector, tamaño, web, LinkedIn, facturación)
✓ Eliminar contactos desde tabla, móvil y modal
✓ Editar y eliminar tareas desde la ficha de empresa
✓ Modal de Empresa unificado con el de Clientes
✓ BUG RESUELTO: se ven TODAS las empresas (no solo 1000)
✓ Rendimiento notablemente mejorado
```

---

## 🤔 ¿Qué puedes probar hoy?

1. Entra en **Empresas** → mira los badges de colores y prueba los filtros.
2. Abre la ficha de un Cliente Activo → pulsa **Estado** → ponlo en Inactivo. Verás que sale de Activos y entra en Inactivos. Vuelve a ponerlo Activo y listo.
3. Pulsa **"Nueva Empresa"** en Empresas → te obligará a elegir Potencial/Cliente antes de crearla.
4. Teclea rápido en el buscador de Empresas con 1000+ filas → nota que ya no se atasca.
5. Ve a **Contactos** → elimina un contacto desde la tabla con el icono 🗑️.
6. Abre una empresa con tareas → toca el lápiz ✏️ en una tarea y cambia su fecha. Mira **Tareas** y comprueba que se actualizó en el calendario.
7. Abre una empresa desde **Empresas** y otra desde **Vista General** → comprueba que la ficha es idéntica.

Cualquier cosa que veas rara o que quieras mejorar, me lo dices.

— Tu equipo técnico 🔧
