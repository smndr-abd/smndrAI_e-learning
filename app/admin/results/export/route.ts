import { requireAdmin } from "@/lib/admin";
import { loadResults } from "@/lib/results";

// Spreadsheet-safe cell: quotes are doubled, and cells that start with = + - @
// get a leading apostrophe so Excel/Sheets never run them as formulas.
function cell(v: string | number | null | undefined) {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  await requireAdmin();
  const { students, quizzes, cells } = await loadResults();

  const rows: string[] = [
    ["Student", "Email", "Phase", "Quiz", "Type", "Best score", "Attempts", "Status", "Last attempt"].map(cell).join(","),
  ];
  for (const s of students) {
    for (const q of quizzes) {
      const c = cells.get(`${s.id}|${q.id}`);
      rows.push(
        [
          s.name,
          s.email,
          q.phase,
          q.title,
          q.kind,
          c ? c.best : "",
          c ? c.attempts : 0,
          c ? (c.passed ? "passed" : "not passed") : "not started",
          c ? c.last.slice(0, 16).replace("T", " ") : "",
        ]
          .map(cell)
          .join(",")
      );
    }
  }

  return new Response("\uFEFF" + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="student-results.csv"',
      "Cache-Control": "no-store",
    },
  });
}
