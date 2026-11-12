import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { loadResults } from "@/lib/results";

export default async function StudentPage({ params }: { params: { userId: string } }) {
  await requireAdmin();
  const { students, quizzes, cells, attempts } = await loadResults();

  const student = students.find((s) => s.id === params.userId);
  if (!student) notFound();

  const titleOf = new Map(quizzes.map((q) => [q.id, q.title]));
  const history = attempts
    .filter((a) => a.user_id === student.id)
    .sort((a, b) => b.taken_at.localeCompare(a.taken_at));

  return (
    <>
      <p className="crumb"><Link href="/admin/results">&larr; Student results</Link></p>
      <div className="eyebrow">Student</div>
      <h1>{student.name}</h1>
      {student.email && <p className="muted">{student.email}</p>}

      <h2>Every quiz</h2>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr><th>Phase</th><th>Quiz</th><th>Type</th><th>Best</th><th>Attempts</th><th>Status</th><th>Last try</th></tr>
          </thead>
          <tbody>
            {quizzes.map((q) => {
              const c = cells.get(`${student.id}|${q.id}`);
              return (
                <tr key={q.id}>
                  <td className="num">{String(q.phase).padStart(2, "0")}</td>
                  <td>{q.title}</td>
                  <td><span className="badge">{q.kind === "coding" ? "Coding" : "Concept"}</span></td>
                  <td className={c ? (c.best >= 80 ? "good" : c.best >= 50 ? "mid" : "bad") : "muted"}>
                    {c ? `${c.best}%` : "-"}
                  </td>
                  <td>{c ? c.attempts : 0}</td>
                  <td>
                    {c ? (
                      c.passed ? <span className="badge done">Passed</span> : <span className="badge lock">Not passed</span>
                    ) : (
                      <span className="muted">Not started</span>
                    )}
                  </td>
                  <td>{c ? c.last.slice(0, 10) : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2>Attempt history</h2>
      {history.length === 0 ? (
        <p className="muted">No attempts yet.</p>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr><th>When</th><th>Quiz</th><th>Final</th><th>Raw</th><th>Penalty</th><th>Result</th></tr>
            </thead>
            <tbody>
              {history.map((a, i) => (
                <tr key={i}>
                  <td>{a.taken_at.slice(0, 16).replace("T", " ")}</td>
                  <td>{titleOf.get(a.quiz_id) ?? ""}</td>
                  <td><b>{a.score}%</b></td>
                  <td>{a.raw_score}%</td>
                  <td>{a.penalty > 0 ? `-${a.penalty}` : "-"}</td>
                  <td>{a.passed ? <span className="badge done">Passed</span> : <span className="badge lock">Not passed</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
