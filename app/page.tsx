import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

export default async function Home() {
  const supabase = createClient();
  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, slug, title, description, price_cents")
    .order("created_at");

  return (
    <>
      <section className="hero">
        <div className="eyebrow">System online</div>
        <h1 className="glitch" data-text="From Python to production AI agents">
          From Python to production AI agents
        </h1>
        <p className="lead">
          A project-based path: Python foundations, LLM apps, RAG, agents, MCP and deployment.
        </p>
        <div className="stats">
          <div className="stat"><b>04</b><span>Phases</span></div>
          <div className="stat"><b>09</b><span>Months</span></div>
          <div className="stat"><b>03</b><span>Portfolio builds</span></div>
        </div>
      </section>

      <h2 id="courses">Courses</h2>
      {error && <div className="notice error">{error.message}</div>}
      {!error && (courses ?? []).length === 0 && (
        <p className="muted">No courses yet. Did you run seed.sql?</p>
      )}
      {(courses ?? []).map((c) => (
        <div className="card" key={c.id}>
          <h3>{c.title}</h3>
          <p className="muted">{c.description}</p>
          <div className="row">
            <Link className="btn" href={`/courses/${c.slug}`}>Initialize</Link>
            <span className="price">{formatPrice(c.price_cents)}</span>
          </div>
        </div>
      ))}
    </>
  );
}