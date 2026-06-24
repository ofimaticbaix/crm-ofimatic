# 🤝 Mundo CRM AI Native

## Contexto
CRM moderno AI-native para SMEs, agencias y equipos de ventas: customización sin código, adopción por diseño y GDPR-compliant desde la arquitectura. Entidades core (Contacts, Companies, Deals, Tasks, Notes), pipeline configurable con drag&drop, dashboard de KPIs, import (CSV/Excel/Access) y multi-tenant con RBAC. Estado: V1 MVP en desarrollo activo (ver `./README.md`). **Copia única y canónica en `/Volumes/ALEX DISK/UNIVERSO/crm-ai-native/`** (consolidada el 2026-06-24 a partir de la copia más reciente que estaba en `SaaS-Empresas/`; el antiguo duplicado fue eliminado).

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- Server Actions (backend), Sentry, PostHog
- Capacitor (build Android — APK en raíz)

## Conexión
- **Supabase** (Postgres + RLS + Auth + Storage) — `.env.local`.
- **Trigger.dev** (jobs), **Stripe** (payments), **Resend** (email).
- Repo: github.com/ofimaticbaix/crm-ofimatic.

## Skills
**Dedicada:** `crm-feature` — `.claude/skills/crm-feature/`.
`senior-fullstack`, `vercel:nextjs`, `vercel:ai-sdk` (features AI-native),
`senior-backend`, `react-best-practices`, `code-reviewer`, `test-driven-development`.

## Cadencia — Fase 1–2 (MVP → iteración)
Desarrollo activo del MVP con transición a iteración. Itera con autonomía en `app/`, `features/`, `components/`, `services/` y `jobs/`. Sugiere tests unitarios al crear funciones nuevas. Respeta la estructura por feature.

## NO hacer
- No hardcodear secrets (Supabase, Stripe, Resend, Trigger.dev): usar `.env.local`, nunca commitear.
- No romper RLS/multi-tenancy: cada workspace tiene datos completamente aislados.
- No usar la identidad git global (ahora personal/**Sekees**): repo de **ofimaticbaix**, fijar `user.email`/`user.name` por repo.
- Ya NO existe copia duplicada: esta es la única. No volver a clonar el repo dentro de otro mundo del universo.
