import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCourseOutline } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { enroll } from "@/app/courses/actions";

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string };
}) {
  const data = await getCourseOutline(params.slug);
  if (!data) notFound();
  const { course, modules } = data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let enrolled = false;
  let done = new Set<string>();
  const quizByModule: Record<string, { id: string; title: string }> = {};
  const bestScore: Record<string, number> = {};
  const passedQuiz: Record<string, boolean> = {};
  if (user) {
    const { data: e } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("course_id", course.id)
      .maybeSingle();
    enrolled = !!e;
    const { data: p } = await supabase.from("lesson_progress").select("lesson_id");
    done = new Set((p ?? []).map((r) => r.lesson_id as string));

    // Quizzes are only returned for enrolled students (RLS).
    const { data: qz } = await supabase.from("quizzes").select("id, module_id, title").eq("kind", "concept");
    for (const q of qz ?? []) quizByModule[q.module_id] = { id: q.id, title: q.title };
    const { data: at } = await supabase.from("quiz_attempts").select("quiz_id, score, passed");
    for (const a of at ?? []) {
      bestScore[a.quiz_id] = Math.max(bestScore[a.quiz_id] ?? 0, Number(a.score));
      if (a.passed) passedQuiz[a.quiz_id] = true;
    }
  }

  const flat = modules.flatMap((m) => m.lessons);
  const completed = flat.filter((l) => done.has(l.id)).length;
  const nextLesson = flat.find((l) => !done.has(l.id)) ?? flat[0];
  const pct = flat.length ? Math.round((completed / flat.length) * 100) : 0;

  return (
    <>
      <p className="crumb"><Link href="/">&larr; Home</Link></p>
      <div className="eyebrow">Course loaded</div>
      <h1 className="glitch" data-text={course.title}>{course.title}</h1>
      <p className="muted">{course.description}</p>
      {searchParams.error && <div className="notice error">{searchParams.error}</div>}

      <div className="card">
        {enrolled ? (
          <>
            <div className="bar"><span style={{ width: `${pct}%` }} /></div>
            <p className="muted" style={{ marginTop: 10 }}>
              SYNC {pct}% // {completed} of {flat.length} lessons complete
            </p>
            <div className="row">
              {nextLesson && (
                <Link className="btn" href={`/courses/${course.slug}/lessons/${nextLesson.id}`}>
                  {completed === 0 ? "Start mission" : "Continue mission"}
                </Link>
              )}
              <Link className="btn secondary" href={`/courses/${course.slug}/coding`}>Coding lab</Link>
            </div>
          </>
        ) : course.price_cents === 0 ? (
          <form action={enroll} className="row">
            <input type="hidden" name="courseId" value={course.id} />
            <input type="hidden" name="slug" value={course.slug} />
            <button className="btn" type="submit">Enroll for free</button>
            {!user && <span className="muted">(you'll be asked to log in)</span>}
          </form>
        ) : (
          <p>
            <span className="price">{formatPrice(course.price_cents)}</span>{" "}
            <span className="muted">// payments are added in the next step</span>
          </p>
        )}
      </div>

      <h2>Curriculum</h2>
      {modules.map((m) => (
        <div className="card" key={m.id}>
          <h3>Phase {String(m.position).padStart(2, "0")} // {m.title}</h3>
          <p className="muted">{m.summary}</p>
          <ul className="lessons">
            {m.lessons.map((l) => {
              const open = enrolled || l.is_preview;
              return (
                <li key={l.id}>
                  {open ? (
                    <Link href={`/courses/${course.slug}/lessons/${l.id}`}>{l.title}</Link>
                  ) : (
                    <span className="muted">{l.title}</span>
                  )}
                  {l.is_preview && !enrolled && <span className="badge">Free preview</span>}
                  {!open && <span className="badge lock">Locked</span>}
                  {done.has(l.id) && <span className="badge done">Done</span>}
                </li>
              );
            })}
          </ul>
          {quizByModule[m.id] && (
            <div className="row" style={{ marginTop: 14 }}>
              <Link className="btn secondary" href={`/courses/${course.slug}/quiz/${quizByModule[m.id].id}`}>
                Take checkpoint quiz
              </Link>
              {passedQuiz[quizByModule[m.id].id] ? (
                <span className="badge done">Passed {bestScore[quizByModule[m.id].id]}%</span>
              ) : bestScore[quizByModule[m.id].id] !== undefined ? (
                <span className="badge">Best {bestScore[quizByModule[m.id].id]}%</span>
              ) : null}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
