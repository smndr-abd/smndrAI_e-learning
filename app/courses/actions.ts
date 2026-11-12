"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PASS_MARK, quizState, isAnswerCorrect, type AttemptRow } from "@/lib/quiz";

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

// Grades a quiz ON THE SERVER and applies the retry rules from lib/quiz.ts.
// The correct answers never reach the browser until after submitting.
export async function submitQuiz(formData: FormData) {
  const quizId = String(formData.get("quizId"));
  const slug = String(formData.get("slug"));

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS: this returns the quiz only if the student is enrolled in its course.
  const { data: quiz } = await supabase.from("quizzes").select("id").eq("id", quizId).maybeSingle();
  if (!quiz) redirect(`/courses/${slug}`);

  const admin = createAdminClient();

  // Earlier attempts decide the penalty and any waiting time.
  const { data: prior } = await admin
    .from("quiz_attempts")
    .select("score, raw_score, passed, taken_at")
    .eq("user_id", user.id)
    .eq("quiz_id", quizId)
    .order("taken_at", { ascending: false });
  const state = quizState((prior ?? []) as AttemptRow[]);

  // Still in the cooldown after a very low score: the quiz page explains it.
  if (state.waitMinutes > 0) redirect(`/courses/${slug}/quiz/${quizId}`);

  const { data: questions } = await admin
    .from("quiz_questions")
    .select("id, correct_index, qtype, accepted")
    .eq("quiz_id", quizId);

  const answers: Record<string, number | string | null> = {};
  let correct = 0;
  for (const q of questions ?? []) {
    const raw = formData.get(`q_${q.id}`);
    let picked: number | string | null = null;
    if (raw !== null) picked = q.qtype === "blank" ? String(raw).slice(0, 200) : Number(raw);
    answers[q.id] = picked;
    if (isAnswerCorrect(q, picked)) correct++;
  }
  const total = (questions ?? []).length;
  const rawScore = total ? Math.round((correct / total) * 100) : 0;
  const score = Math.max(0, rawScore - state.penalty);

  const { data: attempt } = await admin
    .from("quiz_attempts")
    .insert({
      user_id: user.id,
      quiz_id: quizId,
      score,
      raw_score: rawScore,
      penalty: state.penalty,
      passed: score >= PASS_MARK,
      answers,
    })
    .select("id")
    .single();

  revalidatePath(`/courses/${slug}`);
  redirect(
    attempt
      ? `/courses/${slug}/quiz/${quizId}?attempt=${attempt.id}`
      : `/courses/${slug}/quiz/${quizId}`
  );
}
