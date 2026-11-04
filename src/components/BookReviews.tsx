import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Review { id: string; book_id: string; user_id: string; author_name: string; rating: number; content: string; created_at: string }

export function Stars({ value, size = 16, onChange }: { value: number; size?: number; onChange?: (n: number) => void }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Star style={{ width: size, height: size }} className={n <= Math.round(value) ? "fill-primary text-primary" : "text-muted-foreground/40"} />;
        return onChange
          ? <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} stars`} className="p-0.5">{icon}</button>
          : <span key={n}>{icon}</span>;
      })}
    </span>
  );
}

/** Loads rating summaries for all books (used on catalog cards). */
export function useRatingSummaries() {
  const [map, setMap] = useState<Record<string, { avg: number; count: number }>>({});
  useEffect(() => {
    supabase.from("book_reviews").select("book_id, rating").then(({ data }) => {
      const acc: Record<string, { sum: number; count: number }> = {};
      for (const r of data ?? []) { const a = (acc[r.book_id] ??= { sum: 0, count: 0 }); a.sum += r.rating; a.count++; }
      setMap(Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, { avg: v.sum / v.count, count: v.count }])));
    });
  }, []);
  return map;
}

export function BookReviews({ bookId }: { bookId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("book_reviews").select("*").eq("book_id", bookId).order("created_at", { ascending: false });
    setReviews((data ?? []) as Review[]);
  };

  useEffect(() => {
    load();
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      if (!u) return;
      setUserId(u.id);
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", u.id).maybeSingle();
      setName(p?.full_name || u.email?.split("@")[0] || "Reader");
      const { data: adm } = await supabase.rpc("has_role", { _user_id: u.id, _role: "admin" });
      setIsAdmin(!!adm);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const mine = reviews.find((r) => r.user_id === userId);
  useEffect(() => { if (mine) { setRating(mine.rating); setText(mine.content); } }, [mine?.id]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const submit = async () => {
    if (!userId) return;
    if (rating < 1) { toast.error("Please choose 1–5 stars · ستوري وټاکئ"); return; }
    setBusy(true);
    const { error } = await supabase.from("book_reviews").upsert(
      { book_id: bookId, user_id: userId, author_name: name, rating, content: text.trim().slice(0, 2000) },
      { onConflict: "book_id,user_id" },
    );
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks for your review! · مننه");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const { error } = await supabase.from("book_reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (mine?.id === id) { setRating(0); setText(""); }
    load();
  };

  return (
    <section className="mt-12 border-t pt-8">
      <h2 className="font-display text-2xl">Reviews · نظرونه</h2>
      <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
        <Stars value={avg} size={20} />
        <span>{reviews.length ? `${avg.toFixed(1)} / 5 · ${reviews.length} review${reviews.length > 1 ? "s" : ""}` : "No reviews yet · تر اوسه نظر نشته"}</span>
      </div>

      <div className="mt-6 rounded-lg border bg-card p-5">
        {userId ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">{mine ? "Edit your review · خپل نظر سم کړئ" : "Write a review · خپل نظر ولیکئ"}</p>
            <Stars value={rating} size={26} onChange={setRating} />
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={2000}
              placeholder="What did you think of this book? · د دې کتاب په اړه مو نظر څه دی؟"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <button onClick={submit} disabled={busy} className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {busy ? "Saving…" : mine ? "Update review" : "Post review · خپرول"}
            </button>
          </div>
        ) : (
          <p className="text-sm">
            <Link to="/account" className="font-medium text-primary underline">Sign in</Link> to rate and review this book · د نظر لپاره ننوځئ
          </p>
        )}
      </div>

      <ul className="mt-6 space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{r.author_name || "Reader"}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Stars value={r.rating} size={14} /> {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
              {(r.user_id === userId || isAdmin) && (
                <button onClick={() => remove(r.id)} aria-label="Delete review" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
            {r.content && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{r.content}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
