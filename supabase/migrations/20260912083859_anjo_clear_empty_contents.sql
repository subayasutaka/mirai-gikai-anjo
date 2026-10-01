-- One transaction keeps both reading levels and approved AI sources in sync.
CREATE OR REPLACE FUNCTION public.save_anjo_bill_contents(p_bill_id uuid,p_normal jsonb,p_hard jsonb,p_knowledge_source text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE level public.difficulty_level_enum; item jsonb;
BEGIN
  PERFORM 1 FROM public.bills WHERE id=p_bill_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'bill_not_found'; END IF;
  FOREACH level IN ARRAY ARRAY['normal','hard']::public.difficulty_level_enum[] LOOP
    item := CASE WHEN level='normal' THEN p_normal ELSE p_hard END;
      INSERT INTO public.bill_contents(bill_id,difficulty_level,title,summary,content,updated_at)
      VALUES(p_bill_id,level,coalesce(item->>'title',''),coalesce(item->>'summary',''),coalesce(item->>'content',''),now())
      ON CONFLICT(bill_id,difficulty_level) DO UPDATE SET title=excluded.title,summary=excluded.summary,content=excluded.content,updated_at=excluded.updated_at;
  END LOOP;
  UPDATE public.bills SET knowledge_source=p_knowledge_source,is_review_completed=false,updated_at=now() WHERE id=p_bill_id;
END;
$$;
REVOKE ALL ON FUNCTION public.save_anjo_bill_contents(uuid,jsonb,jsonb,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_anjo_bill_contents(uuid,jsonb,jsonb,text) TO service_role;
