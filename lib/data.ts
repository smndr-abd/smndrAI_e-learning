import { createClient } from "@/lib/supabase/server";

export type LessonOutline = {
  id: string;
  module_id: string;
  position: number;
  title: string;
  is_preview: boolean;
};
export type ModuleOutline = {
  id: string;
  position: number;
  title: string;
  summary: string | null;
  lessons: LessonOutline[];
};

// Course + modules + lesson titles. Uses the lesson_outline view so that
// locked lessons still show their TITLES (but never their content).
export async function getCourseOutline(slug: string) {
  const supabase = createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!course) return null;

  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", course.id)
    .order("position");

  const ids = (modules ?? []).map((m: { id: string }) => m.id);
  const { data: lessons } = await supabase
    .from("lesson_outline")
    .select("*")
    .in("module_id", ids)
    .order("position");

  const outline: ModuleOutline[] = (modules ?? []).map((m: any) => ({
    ...m,
    lessons: ((lessons ?? []) as LessonOutline[]).filter((l) => l.module_id === m.id),
  }));
  return { course, modules: outline };
}
