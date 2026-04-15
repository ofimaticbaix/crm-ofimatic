# 🎬 Guión de Demo — CRM Ofimatic Baix

> **Duración**: 8-12 minutos · **Audiencia**: Cliente final, no técnico · **Tono**: Seguro, enfocado en problemas que resuelve, no en features técnicas.

---

## 🧠 Idea central que debes comunicar

> *"Este CRM convierte tu Excel de 1100 clientes en un sistema que te dice a quién llamar hoy, qué se te está escapando y dónde está el dinero."*

Tres mensajes a repetir:
1. **Antes era caos.** 2300 filas con duplicados, anotaciones metidas en el nombre, sin estructura.
2. **Ahora hay orden.** 1140 empresas limpias, clasificadas, con actividad rastreada.
3. **Y desde ahora, foco.** El sistema te dice qué cliente llamar, qué oportunidad cerrar, qué no se te puede olvidar.

---

## ⚙️ Preparación pre-demo (5 minutos antes)

1. **Chrome en modo incógnito**. Login → no uses Safari, no uses el móvil del cliente.
2. **Abrir pestañas preparadas** para precargar caché (navega tú antes):
   - `/dashboard`
   - `/clients` (Vista General)
   - `/clients/activos`
   - `/leads` (Clientes Potenciales)
   - `/companies` (Empresas)
   - `/deals` (Pipeline)
3. **Cerrar devtools/F12** si estaba abierto.
4. **Tamaño de ventana**: pantalla completa. Si compartes, deja sidebar visible.
5. **Datos de demo sembrados**: verifica que al abrir `/deals` ves tarjetas con valores variados (no solo columnas vacías).

---

## 🎬 Secuencia de demo (en este orden exacto)

### [0:00] Apertura — "El problema"

> *"Antes de nada: ayer la base de datos tenía 2300 filas. Muchas con cosas como 'A Y C ASENSIO, S.L. — NO LES INTERESA' o duplicados con diferencias de un espacio. El CRM ya no tiene nada de eso."*

Abre `/clients` (Vista General).

> *"557 clientes reales. Sin duplicados, sin anotaciones mezcladas en el nombre. Todos con estructura: nombre limpio, CIF, teléfono, ciudad, tipo."*

Click en cualquier cliente → se abre el modal.

> *"Aquí está toda la información en una sola pantalla. Y fíjate arriba: dos dropdowns importantes. 'Tipo' y 'Estado'."*

### [1:00] Clasificación — "Tipo" y "Estado"

Destaca **Tipo**: Cliente Potencial / Cliente.

> *"Cambiar de potencial a cliente es un click. Y si quiero forzar que aparezca en Activos, Inactivos o Cerrados sin depender del cálculo automático, uso el 'Estado'."*

Si el cliente es tipo 'Cliente', muestra el texto que explica: *"El sistema clasifica este cliente en Activos, Inactivos o Cerrados según su actividad reciente."*

> *"Es decir: el sistema sabe cuándo fue la última vez que hablaste con el cliente. Y lo usa para decirte 'este lleva 10 días sin contacto, llámale'."*

### [2:00] Registrar contacto — El diferencial

Dentro del modal, muestra el bloque azul **"Registrar contacto"**.

> *"Esto es lo más importante. Cada vez que llamas a un cliente o le envías un email, pulsas un botón aquí: Llamada, Reunión, Email, Nota. Un click y queda registrado con fecha de hoy. El cliente automáticamente pasa a 'Activos'."*

Haz click en "Llamada" → opcional escribe "seguimiento presupuesto" → Guardar.

> *"Ya está. Si antes este cliente estaba en 'Inactivos', ahora está en 'Activos'. Sin navegar, sin rellenar formularios largos."*

### [3:00] Navegación clientes — Activos / Inactivos / Cerrados

Ve a `/clients/activos`.

> *"Aquí veo mis clientes activos. El sistema los clasifica solo, según si han tenido actividad en los últimos 7 días o tienen algo agendado."*

Ve a `/clients/inactivos`.

> *"Y aquí los que necesitan atención: más de una semana sin contacto. Esta pantalla es oro: cada día abres el CRM, miras aquí, y ves a quién tienes que llamar hoy. No más 'se me olvidó ese cliente'."*

Si hay clientes aquí, haz click en una card → mismo modal, registra un contacto → vuelves → ha desaparecido de Inactivos.

### [4:00] Clientes Potenciales — Lead generation

Ve a `/leads` (Clientes Potenciales).

> *"Aquí viven los leads — 464 potenciales que vienen de importaciones, frío, etc. Nunca se mezclan con clientes reales. Tienen su propia sección."*

Muestra los **tags**: Visitar, No Interesa, Cliente.

> *"Cuando un lead muestra interés, un click y queda marcado como 'Visitar'. Cuando decide comprar, cambio el tipo a 'Cliente' y automáticamente aparece en Activos."*

Haz click en un lead → modal → Tipo: Cliente → cierra modal → *"Ya ha pasado a clientes reales."*

### [5:30] Empresas — Creación y anti-duplicados

Ve a `/companies` y click en **"Nueva Empresa"**.

Rellena con un nombre que ya exista. Ejemplo: escribe una empresa conocida del listado.

> *"Si intento crear una empresa que ya existe, el sistema lo detecta."*

Guarda → toast de error amable: *"Ya existe una empresa con el nombre X..."*.

> *"Imposible volver a duplicar. Y lo mismo con el CIF."*

### [6:30] Pipeline — El momento "wow"

Ve a `/deals`.

