import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateLesson, deleteLesson } from "@/app/admin/actions";

export default async function EditLesson({
  params,
  searchParams,
}: {
  params: { lessonId: string };
  searchParams: { saved?: string; error?: string };
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

  return (
    <>
      <p className="crumb"><Link href="/admin">&larr; Course manager</Link></p>
      <div className="eyebrow">Edit lesson</div>
      <h1>{lesson.title}</h1>

      {searchParams.saved && <div className="notice ok">Saved. The live site is updated.</div>}
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
          // Lesson text (notes, code, links)
          <textarea name="content_md" rows={18} defaultValue={lesson.content_md ?? ""} />
        </label>

        <label className="check">
          <input name="is_preview" type="checkbox" defaultChecked={lesson.is_preview} />
          Free preview (anyone can watch this lesson without enrolling)
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

      <h2>Danger zone</h2>
      <form action={deleteLesson} className="card">
        <input type="hidden" name="id" value={lesson.id} />
        <label className="check">
          <input name="confirm" type="checkbox" required />
          I am sure. Delete this lesson and the progress students made on it.
        </label>
        <button className="btn secondary" type="submit">Delete lesson</button>
      </form>
    </>
  );
}
