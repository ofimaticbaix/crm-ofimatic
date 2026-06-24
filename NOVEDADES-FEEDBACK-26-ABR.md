# 📋 Respuesta a tu feedback · 26 de abril 2026

Hola Ferran 👋 — he resuelto los 4 puntos que me pasaste. Aquí te cuento qué he hecho en cada uno y cómo probarlo.

Pruébalo en **https://crm-ofimaticbaix.vercel.app** o en la APK. Recuerda: **Ctrl + Shift + R** (hard refresh) para que cargue la versión nueva.

---

## ✅ 1. Formas de Pago — lista actualizada

He cambiado la lista por la que me pediste. Ahora ves:

```
— Seleccionar —
Transferencia anticipada
Contado
Recibo 30 / 60 / 90
Transferencia 30 / 60 / 90
Confirming 30 / 60 / 90
Pagaré 30 / 60 / 90
Tarjeta
⚙️ Personalizar...
```

### ⚙️ Cómo funciona "Personalizar"
- Lo seleccionas en el desplegable.
- Aparece **una caja de texto debajo** donde escribes la forma de pago concreta (lo que sea: *"Cheque a 45 días", "Mitad anticipada / mitad a 30"*…).
- Al guardar, queda registrada tal cual.

### 🔒 Esta lista es exclusiva para tu cuenta
El CRM también lo usan otros clientes nuestros. Tu cuenta tiene **privilegios** y ve **solo tus formas de pago**. Las demás cuentas ven las suyas. Tu lista la puedo cambiar cuando quieras sin afectar a nadie más.

> Las formas de pago antiguas que tenían tus clientes (como "Aplazado 60 días" o "Recibo domiciliado") **siguen guardadas**. Si abres edición, las verás como "Personalizadas" para que las puedas dejar, ajustar o sustituir por una opción nueva.

---

## ✅ 2. Historial de Tareas — ahora se pueden eliminar

En la página **Historial de Tareas** cada fila tiene ahora un icono **🗑️** a la derecha:

- Click en la papelera → confirmación.
- Si confirmas, se borra de la base de datos al instante.
- Toast verde *"Tarea eliminada"* o rojo si falla.

### 🖨️ El icono no aparece en el PDF impreso
Los reportes mensuales/semestrales/anuales que generes salen limpios, **sin botones de gestión**. Solo la lista limpia para que la mandes a quien quieras.

---

## ✅ 3. Última tarea realizada — campo nuevo en Actividad

Como me dijiste, ya **no tenías que registrar** una tarea ya realizada con su fecha real (no solo "hoy"). Ahora en el widget **Actividad**, en la tarjeta **"Última tarea"**, hay un enlace verde:

> **➕ Registrar tarea realizada**

Lo pulsas y se abre un mini-formulario:
- **Tipo** — Llamada / Reunión / Email / Nota
- **Fecha** — por defecto hoy, **editable hacia atrás** (puedes poner la fecha real de cuándo ocurrió)
- **Hora** — opcional
- **Descripción** — opcional

Al guardar:
- ✅ Se registra como **completada** con la fecha que pusiste.
- ✅ **Aparece al instante en "Última tarea"** (si es más reciente que la anterior).
- ✅ Se añade automáticamente al **Historial de Contacto** dentro del modal de la empresa.
- ✅ Se añade al **Historial de Tareas** global.

### 📜 Ya existía: "Historial de Contacto" dentro del modal
> Aclaración: en el modal de cualquier empresa **ya existe** una sección llamada **"Historial de Contacto"** que muestra absolutamente todas las llamadas, reuniones, emails, notas, presupuestos y tareas con esa empresa. Si quieres ver el historial completo de un cliente, ahí lo tienes — ordenado por fecha de la más reciente a la más antigua.

---

## ✅ 4. Clientes Potenciales — direcciones recuperadas

Tenías razón: en la importación inicial **no se importó la calle/número** de los leads. Solo se importó teléfono, email, persona de contacto, CP y población.

### Lo que he hecho
He hecho un script que **lee el Excel original** (CLIENTES POTENCIALES. 1.xlsx) y rellena la calle de cada lead en la base de datos.

### Resultado
```
✅ 861 leads actualizados con su dirección
✅  13 leads ya tenían calle (sin tocar)
⚠️   2 leads sin match en el Excel  ← casos sueltos a rellenar a mano
```

### Importante
- Solo se ha actualizado el campo **calle/número** (`billing_address.street`).
- **NO he tocado** ningún otro dato: emails, teléfonos, ciudad, CP, NIF, persona contacto, web, tag, motivo de descarte, custom fields… todo intacto.
- **NO se ha creado ni borrado** ninguna empresa.

Recarga la app y entra en **Clientes Potenciales** — verás la calle rellenada en casi todas las fichas.

---

## 📋 Resumen rápido

| # | Lo que pediste | Estado |
|---|---|---|
| 1 | Cambiar lista de formas de pago | ✅ Hecho (solo en tu cuenta) |
| 2 | Poder eliminar tareas en Historial | ✅ Hecho |
| 3 | Campo de "tarea realizada" en Actividad | ✅ Hecho |
| 4 | Recuperar la calle de los leads | ✅ Hecho (861 actualizados) |

---

## 🤔 ¿Qué te recomiendo probar hoy?

1. **Formas de Pago:** abre cualquier ficha de cliente → edita → mira el desplegable → prueba "Personalizar" con una forma rara ("Cheque a 45 días").
2. **Eliminar tarea:** ve a Historial de Tareas → clic en la papelera de cualquier fila → comprueba que se borra.
3. **Tarea realizada:** abre cualquier cliente → en "Actividad" pulsa "Registrar tarea realizada" → pon fecha de hace 3 días → guarda → mira que aparece en Última tarea Y en el Historial de Contacto.
4. **Direcciones de leads:** ve a Clientes Potenciales → abre cualquiera → comprueba que ahora tiene calle rellenada.

Cualquier cosa rara, dudosa o que quieras ajustar, me lo dices.

— Tu equipo técnico 🔧
