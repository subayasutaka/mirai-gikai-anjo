-- One explanation of a change, linked to every formal bill that contains it.
-- The versioned JSON document is validated by the shared application schema.
create table public.anjo_topics (
  id uuid primary key default gen_random_uuid(),
  diet_session_id uuid not null references public.diet_sessions(id),
  content jsonb not null check (jsonb_typeof(content) = 'object' and content->>'version' = '1'),
  publish_status text not null default 'draft' check (publish_status in ('draft', 'published')),
  is_review_completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index anjo_topics_session_order_idx on public.anjo_topics(diet_session_id, sort_order, id);
alter table public.anjo_topics enable row level security;
revoke all on public.anjo_topics from public, anon, authenticated;
grant select, insert, update, delete on public.anjo_topics to service_role;

create table public.anjo_topic_bills (
  topic_id uuid not null references public.anjo_topics(id) on delete cascade,
  bill_id uuid not null references public.bills(id) on delete restrict,
  primary key (topic_id, bill_id)
);
create index anjo_topic_bills_bill_idx on public.anjo_topic_bills(bill_id);
alter table public.anjo_topic_bills enable row level security;
revoke all on public.anjo_topic_bills from public, anon, authenticated;
grant select, insert, update, delete on public.anjo_topic_bills to service_role;

-- Save content and relationships atomically, with protection against stale edits.
create function public.save_anjo_topic(
  p_id uuid, p_session_id uuid, p_content jsonb, p_bill_ids uuid[],
  p_publish_status text, p_reviewed boolean, p_sort_order integer,
  p_expected_updated_at timestamptz
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  current_version timestamptz;
begin
  if coalesce(cardinality(p_bill_ids), 0) = 0 or cardinality(p_bill_ids) > 20 then
    raise exception 'invalid_bill_links';
  end if;
  -- Lock referenced bills so publication/session edits cannot race validation.
  perform id from public.bills where id = any(p_bill_ids) for share;
  if (select count(*) from public.bills where id = any(p_bill_ids)
      and diet_session_id = p_session_id
      and (p_publish_status = 'draft' or publish_status = 'published'))
      <> cardinality(p_bill_ids) then
    raise exception 'invalid_bill_links';
  end if;
  select updated_at into current_version from public.anjo_topics where id = p_id for update;
  if found then
    if p_expected_updated_at is distinct from current_version then
      raise exception 'stale_topic';
    end if;
    update public.anjo_topics set diet_session_id = p_session_id,
      content = p_content, publish_status = p_publish_status,
      is_review_completed = p_reviewed, sort_order = p_sort_order,
      updated_at = clock_timestamp() where id = p_id;
  else
    if p_expected_updated_at is not null then raise exception 'stale_topic'; end if;
    insert into public.anjo_topics(id, diet_session_id, content, publish_status, is_review_completed, sort_order)
      values(p_id, p_session_id, p_content, p_publish_status, p_reviewed, p_sort_order);
  end if;
  delete from public.anjo_topic_bills where topic_id = p_id;
  insert into public.anjo_topic_bills(topic_id, bill_id) select p_id, unnest(p_bill_ids);
  return p_id;
end;
$$;
revoke all on function public.save_anjo_topic(uuid,uuid,jsonb,uuid[],text,boolean,integer,timestamptz) from public, anon, authenticated;
grant execute on function public.save_anjo_topic(uuid,uuid,jsonb,uuid[],text,boolean,integer,timestamptz) to service_role;
