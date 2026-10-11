-- Anjo fork, 2026-09-12: the upstream Google Workspace auto-admin grant is
-- deliberately disabled. Administrators are assigned explicitly through Auth
-- Admin API. Keep the function signature for upstream compatibility only.
CREATE OR REPLACE FUNCTION public.apply_admin_role_if_eligible(target_user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT false; $$;
REVOKE ALL ON FUNCTION public.apply_admin_role_if_eligible(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_admin_role_if_eligible(uuid) TO service_role;

-- Anjo pilot: deny direct API execution of the functions defined above.
-- Preserve access only for trusted server-side service_role calls.
DO $anjo$
DECLARE target regprocedure;
BEGIN
  FOR target IN SELECT p.oid::regprocedure FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('apply_admin_role_if_eligible')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', target);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', target);
  END LOOP;
END $anjo$;
