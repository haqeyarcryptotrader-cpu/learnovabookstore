import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, fmtAfn, type Book, type Category } from "@/lib/books";
import { useStore } from "@/lib/store";
import { BookCover } from "@/components/BookCover";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Manage books — Learnova Books Store" },
      { name: "description", content: "Add, edit and remove books in the Learnova Books Store catalog." },
      { property: "og:title", content: "Manage books — Learnova Books Store" },
      { property: "og:description", content: "Store management panel for Learnova Books." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const empty: Book = { id: "", title: "", author: "", category: "Tech & AI", hardPrice: null, softPrice: null, coverUrl: "", description: "", inStock: true, pdfLink: "" };

function Admin() {
  const { books, saveBook, deleteBook, resetBooks } = useStore();
  const [edit, setEdit] = useState<Book | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Manage books</h1>
          <p className="text-sm text-muted-foreground">Changes are saved in this browser.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { if (confirm("Restore the original sample books?")) resetBooks(); }} className="rounded-md border px-4 py-2 text-sm">Reset samples</button>
          <button onClick={() => setEdit({ ...empty })} className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" /> Add book</button>
        </div>
      </div>

      <div className="mt-6 divide-y rounded-lg border bg-card">
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
            <button onClick={() => { if (confirm(`Delete "${b.title}"?`)) { deleteBook(b.id); toast("Book deleted"); } }} aria-label="Delete" className="rounded p-2 text-destructive hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {books.length === 0 && <p className="p-8 text-center text-muted-foreground">No books yet.</p>}
      </div>

      {edit && <Editor book={edit} onClose={() => setEdit(null)} onSave={(b) => { saveBook(b); setEdit(null); toast.success("Book saved"); }} />}
    </div>
  );
}

function Editor({ book, onClose, onSave }: { book: Book; onClose: () => void; onSave: (b: Book) => void }) {
  const [b, setB] = useState(book);
  const [err, setErr] = useState("");
  const field = "w-full rounded-md border bg-background px-3 py-2 text-sm";
  const num = (s: string) => (s.trim() === "" ? null : Math.max(0, Number(s)) || 0);

  const submit = () => {
    if (!b.title.trim() || !b.author.trim()) return setErr("Title and author are required.");
    if (b.hardPrice == null && b.softPrice == null) return setErr("Set at least one price (hard or soft copy).");
    const id = b.id || b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
    onSave({ ...b, id, title: b.title.trim(), author: b.author.trim() });
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
          <div className="sm:col-span-2"><L label="Cover image URL (optional)"><input className={field} value={b.coverUrl} placeholder="https://…" onChange={(e) => setB({ ...b, coverUrl: e.target.value })} /></L></div>
          <div className="sm:col-span-2"><L label="PDF / sample link (optional)"><input className={field} value={b.pdfLink} placeholder="https://…" onChange={(e) => setB({ ...b, pdfLink: e.target.value })} /></L></div>
          <div className="sm:col-span-2"><L label="Description"><textarea rows={3} className={field} value={b.description} maxLength={1000} onChange={(e) => setB({ ...b, description: e.target.value })} /></L></div>
        </div>
        {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
          <button onClick={submit} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Save</button>
        </div>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="text-xs text-muted-foreground">{label}</span>{children}</label>;
}
