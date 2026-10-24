import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, courses(id, slug, title)");
  const { data: progress } = await supabase.from("lesson_progress").select("lesson_id");
  const done = new Set((progress ?? []).map((r) => r.lesson_id as string));

  const cards = [];
  for (const e of enrollments ?? []) {
    const course: any = Array.isArray(e.courses) ? e.courses[0] : e.courses;
    if (!course) continue;
    const { data: modules } = await supabase.from("modules").select("id").eq("course_id", course.id);
    const { data: lessons } = await supabase
      .from("lesson_outline")
      .select("id")
      .in("module_id", (modules ?? []).map((m) => m.id));
    const total = (lessons ?? []).length;
    const completed = (lessons ?? []).filter((l) => done.has(l.id)).length;
    cards.push({ course, total, completed });
  }

  return (
    <>
      <div className="eyebrow">Operator console</div>
      <h1 className="glitch" data-text="My courses">My courses</h1>
      {cards.length === 0 && (
        <p className="muted">No active missions. <Link href="/">Browse courses</Link></p>
      )}
      {cards.map(({ course, total, completed }) => {
        const pct = total ? Math.round((completed / total) * 100) : 0;
        return (
          <div className="card" key={course.id}>
            <h3>{course.title}</h3>
            <div className="bar"><span style={{ width: `${pct}%` }} /></div>
            <p className="muted" style={{ marginTop: 10 }}>
              SYNC {pct}% // {completed} of {total} lessons
            </p>
            <Link className="btn" href={`/courses/${course.slug}`}>Open course</Link>
          </div>
        );
      })}
    </>
  );
}