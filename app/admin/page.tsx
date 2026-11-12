import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createLesson } from "./actions";

export default async function AdminHome({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: courses } = await admin
    .from("courses")
    .select("id, slug, title, is_published")
    .order("created_at");
  const { data: modules } = await admin
    .from("modules")
    .select("id, course_id, position, title")
    .order("position");
  const { data: lessons } = await admin
    .from("lessons")
    .select("id, module_id, position, title, video_url, content_md, is_preview")
    .order("position");

  return (
    <>
      <div className="eyebrow">Admin console</div>
      <h1 className="glitch" data-text="Course manager">Course manager</h1>
      <p className="muted">Pick a lesson to add its video and text, or add a new lesson to a phase.</p>
      <p><Link className="btn secondary" href="/admin/results">Student results</Link></p>
      {searchParams.error && <div className="notice error">{searchParams.error}</div>}

      {(courses ?? []).map((c) => (
        <section key={c.id}>
          <h2>{c.title}</h2>
          <p>
            <Link href={`/courses/${c.slug}`}>View as student &rarr;</Link>
            {!c.is_published && <span className="badge lock">Unpublished</span>}
          </p>

          {(modules ?? [])
            .filter((m) => m.course_id === c.id)
            .map((m) => (
              <div className="card" key={m.id}>
                <h3>Phase {String(m.position).padStart(2, "0")} // {m.title}</h3>
                <ul className="lessons">
                  {(lessons ?? [])
                    .filter((l) => l.module_id === m.id)
                    .map((l) => (
                      <li key={l.id}>
                        <Link href={`/admin/lessons/${l.id}`}>{l.title}</Link>
                        <span className={l.video_url ? "badge done" : "badge lock"}>
                          {l.video_url ? "Video" : "No video"}
                        </span>
                        <span className={l.content_md ? "badge done" : "badge lock"}>
                          {l.content_md ? "Text" : "No text"}
                        </span>
                        {l.is_preview && <span className="badge">Free preview</span>}
                      </li>
                    ))}
                </ul>
                <form action={createLesson} className="row" style={{ marginTop: 16 }}>
                  <input type="hidden" name="moduleId" value={m.id} />
                  <input name="title" type="text" placeholder="New lesson title" style={{ flex: 1, margin: 0, minWidth: 200 }} />
                  <button className="btn secondary" type="submit">Add lesson</button>
                </form>
              </div>
            ))}
        </section>
      ))}
    </>
  );
}
