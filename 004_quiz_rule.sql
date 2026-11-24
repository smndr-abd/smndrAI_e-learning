-- 004: quiz retry rules. Run AFTER 003_quizzes.sql.
alter table quiz_attempts add column if not exists raw_score numeric;
alter table quiz_attempts add column if not exists penalty numeric not null default 0;
alter table quiz_attempts add column if not exists passed boolean not null default false;

-- Bring any old attempts in line with the new rules (pass mark 80).
update quiz_attempts set raw_score = score where raw_score is null;
update quiz_attempts set passed = (score >= 80);
