-- 議案の進み方を、補足メモの文言ではなく明示的な項目で表す。
alter table public.bills
  add column plenary_no_questions boolean not null default false,
  add column committee_question_end_date date,
  add column committee_count smallint;

alter table public.bills
  add constraint bills_committee_count_check
    check (committee_count is null or committee_count between 2 and 10),
  add constraint bills_committee_question_range_check
    check (
      committee_question_end_date is null
      or (
        committee_question_date is not null
        and committee_question_end_date >= committee_question_date
      )
    );

comment on column public.bills.plenary_no_questions is '本会議の議案質疑で質問がなかったことを公式資料・中継で確認済みか';
comment on column public.bills.committee_question_end_date is '複数の委員会で分けて審査した場合の最終審査日';
comment on column public.bills.committee_count is '分けて付託・審査した委員会の数（2以上）';

alter table public.bills enable row level security;
