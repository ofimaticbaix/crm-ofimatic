# CRM Ofimatic — Informe de funcionalidades

**Producto:** CRM Ofimatic v1.0 — plataforma SaaS de gestión comercial
**Sitio:** crm-ofimaticbaix.vercel.app
**Documento:** breve informe comercial de funcionalidades en producción
**Fecha:** 18 de mayo de 2026

---

## Visión del producto

CRM Ofimatic es una plataforma de gestión comercial diseñada específicamente para pymes y equipos de venta españoles. Combina la facilidad de uso de herramientas modernas como Notion o Linear con la profundidad funcional de un CRM tradicional, eliminando las dos barreras habituales del sector: la curva de aprendizaje y el coste por usuario.

La plataforma está construida sobre una **arquitectura multi-empresa real** con aislamiento de datos a nivel de base de datos, planes de suscripción configurables y una versión móvil nativa Android lista para distribuir. Cubre el ciclo comercial completo: captación, cualificación, gestión de cuentas, oportunidades, actividades, métricas e integraciones con sistemas externos.

---

## Módulos en producción

### 1. Panel de control

Vista 360° del negocio en una sola pantalla. Reúne en tiempo real:

- Indicadores clave de rendimiento (valor del pipeline, forecast ponderado, tasa de conversión).
- Tareas pendientes del usuario, agrupadas por urgencia (vencidas, hoy, próximas).
- Oportunidades que cierran esta semana.
- Calendario interactivo mensual con creación de tareas *in situ* haciendo clic sobre cualquier día.
- Línea temporal con la actividad reciente del equipo.

### 2. Gestión de contactos y empresas

Sistema unificado bajo la sección **Clientes** que sustituye a las pantallas separadas de contactos y empresas habituales en CRMs tradicionales.

- Vista general con tabla ordenable por todas las columnas, búsqueda en tiempo real y filtros por estado.
- Sub-secciones de clientes **activos**, **inactivos** y **cerrados** con clasificación automática basada en actividad reciente.
- Sistema de **etiquetas de color** por cliente (al día, VIP, revisar) con ordenación visual inmediata.
- Vinculación automática de contactos a empresas mediante seis estrategias (nombre exacto, parcial, email, dominio, teléfono, coincidencia parcial).
- Panel de detalle unificado con todos los datos visibles a la vez, edición *inline* sin abrir modales, y campos extendidos: NIF, código de cliente, dirección completa, forma de pago, hasta 5 emails y 2 teléfonos por empresa.
- **Registro rápido de actividad** con un solo clic: llamada, reunión, email o nota, con observación opcional inline y confirmación visual inmediata.

### 3. Captación de leads (Clientes potenciales)

Sección dedicada a la prospección comercial.

- Importación independiente para listados de leads que aún no son clientes.
- Sistema de etiquetas visuales para priorizar el seguimiento.
- Migración a cliente activo con un único cambio de estado, conservando todo el histórico.

### 4. Pipeline de oportunidades

Tablero **kanban** profesional con vista alternativa de lista.

- Etapas de venta personalizables por empresa (siete etapas por defecto: Prospecto, Contactado, Cualificado, Propuesta, Negociación, Ganado, Perdido).
- **Drag-and-drop** funcional tanto en escritorio como en móvil (umbral táctil de 6 píxeles para evitar arrastres accidentales).
- Acciones rápidas "Ganado / Perdido" en cada tarjeta.
- Tarjetas que muestran valor del deal, empresa asociada, contactos involucrados, fecha de cierre prevista e indicadores visuales de riesgo (inactividad).
- Estadísticas por etapa: número de oportunidades y valor total acumulado.
- Cálculo automático de pipeline ponderado (valor × probabilidad de la etapa) para forecast comercial.

### 5. Tareas, calendario e historial

Gestor de tareas integrado con el resto del CRM.

- Tareas vinculadas a contactos, empresas u oportunidades concretas.
- Vista de calendario con detalle por día y creación rápida sin salir de la pantalla.
- Niveles de prioridad (Alta, Media, Baja) y destacado visual de tareas vencidas.
- **Historial de tareas completadas** independiente, para revisión y auditoría.
- Alertas urgentes en la cabecera de cualquier página y campanilla de notificaciones con clasificación temporal (vencidas, en menos de 1 hora, hoy, mañana, esta semana).
- Notificaciones nativas en la aplicación Android.

### 6. Mapa comercial y geolocalización

Pensado para equipos comerciales en campo.

