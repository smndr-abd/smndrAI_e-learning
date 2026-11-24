-- 005: downloadable lesson files. Run after 004.

create table if not exists lesson_files (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  name text not null,
  storage_path text not null unique,
  size_bytes bigint,
  mime_type text,
  created_at timestamptz not null default now()
);
create index if not exists lesson_files_lesson_idx on lesson_files (lesson_id);

alter table lesson_files enable row level security;

-- A file is visible only if its lesson is a free preview or the student is enrolled.
-- (Uploads and deletes happen only on the server, with the admin key.)
drop policy if exists "read files if preview or enrolled" on lesson_files;
create policy "read files if preview or enrolled" on lesson_files
  for select using (
    exists (
      select 1
      from lessons l
      join modules m on m.id = l.module_id
      where l.id = lesson_id
        and (l.is_preview or is_enrolled(m.course_id))
    )
  );

-- Private storage bucket: nobody can open files by URL. Downloads go through
-- the site, which hands out links that expire after 60 seconds.
insert into storage.buckets (id, name, public, file_size_limit)
values ('course-files', 'course-files', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;