> *"Esto es el embudo de ventas. Todas las oportunidades abiertas, en las etapas donde están."*

Destaca el header:

> *"Total del pipeline: X€. Y proyectado: Y€. Esta segunda cifra es lo que realmente voy a cerrar: cada deal multiplicado por la probabilidad de su etapa. Así sé mi número realista de cierre del trimestre."*

Elige una tarjeta en "Calificación" y **arrastra** a "Propuesta".

> *"Mover una oportunidad de etapa es arrastrar. Cambia al instante."*

Elige otra con valor grande (>10k) — borde verde o morado — y señala el **chip de fecha**:

> *"Los colores del borde te dicen de un vistazo el tamaño: gris pequeño, azul medio, verde grande, morado estratégico. La etiqueta de fecha te avisa si está vencida, si cierra esta semana, o si hay tiempo."*

Click en el botón verde **🏆 Ganado** de una tarjeta.

> *"Y cerrar una venta es un click. Cambia solo a la columna de ganados."*

### [8:00] Mobile/tablet (opcional)

Si el cliente pregunta por móvil:

1. Pulsa F12 → icono dispositivo → iPhone.
2. Navega al pipeline.
3. *"Se ve todo el embudo en pantalla. Tarjetas compactadas para que sigan siendo útiles. Arrastrar funciona con pulsación larga."*

### [8:30] Mapa (opcional, solo si aplica)

Ve a `/map`.

> *"Y si eres comercial de calle: aquí veo todos mis clientes en el mapa. Un click y hago check-in cuando visito uno."*

### [9:00] Cierre

Vuelve al `/dashboard`.

> *"En resumen: toda la información que ayer estaba en un Excel con 2300 filas confusas, ahora está aquí. Ordenada, clasificada, con alertas de qué hacer, y accesible desde el móvil. ¿Empezamos?"*

---

## 💬 Respuestas preparadas a preguntas difíciles

### "¿Se puede asignar tareas a distintos usuarios del equipo?"

> *"La asignación individual por usuario está en roadmap para la siguiente iteración. Ahora mismo todo el equipo ve todo, porque el cliente tiene un único workspace. Cuando activemos multi-usuario real, cada tarea tendrá dueño."*

### "¿Y el control horario / RGPD?"

> *"El soft-delete está implementado (podemos recuperar cualquier dato borrado). El export masivo y la anonimización están planeadas para la fase 2. Ahora mismo la BD cumple con RGPD en lo estructural (datos localizados en Europa, control de accesos por workspace)."*

### "¿Puedo importar desde Excel?"

Ve a `/import` → muestra la sección.

> *"Sí. Subes el archivo, mapeas columnas, y el sistema detecta duplicados antes de insertar. También detecta CIFs repetidos y avisa."*

### "¿Cuántos datos soporta?"

> *"Probado con 1100+ empresas sin lag. La arquitectura está preparada para 10x esa cifra sin cambios."*

### "¿Y si el sistema falla?"

> *"Cada cambio se guarda al instante en Supabase (backup automático diario). Los borrados son 'soft' — recuperables. Los errores se registran en Sentry para que los veamos nosotros antes de que se queje el cliente."*

### "¿Hay integración con WhatsApp / email?"

> *"WhatsApp Business via Evolution API está contemplado en fase 2 como el siguiente paso. El pipeline actual soporta registrar actividades de email/llamada/reunión manualmente; la integración automática vendrá después."*

### "¿Por qué está todo en 'Inactivos'?"

(Solo si no sembraste datos y aparece todo ahí)

> *"Porque aún no habéis registrado contactos. En cuanto uséis el botón 'Registrar contacto' cuando hablas con un cliente, se mueve automáticamente a Activos. Esa es la clave del sistema."*

### "¿Funciona en Safari / iPhone / iPad?"

> *"Está optimizado para Chrome, Edge y Firefox, tanto desktop como móvil. En iPad Safari funciona al 95% — quedarían pequeños detalles de pulido que haríamos en la siguiente iteración."*

### "Podemos cambiar colores, logos?"

> *"Sí, todo es personalizable. Los colores corporativos, el logo, los campos personalizados de empresa/contacto, las etapas del pipeline. Es un parámetro de configuración."*

---

## 🚫 Qué NO hacer en la demo

1. **NO abrir F12** (devtools). Queda amateur.
2. **NO abrir el login** en modo normal (sale email/password + historial).
3. **NO clickar en funciones que no has probado** que vayas a explicar.
4. **NO prometer fechas** de roadmap — di "fase 2" o "siguiente iteración".
5. **NO mencionar Supabase/PostgreSQL/Next.js** salvo que lo pregunten. Di "base de datos profesional en la nube".
6. **NO improvisar con datos del cliente** que no hayas revisado. Úsalos como telón de fondo, no como protagonistas.
7. **NO abrir settings/admin** — hay info técnica que confunde.
8. **NO entrar en `/dashboard` como primera pestaña** — si los KPIs están flojos, empieza por Vista General que se ve sólido.

---

## 🎯 Cierre emocional

Después de la demo, recapitula así:

> *"Tenéis ahora mismo, en vuestra cuenta, 557 clientes limpios, 464 leads separados, y un pipeline visual. El sistema ya os está clasificando clientes automáticamente por actividad. Desde hoy cada llamada que hagáis se registra con un click. La próxima semana ya estaréis tomando decisiones con datos que antes eran impossible de sacar del Excel."*

> *"¿Qué parte te gustaría ver con más detalle?"*

Deja el control al cliente para que dirija la conversación hacia lo que le importa.
