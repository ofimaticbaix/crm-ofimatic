-- Change default subscription_status for new signups from 'trialing' to 'inactive'
-- New users must be activated by admin before accessing the CRM

-- Update the handle_new_user function to set inactive by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Insert into public users table
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Create workspace
  new_workspace_id := gen_random_uuid();
  INSERT INTO public.workspaces (id, name, slug, owner_id, subscription_status, plan_id)
  VALUES (
    new_workspace_id,
    COALESCE(NEW.raw_user_meta_data->>'company', split_part(NEW.email, '@', 1) || '''s workspace'),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'company', split_part(NEW.email, '@', 1)), ' ', '-')) || '-' || SUBSTRING(new_workspace_id::text, 1, 8),
    NEW.id,
    'inactive',
    'starter'
  );

  -- Create membership
  INSERT INTO public.memberships (user_id, workspace_id, role)
  VALUES (NEW.id, new_workspace_id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
