-- Change default subscription_status for new signups from 'trialing' to 'inactive'
-- New users must be activated by admin before accessing the CRM

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
  new_pipeline_id UUID;
  user_name TEXT;
BEGIN
  -- Get user name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- 1. Create user profile
  INSERT INTO public.users (id, full_name)
  VALUES (NEW.id, user_name)
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create workspace as INACTIVE (admin must activate)
  INSERT INTO public.workspaces (name, slug, plan_id, subscription_status, subscription_tier)
  VALUES (
    user_name || '''s Workspace',
    lower(replace(replace(user_name, ' ', '-'), '''', '')) || '-' || substr(NEW.id::text, 1, 8),
    'starter',
    'inactive',
    'starter'
  )
  RETURNING id INTO new_workspace_id;

  -- 3. Create membership (owner role)
  INSERT INTO public.memberships (user_id, workspace_id, role)
  VALUES (NEW.id, new_workspace_id, 'owner');

  -- 4. Create default pipeline
  INSERT INTO public.pipelines (workspace_id, name, is_default)
  VALUES (new_workspace_id, 'Pipeline Principal', true)
  RETURNING id INTO new_pipeline_id;

  -- 5. Create default stages
  INSERT INTO public.stages (pipeline_id, name, description, probability, position, is_closed_won, is_closed_lost) VALUES
    (new_pipeline_id, 'Prospecto',     'Oportunidad identificada',           10, 0, false, false),
    (new_pipeline_id, 'Contactado',    'Primer contacto realizado',          20, 1, false, false),
    (new_pipeline_id, 'Cualificado',   'Necesidades confirmadas',            40, 2, false, false),
    (new_pipeline_id, 'Propuesta',     'Propuesta enviada al cliente',       60, 3, false, false),
    (new_pipeline_id, 'Negociacion',   'En proceso de negociacion',          80, 4, false, false),
    (new_pipeline_id, 'Ganado',        'Deal cerrado con exito',            100, 5, true,  false),
    (new_pipeline_id, 'Perdido',       'Deal no conseguido',                  0, 6, false, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
