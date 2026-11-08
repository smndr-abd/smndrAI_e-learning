import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitQuiz } from "@/app/courses/actions";
import {
  PASS_MARK, RETRY_MARK, PENALTY_STEP, PENALTY_CAP, COOLDOWN_MINUTES,
  quizState, outcome, type AttemptRow,
} from "@/lib/quiz";

type Attempt = AttemptRow & { penalty: number | string | null };

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: { slug: string; quizId: string };
  searchParams: { attempt?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS: returns the quiz only if the student is enrolled in the course.
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title")
    .eq("id", params.quizId)
    .maybeSingle();

  if (!quiz) {
    return (
      <>
        <h1 className="glitch" data-text="Access denied">Access denied</h1>
        <div className="notice error">Enroll in the course to unlock this quiz.</div>
        <Link className="btn" href={`/courses/${params.slug}`}>Back to the course</Link>
      </>
    );
  }

  const admin = createAdminClient();

  // All earlier attempts (newest first) decide the penalty and the waiting time.
  const { data: pastRows } = await supabase
    .from("quiz_attempts")
    .select("score, raw_score, penalty, passed, taken_at")
    .eq("quiz_id", quiz.id)
    .order("taken_at", { ascending: false });
  const past = (pastRows ?? []) as Attempt[];
  const state = quizState(past);

  // ---------- RESULT VIEW ----------
  if (searchParams.attempt) {
    const { data: attempt } = await supabase
      .from("quiz_attempts")
      .select("id, quiz_id, score, raw_score, penalty, passed, answers")
      .eq("id", searchParams.attempt)
      .maybeSingle();

    if (attempt && attempt.quiz_id === quiz.id) {
      const { data: questions } = await admin
        .from("quiz_questions")
        .select("id, position, prompt, options, correct_index, explanation")
        .eq("quiz_id", quiz.id)
        .order("position");

      const finalScore = Number(attempt.score);
      const rawScore = Number(attempt.raw_score ?? attempt.score);
      const penalty = Number(attempt.penalty ?? 0);
      const result = outcome(finalScore, rawScore);
      const answers = (attempt.answers ?? {}) as Record<string, number | null>;

      const title =
        result === "passed" ? "Checkpoint passed" : result === "retry" ? "Almost there" : "Review required";

      return (
        <>
          <p className="crumb"><Link href={`/courses/${params.slug}`}>&larr; Back to the course</Link></p>
          <div className="eyebrow">{quiz.title}</div>
          <h1 className="glitch" data-text={title}>{title}</h1>

          <div className="card">
            <div className={result === "passed" ? "score" : "score fail"}>{finalScore}%</div>
            <p className="muted" style={{ marginTop: 12 }}>
              Raw score {rawScore}%{penalty > 0 ? ` // retry penalty -${penalty}` : ""} // pass mark {PASS_MARK}%
            </p>

            {result === "passed" && <p>You reached {PASS_MARK}%. Nice work, keep going.</p>}
            {result === "retry" && (
              <p>
                You are between {RETRY_MARK}% and {PASS_MARK - 1}%, so you can retry right now.
                {state.penalty > 0 && ` Your next attempt carries a -${state.penalty} point penalty, but a perfect score still passes.`}
              </p>
            )}
            {result === "review" && (
              <p>
                Your raw score was below {RETRY_MARK}%. Review the lessons of this phase first.
                You can retry in {state.waitMinutes || COOLDOWN_MINUTES} minutes.
              </p>
            )}

            <div className="row">
              {result === "passed" ? (
                <Link className="btn" href={`/courses/${params.slug}`}>Continue course</Link>
              ) : (
                <>
                  {result === "retry" && (
                    <Link className="btn" href={`/courses/${params.slug}/quiz/${quiz.id}`}>Retry quiz</Link>
                  )}
                  <Link className="btn secondary" href={`/courses/${params.slug}`}>Review the lessons</Link>
                </>
              )}
            </div>
          </div>

          <h2>Review</h2>
          {(questions ?? []).map((q, i) => {
            const picked = answers[q.id];
            return (
              <div className="card" key={q.id}>
                <div className="q-num">Question {i + 1}</div>
                <p>{q.prompt}</p>
                {(q.options as string[]).map((o, idx) => {
                  const isRight = idx === q.correct_index;
                  const isPicked = idx === picked;
                  const cls = isRight ? "opt right" : isPicked ? "opt wrong" : "opt";
                  return (
                    <div className={cls} key={idx}>
                      {isRight ? "✔ " : isPicked ? "✘ " : ""}
                      {o}
                      {isPicked && <span className="badge">Your answer</span>}
                    </div>
                  );
                })}
                {q.explanation && <p className="explain">{q.explanation}</p>}
              </div>
            );
          })}
        </>
      );
    }
  }

  // ---------- QUIZ PAGE (rules, history, form) ----------
  // The correct answers are NOT selected here, so they never reach the browser.
  const { data: questions } = await admin
    .from("quiz_questions")
    .select("id, position, prompt, options")
    .eq("quiz_id", quiz.id)
    .order("position");

  const bestPassed = Math.max(0, ...past.filter((a) => a.passed).map((a) => Number(a.score)));

  return (
    <>
      <p className="crumb"><Link href={`/courses/${params.slug}`}>&larr; Back to the course</Link></p>
      <div className="eyebrow">Checkpoint</div>
      <h1 className="glitch" data-text={quiz.title}>{quiz.title}</h1>

      <div className="card">
        <h3>Rules</h3>
        <ul className="lessons">
          <li>{PASS_MARK}% or more: <b>passed</b>.</li>
          <li>
            {RETRY_MARK}% to {PASS_MARK - 1}%: <b>retry right away</b>, with a -{PENALTY_STEP} point penalty for each
            earlier failed attempt (max -{PENALTY_CAP}). A perfect score always passes.
          </li>
          <li>Below {RETRY_MARK}%: review the lessons and wait {COOLDOWN_MINUTES} minutes before retrying.</li>
        </ul>
      </div>

      {state.passedBefore && (
        <div className="notice ok">
          You already passed this checkpoint (best {bestPassed}%). Retakes are practice only and never lower your result.
        </div>
      )}
      {!state.passedBefore && state.penalty > 0 && state.waitMinutes === 0 && (
        <div className="notice warn">
          Your next attempt carries a -{state.penalty} point penalty. Study first, then go for a perfect score.
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2>Your attempts</h2>
          <ul className="lessons">
            {past.slice(0, 8).map((a, i) => (
              <li key={i}>
                Attempt {past.length - i}: <b>{Number(a.score)}%</b>
                <span className="muted">
                  {" "}(raw {Number(a.raw_score ?? a.score)}%{Number(a.penalty ?? 0) > 0 ? `, penalty -${Number(a.penalty)}` : ""})
                </span>
                {a.passed && <span className="badge done">Passed</span>}
              </li>
            ))}
          </ul>
        </>
      )}

      {state.waitMinutes > 0 ? (
        <div className="card">
          <h3>Review time</h3>
          <p>
            Your last raw score was below {RETRY_MARK}%. Go back over the lessons of this phase.
            You can retry in about <b>{state.waitMinutes} minutes</b>.
          </p>
          <Link className="btn secondary" href={`/courses/${params.slug}`}>Open the lessons</Link>
        </div>
      ) : (
        <>
          <h2>Questions</h2>
          <form action={submitQuiz}>
            <input type="hidden" name="quizId" value={quiz.id} />
            <input type="hidden" name="slug" value={params.slug} />
            {(questions ?? []).map((q, i) => (
              <div className="card" key={q.id}>
                <div className="q-num">Question {i + 1}</div>
                <p>{q.prompt}</p>
                {(q.options as string[]).map((o, idx) => (
                  <label className="opt" key={idx}>
                    <input type="radio" name={`q_${q.id}`} value={idx} required />
                    <span>{o}</span>
                  </label>
                ))}
              </div>
            ))}
            <button className="btn" type="submit">Submit answers</button>
          </form>
        </>
      )}
    </>
  );
}
