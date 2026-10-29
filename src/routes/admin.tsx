import { createFileRoute } from "@tanstack/react-router";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useEffect, useState } from "react";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, fmtAfn, fmtUsd, type Book, type Category } from "@/lib/books";
import { useStore } from "@/lib/store";
import { BookCover } from "@/components/BookCover";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Manage books — Learnova Books Store" },
      { name: "description", content: "Add, edit and remove books in the Learnova Books Store catalog." },
      { property: "og:title", content: "Manage books — Learnova Books Store" },
      { property: "og:description", content: "Store management panel for Learnova Books." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminGate,
});

const empty: Book = { id: "", title: "", author: "", category: "Tech & AI", hardPrice: null, softPrice: null, coverUrl: "", description: "", inStock: true, pdfLink: "" };

function AdminGate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (session === undefined) return <p className="p-10 text-center text-muted-foreground">Loading…</p>;
  if (!session) return <Login />;
  if (isAdmin === null) return <p className="p-10 text-center text-muted-foreground">Checking access…</p>;
  if (!isAdmin)
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p>This account ({session.user.email}) is not a store admin.</p>
        <button onClick={() => supabase.auth.signOut()} className="mt-4 rounded-md border px-4 py-2 text-sm">Sign out</button>
      </div>
    );
  return <Admin email={session.user.email ?? ""} />;
}

function friendly(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "The email or password is incorrect.";
  if (m.includes("not confirmed")) return "Please confirm your email first — check your inbox for our link.";
  if (m.includes("already registered")) return "An account with this email already exists. Please sign in.";
  if (m.includes("fetch") || m.includes("network")) return "Can't reach the server. Check your connection and try again.";
  return msg;
}

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const field = "w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(""); setNotice("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setError(friendly(error.message));
    } else {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin + "/admin" } });
      if (error) setError(friendly(error.message));
      else if (!data.session) { setNotice("Account created. Check your email and tap the confirmation link, then sign in."); setMode("in"); }
    }
    setBusy(false);
  };

  const forgot = async () => {
    setError(""); setNotice("");
    if (!email.trim()) { setError("Enter your email address first."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + "/reset-password" });
    if (error) setError(friendly(error.message)); else setNotice("A password reset link has been sent to your email.");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="font-display text-3xl">{mode === "in" ? "Sign in" : "Create admin account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "in" ? "Welcome back. Sign in to manage your store." : "The first account created becomes the store admin."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">Email address</label>
            <input id="email" type="email" autoComplete="email" required placeholder="you@example.com" className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              {mode === "in" && <button type="button" onClick={forgot} className="text-xs text-primary hover:underline">Forgot password?</button>}
            </div>
            <input id="password" type={show ? "text" : "password"} autoComplete={mode === "in" ? "current-password" : "new-password"} required minLength={6} placeholder="At least 6 characters" className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
            <label className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-4 w-4" /> Show password
            </label>
          </div>
          {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          {notice && <p className="rounded-md border bg-muted px-3 py-2 text-sm">{notice}</p>}
          <button disabled={busy} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
          </button>
          <p className="text-center text-xs text-muted-foreground">You'll stay signed in on this device until you sign out.</p>
        </form>
        <div className="mt-6 border-t pt-4 text-center text-sm text-muted-foreground">
          {mode === "in" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(""); setNotice(""); }} className="font-medium text-primary hover:underline">
            {mode === "in" ? "Create one" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Order {
  id: string; customer_name: string; phone: string; city: string; address: string;
  payment_method: string; items: { title: string; format: string; qty: number; price: number }[];
  total_afn: number; status: string; created_at: string;
}

function Orders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const load = () => supabase.from("orders").select("*").order("created_at", { ascending: false }).then(({ data }) => setOrders((data as unknown as Order[]) ?? []));
  useEffect(() => { load(); }, []);
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else load();
  };
  if (!orders) return <p className="p-8 text-center text-muted-foreground">Loading orders…</p>;
  if (orders.length === 0) return <p className="mt-6 rounded-lg border p-8 text-center text-muted-foreground">No orders yet.</p>;
  return (
    <div className="mt-6 space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="rounded-lg border bg-card p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{o.customer_name} · {o.phone}</p>
            <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="rounded-md border bg-background px-2 py-1 text-xs">
              {["new", "paid", "shipped", "delivered", "cancelled"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.payment_method}{o.city ? ` · ${o.city}, ${o.address}` : ""}</p>
          <ul className="mt-2 list-disc pl-5">
            {o.items.map((i, k) => <li key={k}>{i.title} — {i.format === "hard" ? "Hard Copy" : "PDF"} × {i.qty} = {fmtAfn(i.price * i.qty)}</li>)}
          </ul>
          <p className="mt-1 font-semibold">Total: {fmtAfn(Number(o.total_afn))} ({fmtUsd(Number(o.total_afn))})</p>
        </div>
      ))}
    </div>
  );
}

