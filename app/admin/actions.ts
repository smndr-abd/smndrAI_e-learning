"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

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
  await admin.from("lessons").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/admin");
}
