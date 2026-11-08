"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALLOWED_EXTENSIONS, BUCKET, MAX_FILE_BYTES, MAX_FILE_MB, extOf, safeName } from "@/lib/files";

export async function createLesson(formData: FormData) {
  await requireAdmin();
  const moduleId = String(formData.get("moduleId"));
  const title = String(formData.get("title") ?? "").trim() || "Untitled lesson";

  const admin = createAdminClient();
  const { data: last } = await admin
    .from("lessons")
    .select("position")
    .eq("module_id", moduleId)
    .order("position", { ascending: false })
    .limit(1);
  const position = (last?.[0]?.position ?? 0) + 1;

  const { data: lesson, error } = await admin
    .from("lessons")
    .insert({ module_id: moduleId, position, title })
    .select("id")
    .single();

  if (error || !lesson) {
    redirect(`/admin?error=${encodeURIComponent(error?.message ?? "Could not create the lesson")}`);
  }
  revalidatePath("/", "layout");
  redirect(`/admin/lessons/${lesson.id}`);
}

export async function updateLesson(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim() || "Untitled lesson";
  const video = String(formData.get("video_url") ?? "").trim();
  const content = String(formData.get("content_md") ?? "");
  const isPreview = formData.get("is_preview") === "on";

  const admin = createAdminClient();
  const { error } = await admin
    .from("lessons")
    .update({
      title,
      video_url: video || null,
      content_md: content.trim() ? content : null,
      is_preview: isPreview,
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/lessons/${id}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/", "layout");
  redirect(`/admin/lessons/${id}?saved=1`);
}

export async function deleteLesson(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  if (formData.get("confirm") !== "on") redirect(`/admin/lessons/${id}`);

  const admin = createAdminClient();
  // Remove the lesson's uploaded files from storage too, so nothing is left behind.
  const { data: files } = await admin.from("lesson_files").select("storage_path").eq("lesson_id", id);
  const paths = (files ?? []).map((f) => f.storage_path as string);
  if (paths.length) await admin.storage.from(BUCKET).remove(paths);

  await admin.from("lessons").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/admin");
}

// ---------- File uploads (admin only) ----------
// Files go straight from the browser to private storage using a one-time upload
// link, so big files never pass through the website server.

type StartResult = { error?: string; path?: string; token?: string };

export async function createUploadUrl(lessonId: string, fileName: string, size: number): Promise<StartResult> {
  await requireAdmin();

  const ext = extOf(fileName);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { error: `Files of type ".${ext || "?"}" are not allowed.` };
  }
  if (!(size > 0) || size > MAX_FILE_BYTES) {
    return { error: `The file must be between 1 byte and ${MAX_FILE_MB} MB.` };
  }

  const path = `lessons/${lessonId}/${crypto.randomUUID()}-${safeName(fileName)}`;
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: error?.message ?? "Could not start the upload." };
  return { path: data.path, token: data.token };
}

export async function registerFile(
  lessonId: string,
  path: string,
  name: string,
  size: number,
  mimeType: string
): Promise<{ error?: string; ok?: boolean }> {
  await requireAdmin();
  if (!path.startsWith(`lessons/${lessonId}/`)) return { error: "Invalid file path." };

  const admin = createAdminClient();
  const { error } = await admin.from("lesson_files").insert({
    lesson_id: lessonId,
    name: name.slice(0, 200),
    storage_path: path,
    size_bytes: size,
    mime_type: mimeType,
  });
  if (error) return { error: error.message };

  revalidatePath(`/admin/lessons/${lessonId}`);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteLessonFile(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const lessonId = String(formData.get("lessonId"));

  const admin = createAdminClient();
  const { data: file } = await admin.from("lesson_files").select("storage_path").eq("id", id).maybeSingle();
  if (file) await admin.storage.from(BUCKET).remove([file.storage_path as string]);
  await admin.from("lesson_files").delete().eq("id", id);

  revalidatePath("/", "layout");
  redirect(`/admin/lessons/${lessonId}?removed=1`);
}
