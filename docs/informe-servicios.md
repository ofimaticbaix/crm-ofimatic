# Informe de servicios de desarrollo

**Proyecto:** CRM Ofimatic Baix — plataforma SaaS de gestión comercial multi-empresa
**Destinatario:** Ofimatic Baix S.L.
**Periodo cubierto:** 9 de marzo de 2026 — 15 de abril de 2026
**Versión entregada:** 1.0 (producción)
**Documento emitido:** 18 de mayo de 2026

---

## 1. Resumen ejecutivo

Durante el periodo del 9 de marzo al 15 de abril de 2026 se ha diseñado, desarrollado y desplegado en producción la **versión 1.0 del CRM Ofimatic Baix**, un sistema de gestión comercial multi-empresa pensado para pymes españolas. El sistema cubre la totalidad del ciclo comercial: captación de leads, cualificación de prospectos, gestión de clientes activos, oportunidades de venta, actividades de seguimiento, visitas presenciales con geolocalización, importación masiva de datos heredados, y notificaciones nativas en móvil.

El proyecto se ha llevado a cabo aplicando una arquitectura SaaS moderna sobre infraestructura serverless (Vercel) y base de datos PostgreSQL gestionada (Supabase), con aislamiento estricto de datos entre empresas mediante seguridad a nivel de fila (RLS) y un sistema de planes de suscripción con límites configurables. Adicionalmente se ha empaquetado la aplicación como **aplicación Android nativa** mediante Capacitor, firmada y lista para distribución.

A lo largo del periodo se han registrado **140 entregas de código** organizadas en **trece fases funcionales**, descritas en detalle en los apartados siguientes. El producto resultante está actualmente en producción en `crm-ofimaticbaix.vercel.app` y es la herramienta de gestión comercial utilizada por Ofimatic Baix.

---

## 2. Arquitectura y stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript estricto + Tailwind CSS | Stack actual de referencia para SaaS en 2026, máxima velocidad de desarrollo y mantenibilidad a largo plazo. |
| Backend | Server Actions de Next.js (sin servidor dedicado) | Reducción de superficie de mantenimiento; cero servidores que administrar. |
| Base de datos | Supabase PostgreSQL con Row-Level Security | Aislamiento real de datos por empresa garantizado a nivel de motor de BD, no de aplicación. |
| Autenticación | Supabase Auth con onboarding automático por trigger | Cada alta de usuario crea automáticamente su espacio de trabajo, plan de prueba y pipeline por defecto. |
| Pagos | Stripe Checkout + Billing Portal | Estándar de mercado, certificación PCI delegada. |
| Inteligencia artificial | Anthropic Claude vía API propia | Asistente conversacional embebido (acceso Ctrl+K) para consultas sobre la base de datos. |
| Observabilidad | Sentry (errores) + PostHog (analítica de producto) | Detección proactiva de incidencias y métricas de uso por empresa cliente. |
| Móvil | Capacitor 8 (Android) | Aplicación nativa firmada que carga la web en WebView; permite notificaciones push locales sin reescribir el código. |
| Despliegue | Vercel (Hobby/Pro) | Despliegues automáticos por push, previews por rama, sin gestión de infraestructura. |

---

## 3. Fases del proyecto

### Fase 1 — Fundación técnica y diseño visual (9 marzo)

**Motivo:** establecer una base sólida sobre la que iterar rápido durante las siguientes semanas, evitando deuda técnica desde el día uno.

**Entregables:**
- Inicialización del proyecto en Next.js 16 con TypeScript estricto y Tailwind CSS.
- Diseño del esquema de base de datos PostgreSQL completo (16+ tablas).
- Sistema de tipos TypeScript generados a partir del esquema.
- Castellanización completa de la interfaz (etapas, lifecycle, mensajes de error).
- Diseño visual base con efecto glassmorphism, soporte dark/light mode y branding inicial.

### Fase 2 — Interfaz inicial y módulos visuales (10 marzo)

**Motivo:** validar la propuesta de valor visual antes de conectar a base de datos real, asegurando que el producto se sintiera moderno y diferenciado frente a Salesforce/HubSpot.

**Entregables:**
- Rediseño completo del sidebar y dashboard (estilo minimalista tecnológico).
- Página de configuración con persistencia en localStorage.
- Optimización responsive móvil profesional (varias iteraciones).
- Modales de creación para empresas, contactos, oportunidades y tareas.
- Versión inicial del sistema de importación inteligente desde CSV/Excel.
- Sub-páginas de clientes desplegables: activos, atrasados, cerrados.
- KPIs en sidebar y página de métricas dedicada.
- Mini-calendario interactivo en dashboard con creación rápida de tareas.

