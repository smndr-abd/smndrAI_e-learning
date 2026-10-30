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
  if (user) {
    const { data: e } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("course_id", course.id)
      .maybeSingle();
    enrolled = !!e;
    const { data: p } = await supabase.from("lesson_progress").select("lesson_id");
    done = new Set((p ?? []).map((r) => r.lesson_id as string));
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
            {nextLesson && (
              <Link className="btn" href={`/courses/${course.slug}/lessons/${nextLesson.id}`}>
                {completed === 0 ? "Start mission" : "Continue mission"}
              </Link>
            )}
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
        </div>
      ))}
    </>
  );
}