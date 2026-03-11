-- =================================================
-- AUTO-SETUP: Crear perfil y workspace al registrarse
-- =================================================
-- Ejecutar DESPUÉS de schema.sql

-- Función que crea el perfil de usuario, workspace y membership automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
  new_pipeline_id UUID;
BEGIN
  -- 1. Crear perfil en public.users
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );

  -- 2. Crear workspace por defecto
  INSERT INTO public.workspaces (id, name, slug, subscription_status, trial_ends_at)
  VALUES (
    uuid_generate_v4(),
    'Mi Empresa',
    'workspace-' || substr(NEW.id::text, 1, 8),
    'trial',
    now() + interval '14 days'
  )
  RETURNING id INTO new_workspace_id;

  -- 3. Crear membership como owner
  INSERT INTO public.memberships (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'owner');

  -- 4. Crear pipeline por defecto
  INSERT INTO public.pipelines (id, workspace_id, name, description, is_default, position)
  VALUES (uuid_generate_v4(), new_workspace_id, 'Pipeline Principal', 'Pipeline de ventas por defecto', true, 0)
  RETURNING id INTO new_pipeline_id;

  -- 5. Crear stages por defecto
  INSERT INTO public.stages (pipeline_id, name, probability, position, is_closed_won, is_closed_lost) VALUES
    (new_pipeline_id, 'Prospección', 10, 0, false, false),
    (new_pipeline_id, 'Calificación', 30, 1, false, false),
    (new_pipeline_id, 'Propuesta', 50, 2, false, false),
    (new_pipeline_id, 'Negociación', 75, 3, false, false),
    (new_pipeline_id, 'Ganado', 100, 4, true, false),
    (new_pipeline_id, 'Perdido', 0, 5, false, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: ejecutar al crear usuario en auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================
-- RLS POLICIES para todas las tablas
-- =================================================

-- Helper (ya debería existir del schema)
CREATE OR REPLACE FUNCTION user_workspaces()
RETURNS SETOF UUID AS $$
  SELECT workspace_id FROM memberships WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- WORKSPACES
CREATE POLICY "Users can view own workspaces" ON workspaces
  FOR SELECT USING (id IN (SELECT user_workspaces()));

-- USERS
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- MEMBERSHIPS
CREATE POLICY "Users can view memberships in own workspaces" ON memberships
  FOR SELECT USING (workspace_id IN (SELECT user_workspaces()));

-- COMPANIES
CREATE POLICY "Users can view companies" ON companies
  FOR SELECT USING (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can insert companies" ON companies
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can update companies" ON companies
  FOR UPDATE USING (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can delete companies" ON companies
  FOR DELETE USING (workspace_id IN (SELECT user_workspaces()));

-- DEALS
CREATE POLICY "Users can view deals" ON deals
  FOR SELECT USING (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can insert deals" ON deals
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can update deals" ON deals
  FOR UPDATE USING (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can delete deals" ON deals
  FOR DELETE USING (workspace_id IN (SELECT user_workspaces()));

-- PIPELINES
CREATE POLICY "Users can view pipelines" ON pipelines
  FOR SELECT USING (workspace_id IN (SELECT user_workspaces()));

-- STAGES
CREATE POLICY "Users can view stages" ON stages
  FOR SELECT USING (pipeline_id IN (
    SELECT id FROM pipelines WHERE workspace_id IN (SELECT user_workspaces())
  ));

-- DEAL_CONTACTS
CREATE POLICY "Users can view deal_contacts" ON deal_contacts
  FOR SELECT USING (deal_id IN (
    SELECT id FROM deals WHERE workspace_id IN (SELECT user_workspaces())
  ));
CREATE POLICY "Users can insert deal_contacts" ON deal_contacts
  FOR INSERT WITH CHECK (deal_id IN (
    SELECT id FROM deals WHERE workspace_id IN (SELECT user_workspaces())
  ));
CREATE POLICY "Users can delete deal_contacts" ON deal_contacts
  FOR DELETE USING (deal_id IN (
    SELECT id FROM deals WHERE workspace_id IN (SELECT user_workspaces())
  ));

-- ACTIVITIES
CREATE POLICY "Users can view activities" ON activities
  FOR SELECT USING (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can insert activities" ON activities
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can update activities" ON activities
  FOR UPDATE USING (workspace_id IN (SELECT user_workspaces()));

-- NOTES
CREATE POLICY "Users can view notes" ON notes
  FOR SELECT USING (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can insert notes" ON notes
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can update notes" ON notes
  FOR UPDATE USING (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can delete notes" ON notes
  FOR DELETE USING (workspace_id IN (SELECT user_workspaces()));

-- TAGS
CREATE POLICY "Users can view tags" ON tags
  FOR SELECT USING (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can insert tags" ON tags
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can delete tags" ON tags
  FOR DELETE USING (workspace_id IN (SELECT user_workspaces()));

-- TAGGABLES
CREATE POLICY "Users can view taggables" ON taggables
  FOR SELECT USING (tag_id IN (
    SELECT id FROM tags WHERE workspace_id IN (SELECT user_workspaces())
  ));

-- ATTACHMENTS
CREATE POLICY "Users can view attachments" ON attachments
  FOR SELECT USING (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can insert attachments" ON attachments
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspaces()));

-- AUDIT LOGS
CREATE POLICY "Users can view audit logs" ON audit_logs
  FOR SELECT USING (workspace_id IN (SELECT user_workspaces()));

-- IMPORT JOBS
CREATE POLICY "Users can view import jobs" ON import_jobs
  FOR SELECT USING (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can insert import jobs" ON import_jobs
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspaces()));

-- INVOICES
CREATE POLICY "Users can view invoices" ON invoices
  FOR SELECT USING (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can insert invoices" ON invoices
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can update invoices" ON invoices
  FOR UPDATE USING (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can delete invoices" ON invoices
  FOR DELETE USING (workspace_id IN (SELECT user_workspaces()));

-- IMPORT PROFILES
CREATE POLICY "Users can view import profiles" ON import_profiles
  FOR SELECT USING (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can insert import profiles" ON import_profiles
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspaces()));
CREATE POLICY "Users can update import profiles" ON import_profiles
  FOR UPDATE USING (workspace_id IN (SELECT user_workspaces()));
