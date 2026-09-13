-- レポート一括公開: 対象件数カウントと一括更新のDB関数

-- 対象件数カウント
create function count_bulk_publish_targets(
  p_config_id uuid,
  p_max_moderation_score integer,
  p_min_content_richness integer
) returns bigint as $$
  select count(*)
  from interview_report r
  join interview_sessions s on s.id = r.interview_session_id
  where s.interview_config_id = p_config_id
    and r.is_public_by_user = true
    and r.is_public_by_admin = false
    and r.moderation_score is not null
    and r.moderation_score <= p_max_moderation_score
    and r.total_content_richness is not null
    and r.total_content_richness >= p_min_content_richness;
$$ language sql stable;

-- 一括公開実行（更新件数を返す）
create function bulk_publish_reports(
  p_config_id uuid,
  p_max_moderation_score integer,
  p_min_content_richness integer
) returns bigint as $$
  select 0::bigint; -- Anjo pilot: interview publication is disabled.
$$ language sql volatile;

-- Anjo pilot: deny direct API execution of the functions defined above.
-- Preserve access only for trusted server-side service_role calls.
DO $anjo$
DECLARE target regprocedure;
BEGIN
  FOR target IN SELECT p.oid::regprocedure FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('bulk_publish_reports','count_bulk_publish_targets')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', target);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', target);
  END LOOP;
END $anjo$;
