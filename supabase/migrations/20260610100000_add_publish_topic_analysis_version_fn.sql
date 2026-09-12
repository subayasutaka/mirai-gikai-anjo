-- version の公開切替を「旧公開版を降ろす → 対象を公開」を1トランザクションで行う関数。
-- アプリ層で2回 update（各 auto-commit）すると、その間に公開版が0件の瞬間が
-- 外部トランザクションから見えてしまい、公開読み取りが一時的に404（準備中）になる。
-- 関数内（単一トランザクション）で実行することで、外部からは旧公開→新公開へ
-- アトミックに切り替わって見える（中間状態は不可視）。one_published_per_bill も満たす。
CREATE OR REPLACE FUNCTION publish_topic_analysis_version(p_version_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Topic publication is disabled in the Anjo pilot';
END;
$$;

-- Anjo pilot: deny direct API execution of the functions defined above.
-- Preserve access only for trusted server-side service_role calls.
DO $anjo$
DECLARE target regprocedure;
BEGIN
  FOR target IN SELECT p.oid::regprocedure FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('publish_topic_analysis_version')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', target);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', target);
  END LOOP;
END $anjo$;
