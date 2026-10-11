create or replace function public.sum_chat_usage_cost(
  from_iso timestamptz,
  to_iso timestamptz
)
returns numeric(12, 6)
language sql
stable
as $$
  select coalesce(sum(cost_usd), 0)
  from public.chat_usage_events
  where occurred_at >= from_iso
    and occurred_at < to_iso;
$$;

revoke execute on function public.sum_chat_usage_cost(timestamptz, timestamptz) from public;
revoke execute on function public.sum_chat_usage_cost(timestamptz, timestamptz) from anon;
revoke execute on function public.sum_chat_usage_cost(timestamptz, timestamptz) from authenticated;
grant execute on function public.sum_chat_usage_cost(timestamptz, timestamptz) to service_role;

-- Anjo pilot: deny direct API execution of the functions defined above.
-- Preserve access only for trusted server-side service_role calls.
DO $anjo$
DECLARE target regprocedure;
BEGIN
  FOR target IN SELECT p.oid::regprocedure FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('sum_chat_usage_cost')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', target);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', target);
  END LOOP;
END $anjo$;
