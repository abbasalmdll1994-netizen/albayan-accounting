create table public.albayan_cloud_snapshots (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 10000000),
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now()
);
alter table public.albayan_cloud_snapshots enable row level security;
revoke all on public.albayan_cloud_snapshots from anon;
grant select, insert, update on public.albayan_cloud_snapshots to authenticated;
create policy own_snapshot_select on public.albayan_cloud_snapshots for select to authenticated using ((select auth.uid()) = user_id);
create policy own_snapshot_insert on public.albayan_cloud_snapshots for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_snapshot_update on public.albayan_cloud_snapshots for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create function public.albayan_save_snapshot(expected_revision bigint, document jsonb)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare next_revision bigint;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if expected_revision = 0 then
  insert into public.albayan_cloud_snapshots(user_id,payload) values(auth.uid(),document)
  on conflict (user_id) do nothing returning revision into next_revision;
 else
  update public.albayan_cloud_snapshots set payload=document,revision=revision+1,updated_at=now()
  where user_id=auth.uid() and revision=expected_revision returning revision into next_revision;
 end if;
 if next_revision is null then raise exception 'CLOUD_CONFLICT' using errcode='40001'; end if;
 return next_revision;
end $$;
revoke all on function public.albayan_save_snapshot(bigint,jsonb) from public,anon;
grant execute on function public.albayan_save_snapshot(bigint,jsonb) to authenticated;


-- Internal DDL trigger must not be exposed as a client RPC.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