### Fase 3 — Backend real, autenticación y multi-tenancy (11–12 marzo)

**Motivo:** pasar de prototipo con datos simulados a un sistema multi-empresa real con autenticación segura y aislamiento garantizado entre clientes.

**Entregables:**
- Integración completa con Supabase Auth: registro, inicio de sesión, middleware de protección de rutas.
- Páginas de login y signup con diseño SaaS profesional (glassmorphism, logo Ofimatic Baix).
- Server Actions CRUD para todas las entidades: contactos, empresas, oportunidades, pipeline, actividades.
- Sistema multi-empresa (workspaces) con roles: propietario, administrador, miembro.
- Onboarding automático: al registrarse un usuario se le crea su espacio de trabajo, plan de prueba de 14 días, pipeline por defecto y 7 etapas de venta predefinidas.
- Panel de administración global (vista super-admin) para gestionar suscripciones.
- Lista de correos privilegiados que ignoran restricciones de suscripción (Ofimatic Baix).

### Fase 4 — Geolocalización, mapas y visitas comerciales (13 marzo)

**Motivo:** dotar al equipo comercial de Ofimatic Baix de herramientas en campo para planificación de rutas y registro de visitas.

**Entregables:**
- Geocodificación automática de empresas vía OpenStreetMap / Nominatim, con expansión de abreviaturas españolas (c/, ctra., pol., etc.) y cinco estrategias de reintento en cascada.
- Tabla `visits` con check-in y check-out georreferenciados (latitud, longitud, dirección).
- Soporte de tres tipos de visita: presencial, videollamada, llamada.
- Resultado de visita estructurado: positivo, neutral, negativo, no show.
- Cálculo automático de duración por columna generada en BD.
- Tabla `routes` para planificación de rutas comerciales con múltiples empresas.
- Página de mapa interactivo con marcadores de empresas geocodificadas (Leaflet).
- Formulario completo de edición de empresa con dirección estructurada para geocodificación.

### Fase 5 — Webhooks e integraciones externas (13 marzo)

**Motivo:** permitir conectar el CRM con sistemas externos del cliente (n8n, ERPs, sistemas contables) sin necesidad de polling manual.

**Entregables:**
- Sistema de webhooks salientes configurables por empresa cliente.
- Eventos soportados: alta/modificación/baja de contactos, empresas, oportunidades, tareas; ganancia/pérdida/cambio de etapa de oportunidad; finalización de tarea.
- Implementación robusta vía triggers de PostgreSQL con la extensión `pg_net`, garantizando entrega aunque la aplicación web esté caída.
- Tabla de logs de webhooks (`webhook_logs`) con código de respuesta, cuerpo y duración para auditoría.
- Limpieza automática de logs antiguos (retención de los últimos 100 por webhook).
- Sistema de claves de API SHA-256 para autenticar consumidores externos.
- API REST pública v1 con endpoints para contactos, empresas y oportunidades.

### Fase 6 — Rendimiento y experiencia de navegación (13 marzo)

**Motivo:** que la herramienta se percibiera tan rápida como Linear o Notion, no como un CRM tradicional (lento).

**Entregables:**
- Carga consolidada de contexto de espacio de trabajo en una sola consulta.
- Caché cliente con invalidación selectiva en todas las páginas del dashboard.
- Prefetching de rutas al pasar el cursor sobre los enlaces de navegación.
- Resultado: tiempos de cambio de página percibidos por debajo de 100 ms tras la primera carga.

### Fase 7 — Formularios completos, calendario y manual de usuario (13–14 marzo)

**Motivo:** llevar la captura de datos del nivel de prototipo a nivel comercial, y dotar al cliente final de documentación para autonomía.

**Entregables:**
- Formularios completos de creación y edición de empresas y contactos con todos los campos previstos en el esquema.
- Edición de tareas con corrección del *bug* de zona horaria del calendario (uso de formato local en lugar de ISO).
- Mejora del cálculo de "días sin contacto" usando la fecha real de finalización de actividad.
- Lógica mejorada de clasificación automática de clientes (activo / atrasado / cerrado).
- **Manual de usuario completo en español** para los clientes finales del CRM.

### Fase 8 — Sistema de importación inteligente avanzada (24 marzo)

**Motivo:** las pymes españolas suelen llegar al CRM con datos heredados en Excel, Access o exportaciones de ERPs antiguos. Sin una importación robusta, el producto no se adopta.

