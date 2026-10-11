-- 委員会付託・審査の省略を、補足メモの文言ではなく明示的な項目で管理する。
alter table public.bills
  add column committee_omitted boolean not null default false;

comment on column public.bills.committee_omitted is '本会議で委員会付託・審査を省略したことを公式資料で確認済みか';

-- これまで補足メモの文言から省略と判定していた人事同意案を移行する。
update public.bills
set committee_omitted = true
where name ~ '^\s*同意第[0-9０-９]+号'
  and status_note ~ '(^|[。\n])\s*委員会(への)?(付託|審査)(を|は)?省略(しました|しています|した|することに決定しました)?([。\n]|$)';

alter table public.bills enable row level security;
