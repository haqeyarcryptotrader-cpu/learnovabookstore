import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { BookCover } from "@/components/BookCover";

export const Route = createFileRoute("/library")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Library — Learnova Books Store" },
      { name: "description", content: "Read the PDF books you bought in the Learnova Reader." },
      { property: "og:title", content: "My Library — Learnova Books Store" },
      { property: "og:description", content: "Your purchased books, ready to read online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { books } = useStore();
  const [ids, setIds] = useState<string[] | null>(null);
  const [signedIn, setSignedIn] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setSignedIn(false); setIds([]); return; }
      const { data: rows } = await supabase.from("book_access").select("book_id").eq("user_id", data.session.user.id);
      setIds((rows ?? []).map((r) => r.book_id));
    });
  }, []);

  const mine = books.filter((b) => ids?.includes(b.id));
  const free = books.filter((b) => b.softPrice === 0 && !ids?.includes(b.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl">My Library · زما کتابتون</h1>
      <p className="mt-1 text-sm text-muted-foreground">Books you bought open in the Learnova Reader. After you pay and send your receipt, the admin unlocks the book here.</p>
      {!signedIn && (
        <p className="mt-6 rounded-lg border bg-card p-6 text-center">
          <Link to="/account" className="text-primary underline">Sign in / ننوتل</Link> to see your books.
        </p>
      )}
      {ids === null ? <p className="mt-8 text-muted-foreground">Loading…</p> : (
        <>
          {signedIn && mine.length === 0 && <p className="mt-6 rounded-lg border p-6 text-center text-muted-foreground">No purchased books yet.</p>}
          <Grid list={mine} />
          {free.length > 0 && <><h2 className="mt-10 font-display text-xl">Free books · وړیا کتابونه</h2><Grid list={free} /></>}
        </>
      )}
    </div>
  );
}

function Grid({ list }: { list: ReturnType<typeof useStore>["books"] }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {list.map((b) => (
        <Link key={b.id} to="/reader/$id" params={{ id: b.id }} className="group rounded-lg border bg-card p-2">
          <BookCover book={b} />
          <p className="mt-2 line-clamp-2 text-sm font-medium">{b.title}</p>
          <span className="mt-1 inline-flex items-center gap-1 text-xs text-primary"><BookOpen className="h-3 w-3" /> Read · لوستل</span>
        </Link>
      ))}
    </div>
  );
}
