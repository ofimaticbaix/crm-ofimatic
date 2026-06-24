-- Habilita Supabase Realtime sobre las tablas que la UI consume mediante
-- los hooks compartidos (useAllCompanies / useAllDeals / useAllContacts /
-- useAllActivities). Permite que cuando un usuario modifica un registro,
-- los demás miembros del workspace vean el cambio sin refrescar.

ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
