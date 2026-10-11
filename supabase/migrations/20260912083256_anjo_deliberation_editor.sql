DROP FUNCTION public.reserve_anjo_ai_request(uuid,uuid,text);
CREATE FUNCTION public.reserve_anjo_ai_request(p_id uuid,p_bill_id uuid,p_client_hash text,p_allow_draft boolean DEFAULT false)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE day_start timestamptz; month_start timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(721605912);
  day_start := date_trunc('day', now() AT TIME ZONE 'Asia/Tokyo') AT TIME ZONE 'Asia/Tokyo';
  month_start := date_trunc('month', now() AT TIME ZONE 'Asia/Tokyo') AT TIME ZONE 'Asia/Tokyo';
  IF NOT EXISTS (SELECT 1 FROM public.bills WHERE id=p_bill_id AND (p_allow_draft OR (publish_status='published' AND use_knowledge_source_in_chat=true))) THEN
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
REVOKE ALL ON FUNCTION public.reserve_anjo_ai_request(uuid,uuid,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_anjo_ai_request(uuid,uuid,text,boolean) TO service_role;

-- One transaction keeps both reading levels and approved AI sources in sync.
CREATE FUNCTION public.save_anjo_bill_contents(p_bill_id uuid,p_normal jsonb,p_hard jsonb,p_knowledge_source text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE level public.difficulty_level_enum; item jsonb;
BEGIN
  PERFORM 1 FROM public.bills WHERE id=p_bill_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'bill_not_found'; END IF;
  FOREACH level IN ARRAY ARRAY['normal','hard']::public.difficulty_level_enum[] LOOP
    item := CASE WHEN level='normal' THEN p_normal ELSE p_hard END;
    IF coalesce(item->>'title','') <> '' OR coalesce(item->>'summary','') <> '' OR coalesce(item->>'content','') <> '' THEN
      INSERT INTO public.bill_contents(bill_id,difficulty_level,title,summary,content,updated_at)
      VALUES(p_bill_id,level,coalesce(item->>'title',''),coalesce(item->>'summary',''),coalesce(item->>'content',''),now())
      ON CONFLICT(bill_id,difficulty_level) DO UPDATE SET title=excluded.title,summary=excluded.summary,content=excluded.content,updated_at=excluded.updated_at;
    END IF;
  END LOOP;
  UPDATE public.bills SET knowledge_source=p_knowledge_source,is_review_completed=false,updated_at=now() WHERE id=p_bill_id;
END;
$$;
REVOKE ALL ON FUNCTION public.save_anjo_bill_contents(uuid,jsonb,jsonb,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_anjo_bill_contents(uuid,jsonb,jsonb,text) TO service_role;
