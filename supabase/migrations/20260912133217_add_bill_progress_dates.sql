-- Civil dates are entered per bill; progress status remains separately verified.
alter table public.bills
  add column introduction_date date,
  add column plenary_question_date date,
  add column committee_question_date date,
  add column vote_date date;

comment on column public.bills.introduction_date is '上程日（予定を含む）';
comment on column public.bills.plenary_question_date is '本会議の議案質疑日（予定を含む）';
comment on column public.bills.committee_question_date is '当該議案の委員会質疑日（予定を含む）';
comment on column public.bills.vote_date is '本会議の採決日（予定を含む）。採決済みかはstatusで判断する';
alter table public.bills enable row level security;
