# AI Engineer Academy

A cyberpunk-styled e-learning website that teaches a 9-month **AI Engineer roadmap**:
from Python foundations to RAG, agents, MCP and production deployment.

Students can sign up, enroll, watch video lessons, download materials, take graded quizzes and
coding labs, and track their progress. The instructor manages everything from a private admin
panel and sees every student's quiz results in a dashboard.

Live site: https://smndr-ai-e-learning.vercel.app

# Created by Samandar Abdujabbar 
# LinkedIn: https://www.linkedin.com/in/samandar-abdujabbarov/

---

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [First-time setup](#first-time-setup)
5. [Database files (SQL)](#database-files-sql)
6. [Becoming an admin](#becoming-an-admin)
7. [Using the admin panel](#using-the-admin-panel)
8. [How quizzes and coding labs work](#how-quizzes-and-coding-labs-work)
9. [How file uploads work](#how-file-uploads-work)
10. [Security design](#security-design)
11. [Customizing the site](#customizing-the-site)
12. [Publishing changes](#publishing-changes)
13. [Troubleshooting](#troubleshooting)
14. [Before you charge money](#before-you-charge-money)
15. [Roadmap](#roadmap)

---

## Features

**For students**

- Sign up, log in, and reset a forgotten password by email
- Course catalog and a curriculum page (4 phases, 26 lessons)
- Free enrollment, free preview lessons, and a progress bar
- Video lessons (YouTube, Vimeo or direct `.mp4` links) with notes and clickable links
- Downloadable lesson files (PDFs, slides, zips) through short-lived private links
- **Checkpoint quizzes**, one per phase, with retry rules and a review of every answer
- **Coding Lab**: one lab per phase with "predict the output" and "fill in the missing code" questions
- "My courses" dashboard

**For the instructor (admin only)**

- Create, edit and delete lessons; paste video links; write lesson text; mark free previews
- Upload and remove lesson files
- **Student results dashboard**: totals, pass rates, per-quiz stats, per-student scores, hardest
  questions, student detail pages and a CSV download

---

## Tech stack

| Part | Tool |
|---|---|
| Framework | Next.js 14 (App Router) with TypeScript, React 18 |
| Database, login, file storage | Supabase (Postgres, Auth, Storage) |
| Styling | Plain CSS in `app/globals.css` (no Tailwind) |
| Hosting | Vercel |
| Code | GitHub |

Next.js is pinned to version 14. Version 15 and later change how `cookies()` works and break the
Supabase helpers in `lib/supabase/`.

---

## Project structure

```
elearning-app/
├── middleware.ts                 Keeps the login session fresh; sends logged-out users away from /dashboard
├── sql/                          Database files (run in order, see below)
├── lib/
│   ├── supabase/
│   │   ├── server.ts             Supabase client that acts as the logged-in user (RLS applies)
│   │   ├── admin.ts              Supabase client with the secret key (server code only!)
│   │   └── client.ts             Browser client (used for direct file uploads)
│   ├── admin.ts                  requireAdmin(): guards every admin page and action
│   ├── data.ts                   Loads a course with its phases and lesson titles
│   ├── format.ts                 Price formatting
│   ├── video.ts                  Turns YouTube / Vimeo / .mp4 links into an embedded player
│   ├── quiz.ts                   Quiz rules (pass mark, penalty, cooldown) and answer checking
│   ├── files.ts                  Upload limits and allowed file types
│   ├── results.ts                Loads and calculates the instructor dashboard data
│   └── linkify.tsx               Makes links in lesson text clickable
└── app/
    ├── layout.tsx                Header (brand, menu, Admin link for admins) and footer
    ├── page.tsx                  Home page
    ├── globals.css               The whole cyberpunk theme
    ├── login/                    Log in and sign up (page.tsx, actions.ts)
    ├── forgot-password/          "Send me a reset link" page
    ├── reset-password/           "Choose a new password" page
    ├── auth/callback/route.ts    Confirms the email after sign up
    ├── auth/reset/route.ts       Handles the link in the password-reset email
    ├── dashboard/                "My courses" page
    ├── courses/
    │   ├── actions.ts            enroll, markComplete, submitQuiz
    │   └── [slug]/
    │       ├── page.tsx          Course page and curriculum
    │       ├── coding/page.tsx   Coding Lab
    │       ├── lessons/[lessonId]/page.tsx   Lesson (video, notes, downloads)
    │       └── quiz/[quizId]/page.tsx        Quiz and coding-lab page (form + results)
    ├── files/[fileId]/route.ts   Download gate for lesson files
    └── admin/
        ├── page.tsx              Course manager
        ├── actions.ts            Lesson and file actions (admin only)
        ├── lessons/[lessonId]/   Lesson editor and file uploader
        ├── results/page.tsx      Student results dashboard
        ├── results/export/route.ts   CSV download
        └── students/[userId]/page.tsx   One student's scores and history
```

### Pages and addresses

| Address | What it is | Who can open it |
|---|---|---|
| `/` | Home page and course list | Everyone |
| `/login`, `/forgot-password` | Account pages | Everyone |
| `/courses/[slug]` | Course and curriculum | Everyone |
| `/courses/[slug]/lessons/[id]` | A lesson | Free previews: everyone. Others: enrolled students |
| `/courses/[slug]/quiz/[id]` | A quiz or coding lab | Enrolled students |
| `/courses/[slug]/coding` | Coding Lab list | Enrolled students |
| `/dashboard` | My courses | Logged-in users |
| `/files/[id]` | File download | Same rule as the lesson it belongs to |
| `/admin` and everything under it | Instructor tools | Admins only |

---

## First-time setup

You need: **Node.js 18.18 or newer**, a free **Supabase** account, and (to publish) **GitHub** and **Vercel** accounts.

### 1. Create the Supabase project

1. Create a project at https://supabase.com and wait until it is ready.
2. Run the SQL files in `sql/`, **in order** (see [Database files](#database-files-sql)).
3. For local testing, go to **Authentication, then Providers, then Email** and switch off **Confirm email**.
4. Go to **Authentication, then URL Configuration**. Add these under **Redirect URLs**
   (replace the second address with your own live address):
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/reset
   https://YOUR-SITE.vercel.app/auth/callback
   https://YOUR-SITE.vercel.app/auth/reset
   ```
   Also set **Site URL** to your live address.

### 2. Get your keys

In Supabase open **Project Settings, then API** (and **API Keys**). You need:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, like `https://abcdefgh.supabase.co` (never the dashboard address) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The anon / publishable key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | The service role / secret key (**private**) |

### 3. Run it on your computer

```bash
npm install
cp .env.example .env.local      # then paste your 3 values into .env.local
npm run dev
```

Open http://localhost:3000. After editing `.env.local`, stop the server (Ctrl+C) and start it again.

`.env.local` is ignored by Git on purpose. Never commit it and never paste the secret key anywhere public.

---

## Database files (SQL)

Run these in the Supabase **SQL Editor**, each as a new query, **in this order**:

| # | File | What it adds |
|---|---|---|
| 1 | `schema.sql` | All tables and the access rules (RLS) |
| 2 | `seed.sql` | The course, 4 phases, 26 lesson titles and 3 portfolio projects |
| 3 | `002_app_support.sql` | Creates a profile on sign up; the lesson outline view |
| 4 | `003_quizzes.sql` | Concept quizzes: 4 questions per phase |
| 5 | `004_quiz_rules.sql` | Columns for retry rules (raw score, penalty, passed) |
| 6 | `005_lesson_files.sql` | Downloadable files table and the private storage bucket |
| 7 | `006_coding_quizzes.sql` | Coding Lab: 5 code questions per phase |

Quick check that everything is in place:

```sql
select
  (select count(*) from courses) as courses,           -- 1
  (select count(*) from lessons) as lessons,           -- 26 or more
  (select count(*) from quizzes) as quizzes,           -- 8
  (select count(*) from quiz_questions) as questions,  -- 36
  (select count(*) from storage.buckets where id = 'course-files') as bucket;  -- 1
```

Re-running `003_quizzes.sql` resets the concept quizzes (and their attempts). If you do, run
`006_coding_quizzes.sql` again afterwards.

---

## Becoming an admin

Admin is a label stored in the database, not a password. Sign up on the site first, then run this
in the SQL Editor with your exact email:

```sql
insert into profiles (id, full_name, role)
select id, '', 'admin' from auth.users where email = 'YOUR-EMAIL@example.com'
on conflict (id) do update set role = 'admin';
```

To check who is an admin:

```sql
select u.email, p.role from auth.users u left join profiles p on p.id = u.id;
```

The **My courses** page also shows `role: admin` once it worked, and **Admin** appears in the menu.
Nobody can make themselves an admin from the website. Every admin page and action re-checks the role
on the server.

---

## Using the admin panel

Open **Admin** in the menu (or go to `/admin`).

| Task | How |
|---|---|
| Add a lesson | In the phase card, type a title and click **Add lesson** |
| Edit a lesson | Click its title, change the fields, click **Save lesson** |
| Add a video | Upload it to YouTube (**Unlisted**) or Vimeo, then paste the link in **Video link** |
| Add notes or code | Type in **Lesson text** (links become clickable) |
| Make it a free sample | Tick **Free preview** |
| Upload a file | Lesson page, **Downloads**, choose a file, **Upload file** (max 50 MB) |
| Check it like a student | **Open as student** |
| See results | **Student results** |

Videos are not uploaded to this site on purpose. Host them elsewhere and paste the link.
Unlisted YouTube links can be shared by anyone who has them, so move paid lessons to a host with
stronger protection (for example Vimeo, Mux or Bunny Stream) before charging.

Allowed upload types: pdf, epub, zip, pptx, ppt, docx, doc, xlsx, csv, txt, md, ipynb, py, png, jpg, jpeg.
Only upload material you have the rights to share.

---

## How quizzes and coding labs work

Each phase has a **checkpoint quiz** (concept questions) and a **coding lab** (code questions).
Both use the same rules, which live in `lib/quiz.ts`:

| Score | What happens |
|---|---|
| **80% or more** | Passed (and it stays passed) |
| **50% to 79%** | Retry right away, with a **-10 point penalty** for each earlier failed attempt (maximum -20) |
| **Below 50%** | Review the lessons and wait **60 minutes** before retrying |

A perfect score always passes, even with the maximum penalty (100 - 20 = 80). After passing,
retakes are practice and never lower your result.

To change the rules, edit these numbers at the top of `lib/quiz.ts`:

```ts
export const PASS_MARK = 80;
export const RETRY_MARK = 50;
export const PENALTY_STEP = 10;
export const PENALTY_CAP = 20;
export const COOLDOWN_MINUTES = 60;
```

**Question types**

- `choice`: pick one answer.
- `blank`: type the missing code. Answers are compared exactly after trimming spaces, so capital
  letters matter. A question can accept several spellings (the `accepted` list).

Grading happens on the server. The correct answers are never sent to the browser before a student
submits. Coding labs do not run student code; they test reading and completing code, which keeps
scoring safe and cheat-resistant.

Questions are stored in the `quiz_questions` table. Edit them in the Supabase Table Editor for now.
Each quiz currently has 4 questions (concept) or 5 (coding), so scores move in big steps. Add more
questions before launch.

---

## How file uploads work

1. The admin picks a file. The browser asks the server for a one-time upload link (**admins only**).
2. The file goes straight from the browser to a **private** Supabase Storage bucket (`course-files`).
   It does not pass through the website server, because hosting platforms limit request sizes.
3. The server records the file in the `lesson_files` table.
4. A student clicks a download link (`/files/[id]`). The database rules decide whether they may see
   that lesson's files (free preview or enrolled). If yes, the site creates a download link that
   **expires after 60 seconds**.

Deleting a lesson also deletes its files from storage.

---

## Security design

- **Row Level Security (RLS)** is on for all tables. The database itself refuses to return paid
  lessons, files or quizzes to people who are not enrolled.
- **The secret key stays on the server.** `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix,
  so it is never sent to browsers. Never rename it to start with `NEXT_PUBLIC_`.
- **Enrollment happens only on the server**, and the price is re-checked there. Later, a payment
  webhook will do the same.
- **Admin checks** (`requireAdmin()`) run on every admin page and action.
- **Quiz answers** are graded on the server and are not sent to the browser first.
- **Files are private** and are downloaded through expiring links.
- **Password reset** shows the same message whether or not an email has an account.
- **CSV export** protects against spreadsheet formula injection.

Never commit: `.env.local`, `node_modules/`, `.next/`, `.DS_Store`, passwords or API keys, or exports
of real student data. The secret key and the CSV export are private.

---

## Customizing the site

| You want to change | Open |
|---|---|
| Colors, fonts, buttons, cards | the variables at the top of `app/globals.css` |
| Brand name, menu, footer, page title | `app/layout.tsx` |
| Home page headline, intro and numbers | `app/page.tsx` |
| Login page wording | `app/login/page.tsx` |
| Quiz rules | `lib/quiz.ts` |
| Upload limits and allowed types | `lib/files.ts` |
| Course name, description and price | the `courses` table in Supabase (`price_cents` of 0 means free) |

For a glitch-effect heading, keep the text and the `data-text="..."` value identical.

---

## Publishing changes

| What you change | How it goes live |
|---|---|
| Code or design | `git add .`, `git commit -m "what changed"`, `git push`. Vercel rebuilds in about a minute |
| Lessons, videos, notes, files, questions | Instantly, through the admin panel or Supabase (no deploy) |
| Environment variables in Vercel | Click **Redeploy** afterwards |
| Database structure (SQL) | Run it in Supabase **before** pushing code that needs it |

Before every commit, run `git status` and make sure `.env.local` is not listed.

To deploy for the first time: push to GitHub, import the repo in Vercel, add the three environment
variables under **Environment Variables**, deploy, then add your live address to Supabase
(**Site URL** and **Redirect URLs**).

Your computer and the live site share one Supabase project, so test accounts and test data also
appear on the live site.

---

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| `next: command not found` | Run `npm install` first |
| "Your project's URL and Key are required" | `.env.local` is missing, misnamed or empty. Restart `npm run dev` after editing |
| Data requests fail or return an HTML "404" page | `NEXT_PUBLIC_SUPABASE_URL` is the dashboard address. It must be `https://PROJECTID.supabase.co` |
| `cookieStore.getAll is not a function` | Next.js 15 or newer is installed. Run `npm install next@14.2.35 react@18.3.1 react-dom@18.3.1` |
| "Could not find the table 'public.courses'" | The SQL files were not run in the project your keys point to, or the project was paused. Resume it, run the SQL files, then run `notify pgrst, 'reload schema';` |
| `500 MIDDLEWARE_INVOCATION_FAILED` on Vercel | Environment variables are missing or misnamed in Vercel. Fix them, then **Redeploy** |
| Site stopped working after some days | The free Supabase project was paused for inactivity. Click **Resume project** |
| No **Admin** link, or `/admin` sends you home | Your account's role is not `admin`. Run the admin SQL with your exact email |
| `/admin` shows 404 | `app/admin/page.tsx` is missing |
| No quiz button on the course page | You are not enrolled, or `003_quizzes.sql` has not been run |
| Upload fails | File is over 50 MB, the type is not allowed, you are not admin, or `005_lesson_files.sql` was not run |
| Reset-password link opens the home page | The `/auth/reset` address is missing from Supabase **Redirect URLs** |
| Reset link says "invalid or expired" | Open the link in the same browser where you requested it, and request a new one |
| Reset or confirmation emails do not arrive | Supabase's built-in email sender is very limited. Use your own sender (Resend or Brevo) |
| Page looks unstyled | Hard-refresh with Cmd+Shift+R |

---

## Before you charge money

- [ ] **Hosting that allows commercial use.** Vercel's free Hobby plan is for non-commercial use only.
- [ ] **A database that does not pause and has backups.** Supabase's free plan pauses when inactive and has no backups.
- [ ] **A real email sender** (Resend or Brevo) so sign-up and reset emails reach students.
- [ ] **Legal pages:** Terms, Privacy and Refund policy, checked for your country.
- [ ] **Protected video hosting** for paid lessons.
- [ ] **A way to take payments**, and a tested payment with a refund.
- [ ] **Real content:** at least Phase 1 recorded, and more quiz questions.
- [ ] **Two-factor login** switched on for GitHub, Vercel and Supabase.

---

## Roadmap

1. Record and upload real lessons (Phase 1 first).
2. More quiz questions, a random question pool, and an admin screen to edit quizzes.
3. Project submissions (students send GitHub links) with instructor feedback.
4. Email sender and email confirmation.
5. Trust and legal pages: About, FAQ, Terms, Privacy, Refunds, Contact.
6. Payments: start with a manual "Grant access" button in admin, then automatic checkout.
7. Production hardening: paid plans, backups, monitoring, analytics and a custom domain.
8. Certificates and reviews.
9. Soft launch to 10-20 people, then public launch.