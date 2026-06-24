---
name: crm-feature
description: Usar cuando se va a implementar una feature del CRM AI-native (Next.js 16 App Router, Server Actions, Supabase RLS multi-tenant por workspace) trabajando en la raíz canónica /Volumes/ALEX DISK/crm-ai-native/.
---

# CRM AI Native — Feature por módulo
## Cuándo se activa
Al añadir o ampliar una feature (Contacts, Companies, Deals, Tasks, Notes, pipeline, dashboard KPIs, import CSV/Excel/Access, RBAC). Stack: Next.js 16 (App Router) + React 19 + TS + Tailwind + shadcn/ui + Server Actions; Supabase, Stripe, Trigger.dev, Resend; Sentry/PostHog.

## Procedimiento
1. Trabajar SOLO en la raíz canónica `/Volumes/ALEX DISK/crm-ai-native/`. NUNCA en el duplicado `Alex 1.0/SaaS-Empresas/crm-ai-native`.
2. Leer `README.md` para situar la feature en el MVP V1.
3. Respetar la estructura por feature: rutas/UI en `app/` (incluye grupo `(dashboard)`, `admin`, `api`, `auth`), lógica en `features/`, UI compartida en `components/`, backend en `services/` (Server Actions), jobs asíncronos en `jobs/` (Trigger.dev), helpers en `lib/`, estado en `stores/`, tipos en `types/`.
4. Datos: migración nueva en `supabase/migrations/`. Toda tabla con RLS multi-tenant por `workspace` — datos de cada workspace completamente aislados.
5. Integraciones: Stripe (payments), Resend (email), Trigger.dev (jobs) — invocar desde `services/`/`jobs/`, nunca con claves en cliente. Middleware en `middleware.ts`.
6. Al crear funciones nuevas, sugerir tests unitarios.

## Reglas
- No editar la copia duplicada de `SaaS-Empresas/`: solo la raíz canónica.
- RLS/multi-tenancy por workspace inquebrantable: verificar aislamiento total entre workspaces.
- No hardcodear secrets (Supabase, Stripe, Resend, Trigger.dev): usar `.env.local`, nunca commitear.
- Identidad git POR-REPO a la cuenta **ofimaticbaix** (`github.com/ofimaticbaix/crm-ofimatic`); el git global es personal/Sekees, no usarlo aquí.
