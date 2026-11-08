import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCourseOutline } from "@/lib/data";
import { parseVideo } from "@/lib/video";
import { formatBytes } from "@/lib/files";
import { Linkified } from "@/lib/linkify";
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

  const video = parseVideo(lesson.video_url);

  // Same protection as the lesson: files come back only if the student may see the lesson.
  const { data: files } = await supabase
    .from("lesson_files")
    .select("id, name, size_bytes")
    .eq("lesson_id", lesson.id)
    .order("created_at");

  return (
    <>
      <p className="crumb"><Link href={`/courses/${params.slug}`}>&larr; {data.course.title}</Link></p>
      <div className="eyebrow">
        Lesson {String(index + 1).padStart(2, "0")} of {String(flat.length).padStart(2, "0")}
      </div>
      <h1 className="glitch" data-text={lesson.title}>{lesson.title}</h1>

      {video?.kind === "iframe" && (
        <div className="video">
          <iframe
            src={video.src}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
      {video?.kind === "file" && (
        <video className="video-file" controls preload="metadata" src={video.src} />
      )}
      {video?.kind === "link" && (
        <p>
          <a className="btn secondary" href={video.src} target="_blank" rel="noreferrer">
            Watch the video
          </a>
        </p>
      )}

      <div className="card">
        <div className="term-head"><b>root@academy</b>:~$ cat lesson.md</div>
        {lesson.content_md ? (
          <pre className="content"><Linkified text={lesson.content_md} /></pre>
        ) : (
          <p className="muted">Lesson notes coming soon.</p>
        )}
      </div>

      {(files ?? []).length > 0 && (
        <div className="card">
          <h3>Downloads</h3>
          <ul className="files">
            {(files ?? []).map((f) => (
              <li key={f.id}>
                <span>
                  <a href={`/files/${f.id}`}>{f.name}</a>
                  <span className="file-meta"> {formatBytes(f.size_bytes)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
