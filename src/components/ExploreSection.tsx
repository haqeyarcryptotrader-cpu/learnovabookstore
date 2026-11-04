import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Heart, MessageCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Post = { id: string; author_name: string; content: string; image_url: string; created_at: string };

export function ExploreSection() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("community_posts").select("id,author_name,content,image_url,created_at")
        .eq("status", "approved").order("created_at", { ascending: false }).limit(6);
      const list = (data ?? []) as Post[];
      setPosts(list);
      if (!list.length) return;
      const ids = list.map((p) => p.id);
      const [l, c] = await Promise.all([
        supabase.from("post_likes").select("post_id").in("post_id", ids),
        supabase.from("post_comments").select("post_id").in("post_id", ids),
      ]);
      const count = (rows: { post_id: string }[] | null) => (rows ?? []).reduce<Record<string, number>>((a, r) => ((a[r.post_id] = (a[r.post_id] ?? 0) + 1), a), {});
      setLikes(count(l.data)); setComments(count(c.data));
    })();
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10">
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-accent/40 blur-3xl" />

        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Readers' feed · د لوستونکو لیکنې
            </p>
            <h2 className="mt-3 flex items-center gap-2 font-display text-3xl sm:text-4xl">
              <Compass className="h-8 w-8 text-primary" /> Learnova <span className="text-primary">Explore</span>
            </h2>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">Articles, book summaries and ideas shared by our community. · مقالې، لنډیزونه او نظرونه</p>
          </div>
          <Link to="/community" className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm">
            Explore all <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {posts.length === 0 ? (
          <Link to="/community" className="relative mt-6 block rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground hover:bg-muted">
            No posts yet — be the first to share! · لومړنۍ لیکنه تاسو وکړئ
          </Link>
        ) : (
          <div className="relative mt-6 -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} to="/community" hash={p.id}
                className="group flex w-72 shrink-0 snap-start flex-col overflow-hidden rounded-xl border bg-background transition hover:-translate-y-1 hover:shadow-lg sm:w-auto">
                {p.image_url ? (
                  <img src={p.image_url} alt="" loading="lazy" className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="hero-surface flex h-40 items-center p-5">
                    <p dir="auto" className="line-clamp-4 font-display text-lg leading-snug">“{p.content}”</p>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {(p.author_name || "R").charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium">{p.author_name || "Reader"}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  {p.image_url && <p dir="auto" className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.content}</p>}
                  <div className="mt-auto flex gap-4 pt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {likes[p.id] ?? 0}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {comments[p.id] ?? 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