**Entregables:**
- Asistente de importación de seis pasos: subida → detección → mapeo → limpieza → validación → inserción por lotes.
- Formatos soportados: CSV, XLSX, XLS, MDB/ACCDB (Microsoft Access), JSON.
- Detección inteligente de cabeceras en hojas Excel con filas de título.
- Auto-mapeo de columnas con tres capas: coincidencia exacta, *substring*, detección por patrón en valores.
- Sistema de **perfiles de importación reutilizables** (guarda el mapeo para la próxima vez).
- Limpiadores específicos por tipo de campo: emails, teléfonos (corrige números flotantes de Excel), NIF/CIF, fechas (DD/MM/YYYY, números de serie Excel), números en formato europeo (1.234,56 €).
- Tres estrategias de deduplicación configurables por el usuario: omitir, actualizar, importar igualmente.
- Detección de duplicados por NIF, email o nombre con normalización Unicode.
- Página dedicada de **Clientes Potenciales** (leads) con importación independiente.
- Sistema de etiquetas de color por cliente con fondo navy y avatares.
- Procesado por lotes de 50 registros con barra de progreso en tiempo real y descarga de errores en CSV.

### Fase 9 — Unificación de Clientes y vinculación automática (24 marzo)

**Motivo:** los datos importados tenían contactos y empresas separados sin relación. Restablecer las relaciones manualmente habría sido inviable.

**Entregables:**
- Unificación de la navegación: "Contactos" y "Empresas" se agruparon bajo la sección **Clientes**.
- Algoritmo de **vinculación automática** de contactos a empresas con seis estrategias en cascada: nombre exacto, nombre parcial, email exacto, dominio de email, teléfono, coincidencia parcial.
- API interna `/api/internal/fix-contacts` para diagnóstico y corrección masiva de relaciones rotas.
- Recreación de contactos desde empresas para casos en que se perdió la relación original.
- Restauración de empresas marcadas como eliminadas por error.
- Migración de `workspace_id` de contactos huérfanos.

### Fase 10 — Detalle de cliente y modal único (24 marzo)

**Motivo:** el flujo original obligaba a abrir varias páginas para ver un cliente. El cliente final solicitó una vista 360° en un solo lugar.

**Entregables:**
- Rediseño del detalle de empresa como **panel único** con todos los datos visibles a la vez.
- Vinculación inline de contactos desde el propio panel.
- Edición *in situ* (sin modal aparte) de todos los campos.
- Campos adicionales solicitados expresamente: Población, Provincia, CIF, Código de cliente, Forma de pago, Persona de contacto, Email 2-5, Teléfono secundario.
- Reordenación de campos según especificación del cliente.
- Botones de registro rápido de actividad (llamada, reunión, email, nota) con nota opcional inline.
- Confirmación visual "Registrado" tras cada acción para reforzar el feedback.

### Fase 11 — Vista general, navegación y experiencia de tablas (24 marzo)

**Motivo:** con cientos de clientes ya cargados, navegar y ordenar la información se convirtió en la prioridad de uso diario.

**Entregables:**
- Vista General de Clientes con fondo azul marino translúcido y buscador blanco contrastado.
- **Cabeceras de columna ordenables** (asc / desc / sin orden) en todas las tablas.
- Empresas ordenadas alfabéticamente por defecto.
- Corrección de errores HTTP "Bad Request" en consultas grandes mediante división en lotes (`batchIn`, máximo 200 elementos por lote).
- Click en fila completa abre el detalle (anteriormente sólo en el nombre).
- Modal de detalle que no se cierra al hacer clic en zonas neutras.
- Reorganización del sidebar: Contactos y Empresas elevados al menú principal.
- Aumento del límite de consulta a 2.000 registros por defecto para mostrar la totalidad de clientes.

### Fase 12 — Observabilidad y formularios de contacto (1–2 abril)

**Motivo:** preparar el sistema para producción real exige detección proactiva de errores y métricas de uso reales.

**Entregables:**
- Integración completa de **Sentry** para captura de errores y monitorización de rendimiento, con DSN configurado y rutas de monitoring tunelizadas (`/monitoring`).
- Integración de **PostHog** (instancia europea, conforme con RGPD) para analítica de producto.
- Página de prueba de Sentry para verificación de captura.
- Edición *inline* en el panel de detalle de empresa (eliminación del modal aparte).
- Crear contacto directamente desde el panel de empresa.
- Rediseño del formulario de contacto con iconos, etiquetas claras y campo LinkedIn.
- Unificación visual de los formularios de creación de contactos: notas, indicador de decisor, diseño coherente.
- "Forma de pago" convertida en desplegable con métodos B2B comunes (transferencia, domiciliación, pagaré, contado, confirming, etc.).
- Limpieza visual del grid de información: "Persona de Contacto" movida fuera del grid para evitar duplicación.

