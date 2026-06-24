-- ════════════════════════════════════════════════════════════════════════════
-- APLICAR EN: Supabase Studio → SQL Editor → New query → pegar todo → Run
-- Proyecto: viupowwpfrkumdvapjdq.supabase.co
-- ════════════════════════════════════════════════════════════════════════════
-- Dos cambios en uno:
--   1. Fix RLS para que los invitados puedan leer/aceptar su invitación.
--   2. Habilitar Realtime en companies/deals/contacts/activities para que los
--      usuarios del mismo workspace vean los cambios al instante.
-- ════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 1. Migration 012 — Invitations RLS fix
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invitations'
      AND policyname = 'Users can view their own invitations'
  ) THEN
    CREATE POLICY "Users can view their own invitations" ON public.invitations
      FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invitations'
      AND policyname = 'Users can accept their own invitations'
  ) THEN
    CREATE POLICY "Users can accept their own invitations" ON public.invitations
      FOR UPDATE USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND status = 'pending'
      );
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 2. Migration 013 — Habilitar Realtime
-- ──────────────────────────────────────────────────────────────
-- Para cada tabla, añadir al publication solo si todavía no está.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'companies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'deals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'contacts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
-- Verificación rápida (deberías ver 4 filas con las tablas)
-- ──────────────────────────────────────────────────────────────
SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
  AND tablename IN ('companies', 'deals', 'contacts', 'activities')
ORDER BY tablename;
