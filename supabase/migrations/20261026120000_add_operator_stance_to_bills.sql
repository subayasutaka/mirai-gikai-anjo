-- 運営者すば康貴の賛否と理由（議案ページの「すば康貴の賛否と理由」欄）を、説明文とは別の項目で持つ。
alter table public.bills
  add column operator_vote text,
  add column operator_reasons text,
  add column operator_stance_written_on date;

alter table public.bills
  add constraint bills_operator_vote_check
    check (
      operator_vote is null
      or operator_vote in ('for', 'against', 'absent', 'left', 'chair')
    ),
  add constraint bills_operator_stance_complete_check
    check (
      (operator_vote is null and operator_reasons is null and operator_stance_written_on is null)
      or (operator_vote is not null and operator_stance_written_on is not null)
    );

comment on column public.bills.operator_vote is '運営者すば康貴の表決（for=賛成・同意, against=反対・不同意, absent=欠席, left=退席, chair=議長として不参加）。公式の議決結果と同じものだけを入れる';
comment on column public.bills.operator_reasons is '運営者すば康貴の理由。1行に1つ、3つまで。欠席・退席ではその理由';
comment on column public.bills.operator_stance_written_on is '運営者が賛否と理由を書いた日';

alter table public.bills enable row level security;
