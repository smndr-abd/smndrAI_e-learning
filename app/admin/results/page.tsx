import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { loadResults } from "@/lib/results";

const tone = (n: number | null) => (n === null ? "muted" : n >= 80 ? "good" : n >= 50 ? "mid" : "bad");
const pct = (n: number | null) => (n === null ? "-" : `${n}%`);
const day = (s: string | null) => (s ? s.slice(0, 10) : "-");

export default async function ResultsPage() {
  await requireAdmin();
  const { students, quizStats, hardest, totals } = await loadResults();

  return (
    <>
      <p className="crumb"><Link href="/admin">&larr; Course manager</Link></p>
      <div className="eyebrow">Instructor console</div>
      <h1 className="glitch" data-text="Student results">Student results</h1>

      <div className="stats">
        <div className="stat"><b>{totals.students}</b><span>Students</span></div>
        <div className="stat"><b>{totals.attempts}</b><span>Quiz attempts</span></div>
        <div className="stat"><b>{pct(totals.passRate)}</b><span>Pass rate</span></div>
        <div className="stat"><b>{pct(totals.avgBest)}</b><span>Avg best score</span></div>
      </div>
      <p>
        <a className="btn secondary" href="/admin/results/export">Download CSV</a>
      </p>

      <h2>Quizzes</h2>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Phase</th><th>Quiz</th><th>Type</th><th>Students</th><th>Passed</th><th>Pass rate</th><th>Avg best</th><th>Attempts</th>
            </tr>
          </thead>
          <tbody>
            {quizStats.map((q) => (
              <tr key={q.id}>
                <td className="num">{String(q.phase).padStart(2, "0")}</td>
                <td>{q.title}</td>
                <td><span className="badge">{q.kind === "coding" ? "Coding" : "Concept"}</span></td>
                <td>{q.attempted}</td>
                <td>{q.passed}</td>
                <td className={tone(q.attempted ? Math.round((q.passed / q.attempted) * 100) : null)}>
                  {q.attempted ? `${Math.round((q.passed / q.attempted) * 100)}%` : "-"}
                </td>
                <td className={tone(q.avgBest)}>{pct(q.avgBest)}</td>
                <td>{q.attempts}</td>
              </tr>
            ))}
            {quizStats.length === 0 && (
              <tr><td colSpan={8} className="muted">No quizzes yet. Did you run the SQL files?</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2>Students</h2>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th><th>Concept quizzes</th><th>Coding labs</th><th>Passed</th><th>Last active</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/admin/students/${s.id}`}>{s.name}</Link>
                  {s.email && s.email !== s.name && <div className="file-meta">{s.email}</div>}
                </td>
                <td className={tone(s.concept)}>{pct(s.concept)}</td>
                <td className={tone(s.coding)}>{pct(s.coding)}</td>
                <td>{s.passed} / {quizStats.length}</td>
                <td>{day(s.last)}</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan={5} className="muted">No students yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="muted">Concept and coding columns show the average of each student&apos;s best scores on the quizzes they tried.</p>

      <h2>Hardest questions</h2>
      {hardest.length === 0 ? (
        <p className="muted">Not enough attempts yet.</p>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr><th>Right on first try</th><th>Question</th><th>Quiz</th><th>Answers</th></tr>
            </thead>
            <tbody>
              {hardest.map((h, i) => (
                <tr key={i}>
                  <td className={tone(h.pct)}>{h.pct}%</td>
                  <td>{h.prompt}</td>
                  <td>{h.quiz}</td>
                  <td>{h.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
