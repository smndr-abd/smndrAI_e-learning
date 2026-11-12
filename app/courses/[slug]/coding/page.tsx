import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCourseOutline } from "@/lib/data";
import { PASS_MARK } from "@/lib/quiz";

export default async function CodingLab({ params }: { params: { slug: string } }) {
  const data = await getCourseOutline(params.slug);
  if (!data) notFound();
  const { course, modules } = data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS: coding quizzes only come back for enrolled students.
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, module_id, title")
    .eq("kind", "coding");
  const { data: attempts } = await supabase.from("quiz_attempts").select("quiz_id, score, passed");

  if ((quizzes ?? []).length === 0) {
    return (
      <>
        <p className="crumb"><Link href={`/courses/${course.slug}`}>&larr; {course.title}</Link></p>
        <h1 className="glitch" data-text="Coding lab">Coding lab</h1>
        <div className="notice error">
          The Coding Lab is for enrolled students. Enroll in the course to unlock it.
        </div>
        <Link className="btn" href={`/courses/${course.slug}`}>Back to the course</Link>
      </>
    );
  }

  const best: Record<string, number> = {};
  const passed: Record<string, boolean> = {};
  for (const a of attempts ?? []) {
    best[a.quiz_id] = Math.max(best[a.quiz_id] ?? 0, Number(a.score));
    if (a.passed) passed[a.quiz_id] = true;
  }
  const total = (quizzes ?? []).length;
  const passedCount = (quizzes ?? []).filter((q) => passed[q.id]).length;

  return (
    <>
      <p className="crumb"><Link href={`/courses/${course.slug}`}>&larr; {course.title}</Link></p>
      <div className="eyebrow">Hands-on practice</div>
      <h1 className="glitch" data-text="Coding lab">Coding lab</h1>
      <p className="muted">
        Read real code, predict what it does, and fill in the missing pieces. One lab per phase, graded
        on the server. Pass mark {PASS_MARK}%. You have passed {passedCount} of {total} labs.
      </p>

      {modules.map((m) => {
        const quiz = (quizzes ?? []).find((q) => q.module_id === m.id);
        if (!quiz) return null;
        return (
          <div className="card" key={m.id}>
            <h3>Phase {String(m.position).padStart(2, "0")} // {m.title}</h3>
            <p className="muted">{quiz.title}</p>
            <div className="row">
              <Link className="btn" href={`/courses/${course.slug}/quiz/${quiz.id}`}>
                {best[quiz.id] === undefined ? "Start lab" : passed[quiz.id] ? "Practice again" : "Retry lab"}
              </Link>
              {passed[quiz.id] ? (
                <span className="badge done">Passed {best[quiz.id]}%</span>
              ) : best[quiz.id] !== undefined ? (
                <span className="badge">Best {best[quiz.id]}%</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
}
