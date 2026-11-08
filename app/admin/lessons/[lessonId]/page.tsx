import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBytes } from "@/lib/files";
import { updateLesson, deleteLesson, deleteLessonFile } from "@/app/admin/actions";
import FileUploader from "./FileUploader";

export default async function EditLesson({
  params,
  searchParams,
}: {
  params: { lessonId: string };
  searchParams: { saved?: string; error?: string; removed?: string };
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: lesson } = await admin
    .from("lessons")
    .select("id, module_id, title, video_url, content_md, is_preview")
    .eq("id", params.lessonId)
    .maybeSingle();
  if (!lesson) notFound();

  const { data: mod } = await admin.from("modules").select("course_id").eq("id", lesson.module_id).maybeSingle();
  const { data: course } = mod
    ? await admin.from("courses").select("slug").eq("id", mod.course_id).maybeSingle()
    : { data: null };
  const { data: files } = await admin
    .from("lesson_files")
    .select("id, name, size_bytes, created_at")
    .eq("lesson_id", lesson.id)
    .order("created_at");

  return (
    <>
      <p className="crumb"><Link href="/admin">&larr; Course manager</Link></p>
      <div className="eyebrow">Edit lesson</div>
      <h1>{lesson.title}</h1>

      {searchParams.saved && <div className="notice ok">Saved. The live site is updated.</div>}
      {searchParams.removed && <div className="notice ok">File removed.</div>}
      {searchParams.error && <div className="notice error">{searchParams.error}</div>}

      <form action={updateLesson} className="card">
        <input type="hidden" name="id" value={lesson.id} />

        <label>
          // Title
          <input name="title" type="text" defaultValue={lesson.title} required />
        </label>

        <label>
          // Video link (YouTube, Vimeo, or a direct .mp4 link)
          <input name="video_url" type="url" defaultValue={lesson.video_url ?? ""} placeholder="https://..." />
        </label>

        <label>
          // Lesson text (links you paste become clickable)
          <textarea name="content_md" rows={14} defaultValue={lesson.content_md ?? ""} />
        </label>

        <label className="check">
          <input name="is_preview" type="checkbox" defaultChecked={lesson.is_preview} />
          Free preview (anyone can watch this lesson, and download its files, without enrolling)
        </label>

        <div className="row">
          <button className="btn" type="submit">Save lesson</button>
          {course && (
            <Link className="btn secondary" href={`/courses/${course.slug}/lessons/${lesson.id}`}>
              Open as student
            </Link>
          )}
        </div>
      </form>

      <h2>Downloads</h2>
      <div className="card">
        <p className="muted">
          Files are stored privately. Students get a short-lived download link, and only if the lesson
          is a free preview or they are enrolled.
        </p>
        {(files ?? []).length === 0 ? (
          <p className="muted">No files yet.</p>
        ) : (
          <ul className="files">
            {(files ?? []).map((f) => (
              <li key={f.id}>
                <span>
                  <a href={`/files/${f.id}`}>{f.name}</a>
                  <span className="file-meta"> {formatBytes(f.size_bytes)}</span>
                </span>
                <form action={deleteLessonFile}>
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="lessonId" value={lesson.id} />
                  <button className="btn link" type="submit">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: 20 }}>
          <FileUploader lessonId={lesson.id} />
        </div>
      </div>

      <h2>Danger zone</h2>
      <form action={deleteLesson} className="card">
        <input type="hidden" name="id" value={lesson.id} />
        <label className="check">
          <input name="confirm" type="checkbox" required />
          I am sure. Delete this lesson, its files, and the progress students made on it.
        </label>
        <button className="btn secondary" type="submit">Delete lesson</button>
      </form>
    </>
  );
}
