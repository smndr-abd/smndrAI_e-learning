// ===== QUIZ RULES (change the numbers here and the whole site follows) =====
export const PASS_MARK = 80;        // final score needed to pass
export const RETRY_MARK = 50;       // raw score needed to retry right away
export const PENALTY_STEP = 10;     // points taken off for each failed attempt before
export const PENALTY_CAP = 20;      // the penalty never goes above this (a perfect score still passes)
export const COOLDOWN_MINUTES = 60; // wait time after a raw score below RETRY_MARK

export type AttemptRow = {
  score: number | string;           // final score (after penalty)
  raw_score: number | string | null; // score before penalty
  passed: boolean;
  taken_at: string;
};

// attempts must be sorted newest first
export function quizState(attempts: AttemptRow[]) {
  const passedBefore = attempts.some((a) => a.passed);
  const failed = attempts.filter((a) => !a.passed).length;
  // once passed, extra attempts are just practice: no penalty
  const penalty = passedBefore ? 0 : Math.min(PENALTY_CAP, PENALTY_STEP * failed);

  let waitMinutes = 0;
  const last = attempts[0];
  if (!passedBefore && last) {
    const raw = Number(last.raw_score ?? last.score);
    if (raw < RETRY_MARK) {
      const elapsed = (Date.now() - new Date(last.taken_at).getTime()) / 60000;
      waitMinutes = Math.max(0, Math.ceil(COOLDOWN_MINUTES - elapsed));
    }
  }
  return { passedBefore, failed, penalty, waitMinutes };
}

export function outcome(finalScore: number, rawScore: number): "passed" | "retry" | "review" {
  if (finalScore >= PASS_MARK) return "passed";
  if (rawScore >= RETRY_MARK) return "retry";
  return "review";
}
