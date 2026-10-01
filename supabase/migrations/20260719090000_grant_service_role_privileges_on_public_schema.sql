-- Anjo pilot: grant only the tables used by the authorized bill editor and reader.
-- The database was empty at setup; there is no existing deployed application.
-- Do not enable data access for unused interview or opinion-collection features.
GRANT USAGE ON SCHEMA public TO service_role;
REVOKE ALL ON TABLE public.bills, public.bill_contents, public.bills_tags,
  public.tags, public.diet_sessions, public.preview_tokens
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.bills, public.bill_contents, public.bills_tags,
  public.tags, public.diet_sessions, public.preview_tokens TO service_role;
GRANT EXECUTE ON FUNCTION public.set_active_diet_session(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
