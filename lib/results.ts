import { createAdminClient } from "@/lib/supabase/admin";
import { isAnswerCorrect } from "@/lib/quiz";

export type QuizInfo = { id: string; title: string; kind: "concept" | "coding"; phase: number };
export type Cell = { best: number; attempts: number; passed: boolean; last: string };
export type StudentRow = {
  id: string;
  name: string;
  email: string;
  concept: number | null; // average of best scores on concept quizzes the student tried
  coding: number | null;  // same for coding labs
  passed: number;         // quizzes passed
  last: string | null;    // last attempt time
};
export type AttemptInfo = {
  user_id: string;
  quiz_id: string;
  score: number;
  raw_score: number;
  penalty: number;
  passed: boolean;
  taken_at: string;
};

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

// Loads everything the instructor dashboard needs, using the admin key.
// Only call this after requireAdmin().
export async function loadResults() {
  const admin = createAdminClient();

  const [quizRes, modRes, attRes, qRes, enrRes, profRes, usersRes] = await Promise.all([
    admin.from("quizzes").select("id, title, kind, module_id"),
    admin.from("modules").select("id, position"),
    admin
      .from("quiz_attempts")
      .select("user_id, quiz_id, score, raw_score, penalty, passed, taken_at, answers")
      .order("taken_at", { ascending: true }),
    admin.from("quiz_questions").select("id, quiz_id, prompt, qtype, correct_index, accepted"),
    admin.from("enrollments").select("user_id"),
    admin.from("profiles").select("id, full_name"),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const phaseOf = new Map<string, number>((modRes.data ?? []).map((m: any) => [m.id, m.position]));
  const quizzes: QuizInfo[] = (quizRes.data ?? [])
    .map((q: any) => ({ id: q.id, title: q.title, kind: q.kind, phase: phaseOf.get(q.module_id) ?? 0 }))
    .sort(
      (a: QuizInfo, b: QuizInfo) =>
        a.phase - b.phase || (a.kind === b.kind ? 0 : a.kind === "concept" ? -1 : 1)
    );
  const quizById = new Map(quizzes.map((q) => [q.id, q]));

  const emailOf = new Map<string, string>((usersRes.data?.users ?? []).map((u: any) => [u.id, u.email ?? ""]));
  const nameOf = new Map<string, string>((profRes.data ?? []).map((p: any) => [p.id, p.full_name ?? ""]));

  // best score, attempt count, pass status and last time for every student + quiz
  const attempts: any[] = attRes.data ?? [];
  const cells = new Map<string, Cell>();
  for (const a of attempts) {
    const key = `${a.user_id}|${a.quiz_id}`;
    const c = cells.get(key) ?? { best: 0, attempts: 0, passed: false, last: a.taken_at };
    c.best = Math.max(c.best, Number(a.score));
    c.attempts += 1;
    c.passed = c.passed || !!a.passed;
    if (a.taken_at > c.last) c.last = a.taken_at;
    cells.set(key, c);
  }

  // students = everyone enrolled plus anyone who attempted something
  const ids = new Set<string>([
    ...(enrRes.data ?? []).map((e: any) => e.user_id as string),
    ...attempts.map((a) => a.user_id as string),
  ]);
  const students: StudentRow[] = [...ids].map((id) => {
    const concept: number[] = [];
    const coding: number[] = [];
    let passed = 0;
    let last: string | null = null;
    for (const quiz of quizzes) {
      const c = cells.get(`${id}|${quiz.id}`);
      if (!c) continue;
      (quiz.kind === "coding" ? coding : concept).push(c.best);
      if (c.passed) passed++;
      if (!last || c.last > last) last = c.last;
    }
    const email = emailOf.get(id) ?? "";
    return { id, name: nameOf.get(id) || email || id.slice(0, 8), email, concept: avg(concept), coding: avg(coding), passed, last };
  });
  students.sort((a, b) => (b.last ?? "").localeCompare(a.last ?? "") || a.name.localeCompare(b.name));

  // per-quiz summary
  const quizStats = quizzes.map((q) => {
    const rows = [...cells.entries()].filter(([k]) => k.endsWith(`|${q.id}`)).map(([, c]) => c);
    return {
      ...q,
      attempted: rows.length,
      passed: rows.filter((c) => c.passed).length,
      avgBest: avg(rows.map((c) => c.best)),
      attempts: rows.reduce((n, c) => n + c.attempts, 0),
    };
  });

  // hardest questions: how often students get each one right on their FIRST attempt
  const firstSeen = new Set<string>();
  const tally = new Map<string, { total: number; right: number }>();
  const questionsByQuiz = new Map<string, any[]>();
  for (const q of qRes.data ?? []) {
    const list = questionsByQuiz.get(q.quiz_id) ?? [];
    list.push(q);
    questionsByQuiz.set(q.quiz_id, list);
  }
  for (const a of attempts) {
    const key = `${a.user_id}|${a.quiz_id}`;
    if (firstSeen.has(key) || !a.answers) continue;
    firstSeen.add(key);
    for (const q of questionsByQuiz.get(a.quiz_id) ?? []) {
      const t = tally.get(q.id) ?? { total: 0, right: 0 };
      t.total += 1;
      if (isAnswerCorrect(q, (a.answers as Record<string, unknown>)[q.id])) t.right += 1;
      tally.set(q.id, t);
    }
  }
  const hardest = [...tally.entries()]
    .map(([id, t]) => {
      const q: any = (qRes.data ?? []).find((x: any) => x.id === id);
      const quiz = q ? quizById.get(q.quiz_id) : undefined;
      return {
        prompt: String(q?.prompt ?? ""),
        quiz: quiz?.title ?? "",
        kind: quiz?.kind ?? "concept",
        total: t.total,
        pct: Math.round((t.right / t.total) * 100),
      };
    })
    .sort((a, b) => a.pct - b.pct || b.total - a.total)
    .slice(0, 6);

  const pairsAttempted = cells.size;
  const pairsPassed = [...cells.values()].filter((c) => c.passed).length;
  const totals = {
    students: students.length,
    attempts: attempts.length,
    passRate: pairsAttempted ? Math.round((pairsPassed / pairsAttempted) * 100) : null,
    avgBest: avg([...cells.values()].map((c) => c.best)),
  };

  const attemptList: AttemptInfo[] = attempts.map((a) => ({
    user_id: a.user_id,
    quiz_id: a.quiz_id,
    score: Number(a.score),
    raw_score: Number(a.raw_score ?? a.score),
    penalty: Number(a.penalty ?? 0),
    passed: !!a.passed,
    taken_at: a.taken_at,
  }));

  return { quizzes, students, cells, quizStats, hardest, totals, attempts: attemptList };
}
