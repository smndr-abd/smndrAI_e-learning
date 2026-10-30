"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Free enrollment. The price is checked HERE on the server, so nobody can
// enroll in a paid course by editing the form in their browser.
// Later, your payment webhook will do the same upsert after a verified payment.
export async function enroll(formData: FormData) {
  const courseId = String(formData.get("courseId"));
  const slug = String(formData.get("slug"));

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: course } = await admin
    .from("courses")
    .select("price_cents, is_published")
    .eq("id", courseId)
    .single();

  if (!course || !course.is_published || course.price_cents > 0) {
    redirect(`/courses/${slug}?error=${encodeURIComponent("This course is not free.")}`);
  }

  await admin.from("enrollments").upsert({ user_id: user.id, course_id: courseId });
  revalidatePath(`/courses/${slug}`);
  redirect(`/courses/${slug}`);
}

export async function markComplete(formData: FormData) {
  const lessonId = String(formData.get("lessonId"));
  const slug = String(formData.get("slug"));
  const nextId = String(formData.get("nextId") ?? "");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("lesson_progress").upsert({ user_id: user.id, lesson_id: lessonId });
  revalidatePath(`/courses/${slug}`);
  redirect(nextId ? `/courses/${slug}/lessons/${nextId}` : `/courses/${slug}`);
}
