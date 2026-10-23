-- Run AFTER schema.sql and seed.sql. Two things the app needs.

-- 1) Create a profile row automatically whenever someone signs up.
--    (enrollments and progress point at profiles, so without this, enrolling fails.)
create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 2) A safe "outline" of lessons: titles and order only, NO content or video.
--    The course page uses it to show the full curriculum (including locked
--    lessons) without exposing paid material. Views run with the owner's rights,
--    so this works even though the lessons table itself is protected.
create or replace view lesson_outline as
  select id, module_id, position, title, is_preview
  from lessons;

grant select on lesson_outline to anon, authenticated;
