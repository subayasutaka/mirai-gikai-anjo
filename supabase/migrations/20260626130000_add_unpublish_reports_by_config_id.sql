-- インタビュー設定の論理削除に伴い、配下レポートを一括で公開停止するRPC関数
-- 設定削除時に呼び出し、対象configのセッションに紐づく公開レポートの
-- is_public_by_admin を false にする。
-- アプリ層でセッションIDを取得して .in() で更新する方式は PostgREST の
-- 行数上限（既定1000件）に引っかかるため、DB側の UPDATE ... FROM で一括更新する。
create or replace function unpublish_reports_by_config_id(p_config_id uuid)
returns void
language sql
as $$
  update interview_report r
  set is_public_by_admin = false
  from interview_sessions s
  where r.interview_session_id = s.id
    and s.interview_config_id = p_config_id
    and r.is_public_by_admin = true;
$$;

-- Anjo pilot: deny direct API execution of the functions defined above.
-- Preserve access only for trusted server-side service_role calls.
DO $anjo$
DECLARE target regprocedure;
BEGIN
  FOR target IN SELECT p.oid::regprocedure FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('unpublish_reports_by_config_id')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', target);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', target);
  END LOOP;
END $anjo$;
