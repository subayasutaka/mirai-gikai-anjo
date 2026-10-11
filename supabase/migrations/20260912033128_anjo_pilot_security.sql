-- Anjo local council and explicit owner administration.
ALTER TYPE public.house_enum ADD VALUE IF NOT EXISTS 'ANJO';

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid()
    AND raw_app_meta_data -> 'roles' @> '["admin"]'::jsonb
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- No question/answer text or raw client addresses are stored here.
CREATE TABLE public.anjo_ai_usage (
  id uuid PRIMARY KEY,
  bill_id uuid REFERENCES public.bills(id) ON DELETE SET NULL,
  client_hash text NOT NULL,
  model text NOT NULL DEFAULT 'alibaba/qwen3.8-flash',
  created_at timestamptz NOT NULL DEFAULT now(),
  state text NOT NULL DEFAULT 'reserved' CHECK (state IN ('reserved','completed','failed')),
  reserved_usd numeric(10,6) NOT NULL DEFAULT 0.01 CHECK (reserved_usd = 0.01),
  actual_usd numeric(10,6),
  input_tokens integer,
  output_tokens integer,
  duration_ms integer
);
CREATE INDEX anjo_ai_usage_created_at ON public.anjo_ai_usage(created_at);
CREATE INDEX anjo_ai_usage_client_time ON public.anjo_ai_usage(client_hash,created_at);
ALTER TABLE public.anjo_ai_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.anjo_ai_usage FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anjo_ai_usage TO service_role;

-- Atomic reservations: <= $0.10/day and $1/month (JST), including failed calls.
-- Limits are deliberately conservative; failures never return reservation budget.
CREATE FUNCTION public.reserve_anjo_ai_request(p_id uuid,p_bill_id uuid,p_client_hash text)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE day_start timestamptz; month_start timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(721605912);
  day_start := date_trunc('day', now() AT TIME ZONE 'Asia/Tokyo') AT TIME ZONE 'Asia/Tokyo';
  month_start := date_trunc('month', now() AT TIME ZONE 'Asia/Tokyo') AT TIME ZONE 'Asia/Tokyo';
  IF NOT EXISTS (SELECT 1 FROM public.bills WHERE id=p_bill_id AND publish_status='published' AND use_knowledge_source_in_chat=true) THEN
    RETURN 'unavailable';
  END IF;
  IF EXISTS (SELECT 1 FROM public.anjo_ai_usage WHERE id=p_id) THEN RETURN 'duplicate'; END IF;
  IF length(p_client_hash) <> 64 THEN RETURN 'invalid'; END IF;
  IF (SELECT count(*) FROM public.anjo_ai_usage WHERE client_hash=p_client_hash AND created_at>now()-interval '1 minute') >= 3 THEN RETURN 'rate_limit'; END IF;
  IF (SELECT coalesce(sum(reserved_usd),0) FROM public.anjo_ai_usage WHERE created_at>=day_start) + 0.01 > 0.10 THEN RETURN 'daily_limit'; END IF;
  IF (SELECT coalesce(sum(reserved_usd),0) FROM public.anjo_ai_usage WHERE created_at>=month_start) + 0.01 > 1 THEN RETURN 'monthly_limit'; END IF;
  INSERT INTO public.anjo_ai_usage(id,bill_id,client_hash) VALUES(p_id,p_bill_id,p_client_hash);
  RETURN 'allowed';
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_anjo_ai_request(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_anjo_ai_request(uuid,uuid,text) TO service_role;
