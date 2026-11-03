import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ImagePlus, PenLine, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function Avatar({ name }: { name: string }) {
  return <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 font-medium text-primary">{(name || "?").charAt(0).toUpperCase()}</div>;
}

export function Composer({ userId, name, onPosted }: { userId: string; name: string; onPosted: () => void }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : "");
  }

  async function submit() {
    if (!text.trim() && !file) return;
    setBusy(true); setErr(""); setDone(false);
    try {
      let image_url = "";
      if (file) {
        const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const up = await supabase.storage.from("post-images").upload(path, file);
        if (up.error) throw up.error;
        const s = await supabase.storage.from("post-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (s.error) throw s.error;
        image_url = s.data.signedUrl;
      }
      const { error } = await supabase.from("community_posts").insert({ user_id: userId, author_name: name, content: text.trim(), image_url });
      if (error) throw error;
      setText(""); pick(null); setDone(true); onPosted();
    } catch (e) {
      setErr("Could not post. Please try again. · پوسټ ونشو، بیا هڅه وکړئ.");
      console.error(e);
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <Avatar name={name} />
        <span className="text-sm font-medium">{name}</span>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
        placeholder="What's on your mind? · څه فکر کوئ؟"
        className="mt-3 w-full resize-none rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
      {preview && (
        <div className="relative mt-2">
          <img src={preview} alt="" className="max-h-80 w-full rounded-md object-cover" />
          <button onClick={() => pick(null)} aria-label="Remove image" className="absolute right-2 top-2 rounded-full bg-background/90 p-1"><X className="h-4 w-4" /></button>
        </div>
      )}
      {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
      {done && <p className="mt-2 rounded-md border bg-muted px-3 py-2 text-sm">Posted! It will appear here once the admin approves it. · پوسټ شو! د امین له تایید وروسته به دلته ښکاري.</p>}
      <div className="mt-3 flex items-center justify-between">
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        <button onClick={() => inputRef.current?.click()} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
          <ImagePlus className="h-5 w-5 text-primary" /> Photo · عکس
        </button>
        <button onClick={submit} disabled={busy || (!text.trim() && !file)}
          className="rounded-md bg-primary px-5 py-2 text-sm text-primary-foreground disabled:opacity-50">
          {busy ? "Posting…" : "Post · خپرول"}
        </button>
      </div>
    </div>
  );
}

/**
 * Home-page posting bar. Loads the current session itself; signed-out users
 * see a sign-in prompt, signed-in users see a compact bar that expands into
 * the full composer.
 */
export function PostBar({ className = "" }: { className?: string }) {
  const [state, setState] = useState<"loading" | "guest" | "ready">("loading");
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      if (!u) { setState("guest"); return; }
      setUserId(u.id);
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", u.id).maybeSingle();
      setName(prof?.full_name || u.email?.split("@")[0] || "Reader");
      setState("ready");
    });
    const { data } = supabase.auth.onAuthStateChange(() => setState("loading"));
    return () => data.subscription.unsubscribe();
  }, []);

  if (state === "loading") return null;

  return (
    <section className={className}>
      {state === "guest" ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">Share your ideas with the community · خپلې لیکنې ټولنې سره شریک کړئ</p>
          <Link to="/account" className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Sign in / ننوتل</Link>
        </div>
      ) : open ? (
        <div>
          <Composer userId={userId} name={name} onPosted={() => {}} />
          <div className="mt-2 text-right">
            <button onClick={() => setOpen(false)} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
              Close · بندول
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left hover:bg-muted/50">
          <PenLine className="h-5 w-5 text-primary" />
          <span className="flex-1 text-sm text-muted-foreground">What's on your mind? · څه فکر کوئ؟</span>
          <span className="hidden rounded-md border px-3 py-1.5 text-xs text-muted-foreground sm:block">Post · خپرول</span>
        </button>
      )}
    </section>
  );
}
