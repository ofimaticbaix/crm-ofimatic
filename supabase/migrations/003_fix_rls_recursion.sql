-- ============================================================
-- FIX: Infinite recursion in memberships RLS policies
-- ============================================================
-- The memberships policies were using get_my_workspace_ids() which
-- queries memberships itself, causing infinite recursion.
-- Fix: use auth.uid() directly on memberships policies.
-- ============================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view memberships of their workspaces" ON public.memberships;
DROP POLICY IF EXISTS "Admins can manage memberships" ON public.memberships;

-- New memberships policies that DON'T reference memberships (no recursion)
CREATE POLICY "Users can view own memberships" ON public.memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can insert memberships" ON public.memberships
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT m.workspace_id FROM public.memberships m
      WHERE m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update memberships" ON public.memberships
  FOR UPDATE USING (
    workspace_id IN (
      SELECT m.workspace_id FROM public.memberships m
      WHERE m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete memberships" ON public.memberships
  FOR DELETE USING (
    workspace_id IN (
      SELECT m.workspace_id FROM public.memberships m
      WHERE m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
    )
  );

-- Also fix get_my_workspace_ids to bypass RLS (it already has SECURITY DEFINER but let's be safe)
CREATE OR REPLACE FUNCTION public.get_my_workspace_ids()
RETURNS SETOF UUID AS $$
  SELECT workspace_id FROM public.memberships WHERE user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;