- Mapa interactivo con todas las empresas geolocalizadas como marcadores.
- Geocodificación automática a partir de la dirección postal (con corrección de abreviaturas españolas habituales: c/, ctra., pol., etc.).
- Soporte para **registro de visitas comerciales** con check-in y check-out georreferenciados.
- Tipos de visita: presencial, videollamada, llamada.
- Resultado estructurado por visita: positivo, neutral, negativo, no show, con próximos pasos.

### 7. Métricas y reporting

Cuadro de mando ejecutivo con visión consolidada del negocio.

- KPIs en tiempo real: pipeline total, forecast ponderado, tasa de conversión, deals ganados/perdidos.
- Análisis por etapa del embudo.
- Estado del ciclo de vida de contactos (lead → prospecto → cliente).
- Distribución de actividad por tipo (llamadas, reuniones, emails, notas).
- Estadísticas de tareas pendientes y vencidas.

### 8. Importación de datos

Herramienta diferenciadora frente a CRMs tradicionales, especialmente importante para pymes que migran desde Excel o sistemas heredados.

- Asistente guiado de **seis pasos**: subida → detección → mapeo → limpieza → validación → inserción.
- Formatos soportados: **CSV, Excel (XLSX/XLS), Microsoft Access (MDB/ACCDB) y JSON**.
- Detección inteligente de cabeceras en archivos Excel con filas de título previas.
- **Auto-mapeo de columnas** con tres niveles: coincidencia exacta, parcial y detección por patrón de valores.
- **Perfiles reutilizables**: el mapeo de columnas se guarda para futuras importaciones del mismo origen.
- Limpieza automática por tipo de campo: emails, teléfonos (corrige números flotantes de Excel), NIF/CIF, fechas en múltiples formatos, números en notación europea (1.234,56 €).
- Tres estrategias de deduplicación configurables: omitir, actualizar o importar igualmente.
- Procesado por lotes con barra de progreso en tiempo real y descarga de errores en CSV.

### 9. Configuración y administración

Centro de control del espacio de trabajo.

- Datos de la empresa y personalización de marca (logotipo, color de fondo, subtítulo de la aplicación).
- Gestión del equipo: invitación de usuarios con roles diferenciados (propietario, administrador, miembro).
- Suscripción y facturación con conexión directa al portal de cliente de Stripe.
- **Gestión de claves de API** SHA-256 para integraciones externas.
- **Webhooks salientes** configurables con eventos específicos (alta/modificación/baja de contactos, empresas, oportunidades, tareas; ganancia/pérdida/cambio de etapa).

---

## Capacidades transversales

### Seguridad y cumplimiento

- Datos alojados íntegramente en infraestructura europea (Supabase, eu-west).
- **Aislamiento de datos por empresa garantizado a nivel de motor de base de datos** mediante Row-Level Security: cada workspace solo ve sus propios datos, sin posibilidad técnica de fuga entre clientes.
- Cifrado en tránsito (HTTPS) y en reposo.
- Trazabilidad de cambios y registro de auditoría.

### Movilidad

- **Aplicación Android nativa** firmada con keystore propio y disponible para distribución directa (`CRM-Ofimatic-v1.0.apk`).
- Identificador de aplicación: `com.ofimaticbaix.crm`.
- Sistema unificado de notificaciones: navegador en escritorio, notificaciones locales nativas en Android, con memoria anti-duplicados.
- Interfaz totalmente *responsive*: el dashboard kanban, las tablas y los modales se adaptan a viewport móvil sin pérdida de funcionalidad.

### Integraciones

- **API REST pública v1** con endpoints para contactos, empresas y oportunidades, autenticada mediante claves SHA-256.
- **Webhooks salientes** desencadenados desde la propia base de datos (independientes de la disponibilidad de la web), con logs de respuesta y duración por evento.
- Compatible con plataformas de automatización tipo n8n, Zapier o similares.

### Asistente conversacional integrado

- Chat de IA embebido (atajo de teclado **Ctrl + K**) impulsado por Claude de Anthropic.
- Respuestas en *streaming* en tiempo real, ancladas al contexto del workspace del usuario.

### Experiencia de usuario

- Diseño visual moderno con efecto *glassmorphism*, modo claro y oscuro.
- Navegación con prefetching de rutas: cambios de página por debajo de 100 ms tras la primera carga.
- Caché cliente con invalidación selectiva en todas las páginas.
- Mensajes de error y validación 100 % en español, redactados para usuarios no técnicos.
- Manual de usuario en español incluido como parte del producto.

---

*Documento descriptivo basado en inspección directa de la versión en producción a fecha 18 de mayo de 2026. Ofimatic Baix S.L.*