function Admin({ email }: { email: string }) {
  const { books, saveBook, deleteBook } = useStore();
  const [edit, setEdit] = usePersistentState<Book | null>("lnv-edit", null);
  const [tab, setTab] = usePersistentState<"books" | "orders">("lnv-tab", "books");

  const tabBtn = (t: typeof tab, label: string) => (
    <button onClick={() => setTab(t)} className={`rounded-md px-4 py-2 text-sm ${tab === t ? "bg-primary text-primary-foreground" : "border"}`}>{label}</button>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Store admin</h1>
          <p className="text-sm text-muted-foreground">Signed in as {email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabBtn("books", "Books")}
          {tabBtn("orders", "Orders")}
          <button onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-1 rounded-md border px-4 py-2 text-sm"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </div>

      {tab === "orders" ? <Orders /> : (
        <>
          <div className="mt-6 flex justify-end">
            <button onClick={() => setEdit({ ...empty })} className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" /> Add book</button>
          </div>
          <div className="mt-3 divide-y rounded-lg border bg-card">
            {books.map((b) => (
              <div key={b.id} className="flex items-center gap-4 p-3">
                <BookCover book={b} className="w-12 shrink-0 p-1 [&_h3]:text-[7px] [&_span]:hidden" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{b.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.author} · {b.category}</p>
                  <p className="text-xs text-muted-foreground">
                    Hard: {b.hardPrice != null ? fmtAfn(b.hardPrice) : "—"} · PDF: {b.softPrice != null ? fmtAfn(b.softPrice) : "—"} · {b.inStock ? "In stock" : "Out of stock"}
                  </p>
                </div>
                <button onClick={() => setEdit({ ...b })} aria-label="Edit" className="rounded p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                <button onClick={async () => { if (confirm(`Delete "${b.title}"?`)) { try { await deleteBook(b.id); toast("Book deleted"); } catch (e) { toast.error((e as Error).message); } } }} aria-label="Delete" className="rounded p-2 text-destructive hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            {books.length === 0 && <p className="p-8 text-center text-muted-foreground">No books yet.</p>}
          </div>
        </>
      )}

      {edit && <Editor book={edit} onClose={() => setEdit(null)} onSave={async (b) => { try { await saveBook(b); setEdit(null); toast.success("Book saved"); } catch (e) { toast.error((e as Error).message); } }} />}
    </div>
  );
}

function Editor({ book, onClose, onSave }: { book: Book; onClose: () => void; onSave: (b: Book) => void }) {
  const [b, setB] = usePersistentState("lnv-draft-" + (book.id || "new"), book);
  const [err, setErr] = useState("");
  const field = "w-full rounded-md border bg-background px-3 py-2 text-sm";
  const num = (s: string) => (s.trim() === "" ? null : Math.max(0, Number(s)) || 0);

  const submit = () => {
    if (!b.title.trim() || !b.author.trim()) return setErr("Title and author are required.");
    if (b.hardPrice == null && b.softPrice == null) return setErr("Set at least one price (hard or soft copy).");
    const id = b.id || b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
    localStorage.removeItem("lnv-draft-" + (book.id || "new")); onSave({ ...b, id, title: b.title.trim(), author: b.author.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-background p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl">{book.id ? "Edit book" : "Add book"}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <L label="Title"><input className={field} value={b.title} maxLength={150} onChange={(e) => setB({ ...b, title: e.target.value })} /></L>
          <L label="Author"><input className={field} value={b.author} maxLength={120} onChange={(e) => setB({ ...b, author: e.target.value })} /></L>
          <L label="Hard copy price (AFN, blank = none)"><input type="number" min={0} className={field} value={b.hardPrice ?? ""} onChange={(e) => setB({ ...b, hardPrice: num(e.target.value) })} /></L>
          <L label="Soft copy price (AFN, blank = none)"><input type="number" min={0} className={field} value={b.softPrice ?? ""} onChange={(e) => setB({ ...b, softPrice: num(e.target.value) })} /></L>
          <L label="Category">
            <select className={field} value={b.category} onChange={(e) => setB({ ...b, category: e.target.value as Category })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </L>
          <L label="In stock (hard copy)">
            <label className="flex h-[38px] items-center gap-2 text-sm"><input type="checkbox" checked={b.inStock} onChange={(e) => setB({ ...b, inStock: e.target.checked })} /> Available</label>
          </L>
          <div className="sm:col-span-2">
            <Uploader label="Cover image / د پوښ عکس" accept="image/*" bucket="book-covers" value={b.coverUrl} onChange={(url) => setB({ ...b, coverUrl: url })} preview />
          </div>
          <div className="sm:col-span-2">
            <Uploader label="PDF file / پي ډي اف فایل" accept="application/pdf" bucket="book-files" value={b.pdfLink} onChange={(url) => setB({ ...b, pdfLink: url })} />
          </div>
          <div className="sm:col-span-2"><L label="Description"><textarea rows={3} className={field} value={b.description} maxLength={1000} onChange={(e) => setB({ ...b, description: e.target.value })} /></L></div>
        </div>
        {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => { localStorage.removeItem("lnv-draft-" + (book.id || "new")); onClose(); }} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
          <button onClick={submit} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Save</button>
        </div>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="text-xs text-muted-foreground">{label}</span>{children}</label>;
}

// Buckets are private (workspace blocks public ones), so we store a long-lived signed URL.
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

function Uploader({ label, accept, bucket, value, onChange, preview }: {
  label: string; accept: string; bucket: string; value: string; onChange: (url: string) => void; preview?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const signed = await supabase.storage.from(bucket).createSignedUrl(path, TEN_YEARS);
      if (signed.error) throw signed.error;
      onChange(signed.data.signedUrl);
      toast.success("Uploaded / اپلوډ شو");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3 rounded-md border p-3">
        {preview && value && <img src={value} alt="" className="h-16 w-11 rounded object-cover" />}
        {!preview && value && <a href={value} target="_blank" rel="noreferrer" className="text-sm underline">Open PDF</a>}
        <label className="cursor-pointer rounded-md bg-secondary px-3 py-2 text-sm">
          {busy ? "Uploading… / اپلوډ کېږي" : value ? "Change / بدل کړئ" : "Choose file / فایل وټاکئ"}
          <input type="file" accept={accept} className="hidden" disabled={busy} onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {value && <button type="button" onClick={() => onChange("")} className="text-sm text-destructive">Remove</button>}
      </div>
    </div>
  );
}
