import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Moon, Sun, ZoomIn, ZoomOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/reader/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Learnova Reader — Learnova Books Store" },
      { name: "description", content: "Read your purchased book online in the protected Learnova Reader." },
      { property: "og:title", content: "Learnova Reader" },
      { property: "og:description", content: "Protected online reader for Learnova Books." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReaderPage,
});

type Doc = { numPages: number; getPage: (n: number) => Promise<any> };

function ReaderPage() {
  const { id } = Route.useParams();
  const { books } = useStore();
  const book = books.find((b) => b.id === id);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [err, setErr] = useState("");
  const [who, setWho] = useState("");
  const [page, setPage] = useState(() => Number(localStorage.getItem(`lnv-page-${id}`)) || 1);
  const [zoom, setZoom] = useState(1.2);
  const [night, setNight] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { setErr("signin"); return; }
      setWho(s.session.user.email ?? "");
      const { data: link, error } = await supabase.rpc("reader_pdf_link", { _book_id: id });
      if (error || !link) { setErr("locked"); return; }
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const d = await pdfjs.getDocument({ url: link as string }).promise;
        setDoc(d as unknown as Doc);
      } catch { setErr("load"); }
    })();
  }, [id]);

  useEffect(() => {
    if (!doc || !canvas.current) return;
    const p = Math.min(Math.max(1, page), doc.numPages);
    localStorage.setItem(`lnv-page-${id}`, String(p));
    let task: { cancel: () => void } | null = null;
    doc.getPage(p).then((pg) => {
      const vp = pg.getViewport({ scale: zoom * (window.devicePixelRatio || 1) });
      const c = canvas.current!;
      c.width = vp.width; c.height = vp.height;
      c.style.width = `${vp.width / (window.devicePixelRatio || 1)}px`;
      task = pg.render({ canvasContext: c.getContext("2d")!, viewport: vp });
    });
    return () => task?.cancel();
  }, [doc, page, zoom, id]);

  const block = (e: React.SyntheticEvent) => e.preventDefault();

  if (err) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-muted-foreground">
          {err === "signin" ? "Please sign in to read your books." : err === "locked" ? "This book is not unlocked for you yet. Pay and send your receipt on WhatsApp — the admin will unlock it in My Library." : "The book could not be opened. Check your internet and try again."}
        </p>
        <Link to={err === "signin" ? "/account" : "/library"} className="mt-4 inline-block text-primary underline">{err === "signin" ? "Sign in" : "My Library"}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-2 py-4 select-none" onContextMenu={block} onCopy={block} onDragStart={block}>
      <div className="sticky top-16 z-10 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card/95 p-2 backdrop-blur">
        <Link to="/library" className="inline-flex items-center gap-1 text-sm"><ArrowLeft className="h-4 w-4" /> Library</Link>
        <p className="line-clamp-1 max-w-[40%] text-sm font-medium">{book?.title ?? "Learnova Reader"}</p>
        <div className="flex items-center gap-1">
          <button aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} className="rounded border p-1.5"><ZoomOut className="h-4 w-4" /></button>
          <button aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(3, z + 0.2))} className="rounded border p-1.5"><ZoomIn className="h-4 w-4" /></button>
          <button aria-label="Night mode" onClick={() => setNight((n) => !n)} className="rounded border p-1.5">{night ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
        </div>
      </div>
      {!doc ? <p className="py-24 text-center text-muted-foreground">Opening book…</p> : (
        <>
          <div className="relative mt-4 overflow-auto rounded-lg border bg-muted p-2">
            <div className="relative mx-auto w-fit">
              <canvas ref={canvas} className="block" style={night ? { filter: "invert(0.9) hue-rotate(180deg)" } : undefined} />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                <p className="-rotate-30 whitespace-nowrap text-2xl font-semibold text-primary/15">{who} · Learnova</p>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-3">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-md border p-2"><ChevronLeft className="h-5 w-5" /></button>
            <span className="text-sm">{Math.min(page, doc.numPages)} / {doc.numPages}</span>
            <button onClick={() => setPage((p) => Math.min(doc.numPages, p + 1))} className="rounded-md border p-2"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </>
      )}
    </div>
  );
}
