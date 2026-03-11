# CRM

**El CRM que tu equipo realmente usará**

Un CRM moderno diseñado para SMEs, agencias y equipos de ventas que necesitan:
- ✅ Customización sin código
- ✅ Adopción por diseño
- ✅ GDPR-compliant desde arquitectura

---

## 🚀 Stack Tecnológico

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Server Actions, TypeScript
- **Database:** Supabase PostgreSQL + Row-Level Security
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Jobs:** Trigger.dev
- **Payments:** Stripe
- **Email:** Resend

---

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Copiar .env.example a .env.local y configurar variables
cp .env.example .env.local

# Ejecutar migraciones de base de datos (Supabase)
# Ver db/schema.sql

# Correr dev server
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Estructura del Proyecto

```
crm-ai-native/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Rutas principales protegidas
│   └── api/               # API routes
├── components/            # Componentes compartidos
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Shell, nav, sidebar
│   └── forms/            # Formularios reutilizables
├── features/             # Módulos por feature
│   ├── contacts/
│   ├── companies/
│   ├── deals/
│   └── tasks/
├── lib/                  # Librerías core
│   ├── supabase/
│   └── utils.ts
├── services/             # Lógica de negocio
├── db/                   # Database schema & migrations
├── types/                # TypeScript types globales
├── config/               # Configuración
└── jobs/                 # Trigger.dev jobs
```

---

## 🎯 Features MVP

**Core Entities:**
- ✅ Contacts (CRUD completo)
- ✅ Companies (CRUD completo)
- ✅ Deals (Kanban + Table view)
- ✅ Tasks & Activities
- ✅ Notes

**Pipeline:**
- ✅ Pipeline configurable
- ✅ Drag & drop stages
- ✅ Deal detail con timeline

**Dashboard:**
- ✅ KPIs en tiempo real
- ✅ Tasks widget
- ✅ Pipeline overview
- ✅ Recent activity

**Admin:**
- ✅ Multi-tenant workspace
- ✅ User management
- ✅ Role-based permissions
- ✅ Data import (CSV, Excel, Access)
- ✅ Audit logs

---

## 🗺️ Roadmap

### V1 (MVP - 12 semanas)
- [x] Project setup
- [x] Auth flow
- [ ] Core entities (Contacts, Companies, Deals)
- [ ] Tasks & Activities
- [ ] Dashboard
- [ ] Import/Export
- [ ] Reports básicos
- [ ] Beta testing

### V2 (Post-MVP - 8 semanas)
- [ ] Custom fields
- [ ] Leads module
- [ ] Email sync
- [ ] Calendar sync
- [ ] Automation engine
- [ ] Multiple pipelines
- [ ] Tickets/Support
- [ ] Products & Quotes
- [ ] Mobile app

---

## 🔐 Seguridad & Compliance

- **Multi-tenancy:** Cada workspace tiene datos completamente aislados
- **RLS (Row-Level Security):** Políticas de seguridad a nivel de base de datos
- **RBAC:** Roles (Owner, Admin, Manager, Rep, Read-Only)
- **Audit Logs:** Todas las acciones importantes trackeadas
- **GDPR:** Arquitectura preparada para exportación y eliminación de datos
- **Encryption:** Secrets encriptados, HTTPS everywhere

---

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Linting
npm run lint
```

---

## 📝 License

MIT License - Ver [LICENSE](LICENSE)

---

## 🤝 Contributing

Este es un proyecto en desarrollo activo. Contribuciones bienvenidas.

---

**Built with ❤️ for SMEs que merecen mejor software**
