-- 管理者がレポートを非公開にした判断を記録するカラム。
-- これまで is_public_by_admin = false は「まだ公開されていない」と
-- 「管理者が非公開にした」を区別できず、ユーザー操作（レポートの公開設定変更）に
-- 伴う自動公開が管理者の非公開判断を上書きできてしまっていた。
-- NULL = 管理者による非公開操作なし（従来どおり自動公開の対象）。
ALTER TABLE interview_report
  ADD COLUMN admin_unpublished_at TIMESTAMPTZ;

COMMENT ON COLUMN interview_report.admin_unpublished_at IS '管理者がレポートを非公開にした時刻（NULL=管理者による非公開操作なし）。NULL でない場合はユーザー操作による自動公開の対象外';

-- Anjo: this new project has no interview data (verified before setup).
-- Keep the upstream schema shape for generated types, without migrating data
-- or redefining unused interview mutation functions.
