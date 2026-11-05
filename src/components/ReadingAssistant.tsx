import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { recommendReads, type Recommendation } from "@/lib/recommend.functions";
import { useStore } from "@/lib/store";

export function ReadingAssistant() {
  const ask = useServerFn(recommendReads);
  const { books } = useStore();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Recommendation | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim().length < 2 || busy) return;
    setBusy(true);
    try { setRes(await ask({ data: { query: q } })); }
    catch { setRes({ summary: "", books: [], posts: [], error: "Something went wrong. Try again." }); }
    finally { setBusy(false); }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10">
      <div className="rounded-2xl border bg-card p-6 sm:p-8">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-primary"><Sparkles className="h-3.5 w-3.5" /> AI Reading Guide</p>
        <h2 className="mt-2 font-display text-2xl sm:text-3xl">What would you like to read? · څه لوستل غواړئ؟</h2>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input value={q} onChange={(e) => setQ(e.target.value)} dir="auto" maxLength={500}
            placeholder="e.g. I want to learn programming · زه د ارواپوهنې کتابونه غواړم"
            className="flex-1 rounded-md border bg-background px-4 py-3 text-sm" />
          <button disabled={busy || q.trim().length < 2} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Find for me · ومومه
          </button>
        </form>

        {res?.error && <p className="mt-4 text-sm text-destructive">{res.error}</p>}
        {res && !res.error && (
          <div className="mt-6 space-y-5">
            {res.summary && <p dir="auto" className="text-sm leading-relaxed">{res.summary}</p>}
            {res.books.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {res.books.map((r) => {
                  const b = books.find((x) => x.id === r.id);
                  return (
                    <Link key={r.id} to="/books/$id" params={{ id: r.id }} className="flex gap-3 rounded-lg border p-3 hover:bg-muted">
                      {b?.coverUrl ? <img src={b.coverUrl} alt="" className="h-20 w-14 rounded object-cover" /> : <div className="h-20 w-14 rounded bg-muted" />}
                      <div>
                        <p className="font-display">{b?.title ?? "Book"}</p>
                        <p className="text-xs text-muted-foreground">{b?.author}</p>
                        <p dir="auto" className="mt-1 text-xs">{r.reason}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            {res.posts.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">From Learnova Explore</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {res.posts.map((r) => (
                    <Link key={r.id} to="/community" hash={r.id} className="rounded-lg border p-3 text-xs hover:bg-muted" dir="auto">{r.reason}</Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