### Fase 13 — Sobrevuelo pre-demo, aplicación Android y notificaciones (15 abril)

**Motivo:** preparar la demo comercial y entregar una aplicación móvil real lista para distribución.

**Entregables:**
- Pulido de UX general en todas las páginas del dashboard.
- **Drag-and-drop del pipeline de oportunidades** con la librería `@dnd-kit`, optimizada para escritorio (PointerSensor) y móvil (TouchSensor con umbral de 6 px).
- Acciones rápidas "Ganado / Perdido" en cada oportunidad.
- Mejora del flujo de cambios de etapa del ciclo de vida del cliente.
- **Aplicación Android nativa** empaquetada mediante Capacitor 8, firmada con keystore propio (`CRM-Ofimatic-v1.0.apk`).
- Identificador de aplicación: `com.ofimaticbaix.crm`.
- Sistema de **notificaciones unificado** con detección automática de plataforma: API Web Notifications en navegador, `@capacitor/local-notifications` en la APK nativa.
- Memoria anti-spam en `localStorage` con limpieza automática a los 7 días.
- Componente "campanilla de notificaciones" con buckets temporales: vencidas, en menos de una hora, hoy, mañana, esta semana, después.
- Banner superior de alertas de tareas urgentes con descarte por sesión.
- Sonido de alerta generado por Web Audio API (sin archivos externos).
- Logo de marca naranja añadido como variante alternativa.

---

## 4. Documentación complementaria entregada

Además del código fuente y la base de datos en producción, se han entregado los siguientes documentos:

- `README.md` — documentación técnica para el equipo de desarrollo.
- `IMPLEMENTATION.md` — historial de fases técnicas con estado.
- `DEMO-READY.md` y `DEMO-SCRIPT.md` — guion comercial de demo de 8 a 12 minutos con respuestas preparadas a nueve preguntas difíciles.
- `LEEME-MAÑANA.md` — checklist operativo previo a presentación comercial.
- **`docs/MANUAL_USUARIO_CRM.md`** — manual de usuario completo en español, redactado para clientes finales sin formación técnica, cubriendo navegación, dashboard, contactos, empresas, oportunidades, tareas, importación y configuración.

---

## 5. Estado actual y próximos pasos sugeridos

**Producción:** la versión 1.0 está desplegada y operativa en `crm-ofimaticbaix.vercel.app`. La aplicación Android v1.0 está firmada y lista para distribuir.

**Áreas identificadas para próximas fases (no incluidas en este periodo):**

1. Conexión efectiva con Stripe en modo *live* (la integración está implementada en modo *test*).
2. Activación de envío transaccional de correo mediante Resend (la dependencia está prevista en el código, falta el cableado).
3. Programador de trabajos en segundo plano con Trigger.dev para tareas recurrentes (recordatorios automáticos, sincronizaciones nocturnas).
4. Módulo de facturas: la tabla `invoices` y la importación de facturas ya están en BD; falta interfaz de gestión.
5. Asignación de oportunidades y tareas a miembros del equipo (la columna existe en BD pero la UI aún no la expone).
6. Timeline unificado de actividad por cliente.

---

## 6. Resumen cuantitativo

| Métrica | Valor |
|---|---|
| Periodo de desarrollo | 9 marzo – 15 abril 2026 (≈ 5,5 semanas) |
| Entregas de código (commits) | 140 |
| Fases funcionales | 13 |
| Tablas de base de datos diseñadas | 25+ |
| Migraciones SQL aplicadas | 11 |
| Acciones de servidor implementadas | ≈ 4.500 líneas en 18 módulos |
| Páginas de aplicación entregadas | 15 (dashboard) + 4 (auth/admin) + 9 endpoints API |
| Plataformas de despliegue | Web (Vercel) + Android (APK firmada) |
| Integraciones externas | Supabase, Stripe, Anthropic Claude, Sentry, PostHog, OpenStreetMap, Capacitor |

---

*Documento generado a partir del historial de control de versiones del repositorio `crm-ai-native` y del estado del proyecto a 15 de abril de 2026.*

*Emisor: Ofimatic Baix S.L. · Dirección técnica: Alex Saumell · Contacto: a.saumellortuno98@gmail.com*
