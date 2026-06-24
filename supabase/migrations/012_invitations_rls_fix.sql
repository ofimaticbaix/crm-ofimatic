-- Fix RLS chicken-and-egg: a user receiving an invitation could not read it
-- via the public acceptInvitation flow because the existing SELECT policy
-- only allowed members of the workspace to read invitations.
--
-- New rule: a user can also read invitations addressed to their own email,
-- which is what the /invite/{token} acceptance page needs.

CREATE POLICY "Users can view their own invitations" ON public.invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Also allow the user to update only their own invitation when accepting
-- (so the existing UPDATE policy that requires owner/admin doesn't block them).
CREATE POLICY "Users can accept their own invitations" ON public.invitations
  FOR UPDATE USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
  );
