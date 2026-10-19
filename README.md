# AI Engineer Academy: starter app

Next.js 14 (App Router) + Supabase. Features: sign up / log in, course catalog,
curriculum page, free enrollment, protected lessons, progress tracking, dashboard.

## How the pieces fit (the "school" analogy)

| Part | Role in the school | Where |
|---|---|---|
| Supabase database | The filing cabinet (courses, students, progress) | `schema.sql`, `seed.sql`, `002_app_support.sql` |
| Row Level Security | The locked doors: the database itself refuses to hand over paid lessons | inside `schema.sql` |
| Next.js pages | The front desk and classrooms students see | `app/` |
| Server actions | Staff who do tasks on request (enroll, mark complete) | `app/courses/actions.ts`, `app/login/actions.ts` |
| Middleware | The security guard who checks your badge at the door | `middleware.ts` |

## Setup (macOS)

1. Install Node 18.18 or newer (`node -v` to check).
2. Create a free project at supabase.com. In **SQL Editor**, run these in order:
   `schema.sql`, `seed.sql`, `002_app_support.sql`.
3. In Supabase go to **Authentication > Providers > Email** and, for local testing,
   turn OFF "Confirm email". (If you keep it on, add `http://localhost:3000/auth/callback`
   under Authentication > URL Configuration > Redirect URLs.)
4. In this folder:
   ```bash
   npm install
   cp .env.example .env.local     # then paste your 3 keys from Project Settings > API
   npm run dev
   ```
5. Open http://localhost:3000, sign up, enroll, open a lesson, mark it complete.

## Try the security yourself
- Logged out, open a locked lesson URL: you see "locked".
- Lesson 1 of Phase 1 is a free preview, so it opens for everyone.
- Edit the form in your browser's dev tools: the server still checks the price.

## Add real lesson content
In Supabase Table Editor > `lessons`, fill `content_md` (text) and `video_url`
(a Vimeo / Mux / YouTube-unlisted link) for each lesson.

## Next steps
1. Payments (Stripe, or Payme/Click for Uzbekistan) with a webhook that creates the enrollment.
2. Quiz page that grades answers on the server (quiz_questions has no public read policy on purpose).
3. Waitlist/landing page and analytics for marketing.
4. Deploy to Vercel (add the same 3 env vars there).
