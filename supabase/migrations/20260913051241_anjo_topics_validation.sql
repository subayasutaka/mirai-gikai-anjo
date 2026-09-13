alter table public.anjo_topics add constraint anjo_topics_content_version check (content @> '{"version":1}'::jsonb);

create or replace function public.save_anjo_topic(
  p_id uuid, p_session_id uuid, p_content jsonb, p_bill_ids uuid[],
  p_publish_status text, p_reviewed boolean, p_sort_order integer,
  p_expected_updated_at timestamptz default null
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
