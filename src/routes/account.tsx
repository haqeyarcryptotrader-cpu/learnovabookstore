import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { CITIES, fmtAfn } from "@/lib/books";
import { fetchMyOrders, fetchMyProfile, saveMyProfile, type Profile } from "@/lib/db";
import { ReferralCard } from "@/components/ReferralCard";

export const Route = createFileRoute("/account")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My account — Learnova Books Store" },
      { name: "description", content: "Sign in to save your details and see your Learnova Books orders." },
      { property: "og:title", content: "My account — Learnova Books Store" },
      { property: "og:description", content: "Customer sign-in, saved delivery details and order history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

const field = "w-full rounded-md border bg-background px-3 py-2 text-sm";

function AccountPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  if (session === undefined) return <p className="p-10 text-center text-muted-foreground">Loading…</p>;
  return <div className="mx-auto max-w-2xl px-4 py-10">{session ? <Dashboard email={session.user.email ?? ""} /> : <AuthForm />}</div>;
}

function friendly(m: string) {
  if (/invalid login/i.test(m)) return "The email or password is incorrect. / ایمیل یا پاسورډ غلط دی.";
  if (/not confirmed/i.test(m)) return "Please confirm your email first — check your inbox.";
  if (/already registered/i.test(m)) return "This email already has an account. Please sign in.";
  if (/fetch|network/i.test(m)) return "Network problem — check your internet and try again.";
  return m;
}

function AuthForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(""); setNotice("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(friendly(error.message));
    } else {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin + "/account", data: { full_name: name } },
      });
      if (error) setError(friendly(error.message));
      else if (!data.session) setNotice("Account created! Check your email and tap the link to confirm. / خپل ایمیل وګورئ.");
    }
    setBusy(false);
  };

  const forgot = async () => {
    if (!email) { setError("Type your email first."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
    if (error) setError(friendly(error.message));
    else setNotice("We sent a reset link to your email.");
  };

  return (
    <div className="mx-auto max-w-md rounded-xl border bg-card p-6 shadow-sm">
      <h1 className="font-display text-3xl">{mode === "in" ? "Sign in" : "Create account"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{mode === "in" ? "خپل حساب ته ننوځئ" : "نوی حساب جوړ کړئ — ستاسو معلومات به خوندي وي"}</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "up" && (
          <label className="block text-sm font-medium">Full name / بشپړ نوم
            <input required className={field + " mt-1"} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
        )}
        <label className="block text-sm font-medium">Email address
          <input required type="email" className={field + " mt-1"} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <div>
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Password / پاسورډ</span>
            {mode === "in" && <button type="button" onClick={forgot} className="text-xs text-primary hover:underline">Forgot password?</button>}
          </div>
          <input required minLength={6} type={show ? "text" : "password"} className={field + " mt-1"} value={password}
            onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} />
          <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show password
          </label>
        </div>
        {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {notice && <p className="rounded-md bg-primary/10 p-3 text-sm">{notice}</p>}
        <button disabled={busy} className="w-full rounded-md bg-primary py-2.5 font-medium text-primary-foreground disabled:opacity-60">
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {mode === "in" ? "New customer? " : "Already have an account? "}
        <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(""); setNotice(""); }} className="font-medium text-primary hover:underline">
          {mode === "in" ? "Create account" : "Sign in"}
        </button>
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">You can also order without an account. You'll stay signed in on this device.</p>
    </div>
  );
}

type Order = Awaited<ReturnType<typeof fetchMyOrders>>[number];

function Dashboard({ email }: { email: string }) {
  const [p, setP] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetchMyProfile().then(setP).catch(() => {});
    fetchMyOrders().then(setOrders).catch(() => {});
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p) return;
    setBusy(true);
    try { await saveMyProfile(p); toast.success("Saved / خوندي شو"); }
    catch { toast.error("Could not save. Try again."); }
    setBusy(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">My account</h1>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <Link to="/library" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">My Library / زما کتابتون</Link>
        <button onClick={() => supabase.auth.signOut()} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Sign out / وتل</button>
      </div>

      <form onSubmit={save} className="space-y-3 rounded-xl border bg-card p-5">
        <h2 className="font-display text-xl">My details / زما معلومات</h2>
        <p className="text-xs text-muted-foreground">These fill in automatically when you order. / د ارډر پر وخت پخپله ډکېږي.</p>
        {!p ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <>
            <input className={field} placeholder="Full name / نوم" value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} />
            <input className={field} placeholder="WhatsApp number / واټساپ شمېره" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} />
            <select className={field} value={p.city} onChange={(e) => setP({ ...p, city: e.target.value })}>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <textarea className={field} rows={2} placeholder="Delivery address / پته" value={p.address} onChange={(e) => setP({ ...p, address: e.target.value })} />
            <button disabled={busy} className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">{busy ? "Saving…" : "Save / خوندي کړئ"}</button>
          </>
        )}
      </form>
<ReferralCard />
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-display text-xl">My orders / زما ارډرونه</h2>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No orders yet. <Link to="/" className="text-primary hover:underline">Browse books</Link></p>
        ) : (
          <ul className="mt-3 divide-y">
            {orders.map((o) => (
              <li key={o.id} className="py-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">{o.status}</span>
                </div>
                <div className="mt-1">{(o.items as { title: string; format: string; qty: number }[]).map((i) => `${i.title} (${i.format === "hard" ? "Hard copy" : "PDF"}) ×${i.qty}`).join(", ")}</div>
                <div className="mt-1 font-medium">{fmtAfn(Number(o.total_afn))}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
