-- Run after your original schema.sql
-- Adds the signup profile trigger and RLS policies required by the complete app.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin
 insert into public.profiles (id,name,email,role,club) values (new.id,coalesce(new.raw_user_meta_data->>'name',split_part(new.email,'@',1)),new.email,coalesce(new.raw_user_meta_data->>'role','driver'),new.raw_user_meta_data->>'club') on conflict (id) do nothing;
 insert into public.drivers (profile_id,bio,experience,classes) values (new.id,coalesce(new.raw_user_meta_data->>'bio',''),coalesce(new.raw_user_meta_data->>'experience','Intermediate'),case when coalesce(new.raw_user_meta_data->>'classes','')='' then array[]::text[] else string_to_array(new.raw_user_meta_data->>'classes',',') end) on conflict (profile_id) do nothing;
 return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
-- These policies assume the table names/columns from the original project schema.
alter table public.profiles enable row level security; alter table public.drivers enable row level security; alter table public.driver_availability enable row level security; alter table public.teams enable row level security; alter table public.contact_requests enable row level security;
drop policy if exists "public profiles" on public.profiles;create policy "public profiles" on public.profiles for select using (true);
drop policy if exists "own profile update" on public.profiles;create policy "own profile update" on public.profiles for update using (auth.uid()=id) with check (auth.uid()=id);
drop policy if exists "public drivers" on public.drivers;create policy "public drivers" on public.drivers for select using (true);
drop policy if exists "own driver write" on public.drivers;create policy "own driver write" on public.drivers for all using (auth.uid()=profile_id) with check (auth.uid()=profile_id);
drop policy if exists "public availability" on public.driver_availability;create policy "public availability" on public.driver_availability for select using (true);
drop policy if exists "own availability" on public.driver_availability;create policy "own availability" on public.driver_availability for all using (auth.uid()=driver_id) with check (auth.uid()=driver_id);
drop policy if exists "public teams" on public.teams;create policy "public teams" on public.teams for select using (true);
drop policy if exists "own team write" on public.teams;create policy "own team write" on public.teams for all using (auth.uid()=manager_id) with check (auth.uid()=manager_id);
drop policy if exists "driver reads contacts" on public.contact_requests;create policy "driver reads contacts" on public.contact_requests for select using (auth.uid()=driver_id or exists(select 1 from public.teams t where t.id=contact_requests.team_id and t.manager_id=auth.uid()));
drop policy if exists "manager sends contacts" on public.contact_requests;create policy "manager sends contacts" on public.contact_requests for insert with check (exists(select 1 from public.teams t where t.id=contact_requests.team_id and t.manager_id=auth.uid()));
-- Promote your account after registering:
-- update public.profiles set role='admin' where email='YOUR_EMAIL';
