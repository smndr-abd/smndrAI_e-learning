import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCourseOutline } from "@/lib/data";
import { markComplete } from "@/app/courses/actions";

export default async function LessonPage({
  params,
}: {
  params: { slug: string; lessonId: string };
}) {
  const data = await getCourseOutline(params.slug);
  if (!data) notFound();

  const flat = data.modules.flatMap((m) => m.lessons);
  const index = flat.findIndex((l) => l.id === params.lessonId);
  if (index === -1) notFound();
  const next = flat[index + 1];

  // The database decides: this returns nothing unless the lesson is a free preview
  // or the logged-in user is enrolled (see the RLS policies in schema.sql).
  const supabase = createClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, video_url, content_md")
    .eq("id", params.lessonId)
    .maybeSingle();

  if (!lesson) {
    return (
      <>
        <h1 className="glitch" data-text="Access denied">Access denied</h1>
        <div className="notice error">
          &ldquo;{flat[index].title}&rdquo; is locked. Enroll in the course to unlock it.
        </div>
        <Link className="btn" href={`/courses/${params.slug}`}>Back to the course</Link>
      </>
    );
  }

  return (
    <>
      <p className="crumb"><Link href={`/courses/${params.slug}`}>&larr; {data.course.title}</Link></p>
      <div className="eyebrow">
        Lesson {String(index + 1).padStart(2, "0")} of {String(flat.length).padStart(2, "0")}
      </div>
      <h1 className="glitch" data-text={lesson.title}>{lesson.title}</h1>

      {lesson.video_url && (
        <p>
          <a className="btn secondary" href={lesson.video_url} target="_blank" rel="noreferrer">
            Watch the video
          </a>
        </p>
      )}

      <div className="card">
        <div className="term-head"><b>root@academy</b>:~$ cat lesson.md</div>
        {lesson.content_md ? (
          <pre className="content">{lesson.content_md}</pre>
        ) : (
          <p className="muted">Lesson content coming soon. Add text in the content_md column.</p>
        )}
      </div>

      <form action={markComplete}>
        <input type="hidden" name="lessonId" value={lesson.id} />
        <input type="hidden" name="slug" value={params.slug} />
        <input type="hidden" name="nextId" value={next?.id ?? ""} />
        <button className="btn" type="submit">
          {next ? "Mark complete & continue" : "Mark complete & finish"}
        </button>
      </form>
    </>
  );
}