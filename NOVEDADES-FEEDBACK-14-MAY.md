# 📋 Respuesta a tu feedback · 14 de mayo 2026

Hola Ferran 👋 — pequeña actualización (V.6.1) con las tres mejoras del **Historial de Tareas** que me comentaste hoy. Todo ya está **online y funcionando**.

🟢 **Online ahora mismo en https://crm-ofimaticbaix.vercel.app** y en la APK.

> Si entraste antes de leer esto, haz **Ctrl + Shift + R** (hard refresh) o cierra y vuelve a abrir la APK. No pierdes datos.

---

## ✅ 1. Top empresas con más contactos — ahora se actualiza automáticamente

### Lo que detectaste
> "En el historial de tareas, el top de empresas con más contactos no se actualiza."

### Por qué pasaba
La consulta tenía un **cap silencioso de 50 actividades**, así que el "Top" se computaba sobre un subconjunto incompleto. Cuando registrabas tareas nuevas, las viejas se perdían del cálculo y los números no cuadraban.

### Lo que he hecho
- **Subido el límite** a 5.000 actividades por consulta (suficiente para varios años de trabajo).
- **Suscripción en tiempo real** a la tabla de actividades: cualquier alta, edición o borrado de una tarea — venga de donde venga — dispara un recálculo automático del Top.

### Lo que verás
Imagina que el Top está así:
```
1. PURMATIC SA          5 tareas
2. METALÚRGIA XYZ       3 tareas
3. ACME SL              2 tareas
```

Entras en la ficha de **ACME SL** y registras una llamada → el Top se reordena solo en menos de 1 segundo, sin recargar nada:
```
1. PURMATIC SA          5 tareas
2. METALÚRGIA XYZ       3 tareas
2. ACME SL              3 tareas    ← actualizado al instante
```

### Cosas a tener en cuenta
- El **período seleccionado** (año/mes) sigue aplicando.
- El **buscador** también filtra: si tienes texto en la búsqueda, el Top solo cuenta tareas que coincidan.
- Si **borras una tarea**, el Top también se actualiza al instante.

---

## ✅ 2. Editar la fecha de una tarea — inline desde el Historial

### Lo que pediste
> "Veo que el cliente pone aquí 'reunión 13 de mayo a las 2:00' y quizá esa tarea no se haya realizado en ese momento. Querría un campo para poder editar la fecha, porque ahora es un poco lioso."

### Lo que he hecho
Cada fila del Historial ahora tiene **edición inline de la fecha y hora**.

#### Cómo funciona
1. Pasas el ratón sobre la fecha de cualquier tarea → aparece un pequeño icono de lápiz ✏️.
2. Click → la fecha se convierte en un **selector de fecha+hora** con el valor actual precargado.
3. Cambias a la fecha real que ocurrió la reunión/llamada/etc.
4. Pulsas el botón verde **✓** para guardar (o ❌ para cancelar).
5. Toast verde *"Fecha actualizada"* y la fila se reordena automáticamente según la nueva fecha.

#### Ejemplo de tu caso
La reunión registrada como *"Reunión, PURMATIC SA — 13 mayo 14:00"*, pero realmente fue el **15 a las 16:30**:
1. Hover sobre `13 may  14:00`
2. Click → cambias a `2026-05-15T16:30`
3. ✓ → la tarea ahora sale como *"15 may 16:30"* y se reordena en el listado.

> 🖨️ **Importante**: el icono de edición NO sale en los PDFs impresos. Los reportes mensuales/semestrales/anuales se siguen viendo limpios.

---

## ✅ 3. Ubicación de la empresa en cada tarea

### Lo que pediste
> "Me gustaría que apareciera la ubicación de la empresa. Por ejemplo, la tarea más reciente pone 'reunión, PURMATIC SA'. Me gustaría que también apareciera dónde se encuentra."

### Lo que he hecho
Cada fila del Historial muestra ahora **ciudad y provincia** junto al nombre de la empresa:

**Antes:**
```
🟣 Reunión · PURMATIC SA · José García
```

**Ahora:**
```
🟣 Reunión · PURMATIC SA · 📍 Sant Boi de Llobregat, Barcelona · José García
```

### De dónde sale
De los campos **ciudad** y **provincia** de la ficha de la empresa. Como ya rellenamos la provincia en 832 leads en la V.5, prácticamente todas tus empresas tienen ubicación visible.

Si una empresa no tiene esos campos rellenos, simplemente no aparece la ubicación (no rompe nada).

---

## 🚀 Cómo probarlo

1. Entra en **https://crm-ofimaticbaix.vercel.app/task-history** o en la APK.
2. **Ctrl + Shift + R** para forzar la versión nueva.
3. Recorre los tres puntos:
   - 🔝 **Top empresas**: registra una nueva actividad desde cualquier ficha de empresa → al volver al Historial verás el Top actualizado sin tocar nada.
   - ✏️ **Editar fecha**: pasa el ratón sobre la fecha de una tarea → click sobre el lápiz → cambia → guarda.
   - 📍 **Ubicación**: las tareas con empresa asociada ya muestran ciudad y provincia automáticamente.

---

## 📋 Resumen de las versiones publicadas

| Versión | Fecha | Foco |
|---|---|---|
| V.1 | 21 abr | Lanzamiento inicial |
| V.2 | 23 abr | Mejoras de UX y filtros |
| V.3 | 26 abr | Pre-demo overhaul, pipeline DnD |
| V.4 | 28-29 abr | 4 puntos de feedback (formas de pago, historial, dirección leads) |
| V.5 | 29 abr | Filtros, embudo dinámico, métricas coherentes, provincias |
| V.6 | 7 may | Oportunidades en ficha, historial schematic, tiempo real, parpadeo |
| **V.6.1** | **14 may** | **Historial de Tareas: Top auto-actualizado, editar fecha, ubicación** |

Si algo no encaja con lo que esperabas o quieres más ajustes, dímelo y vamos a por la siguiente.

— Alex
