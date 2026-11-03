import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, Share2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, Composer } from "@/components/PostComposer";

export const Route = createFileRoute("/community")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Community — Learnova Books" },
      { name: "description", content: "Share posts, book reviews and ideas with the Learnova Books community. Like, comment and share." },
      { property: "og:title", content: "Learnova Community" },
      { property: "og:description", content: "Posts, reviews and ideas from Learnova readers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommunityPage,
});

type Post = { id: string; user_id: string; author_name: string; content: string; image_url: string; created_at: string; status: string };
type Comment = { id: string; post_id: string; user_id: string; author_name: string; content: string; created_at: string };
type Like = { post_id: string; user_id: string };

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(d).toLocaleDateString();
}

function CommunityPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [myName, setMyName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [p, l, c] = await Promise.all([
      supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("post_likes").select("post_id,user_id"),
      supabase.from("post_comments").select("*").order("created_at", { ascending: true }),
    ]);
    setPosts((p.data as Post[]) ?? []);
    setLikes((l.data as Like[]) ?? []);
    setComments((c.data as Comment[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      if (!u) return;
      setUserId(u.id);
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", u.id).maybeSingle();
      setMyName(prof?.full_name || u.email?.split("@")[0] || "Reader");
      const { data: ok } = await supabase.rpc("has_role", { _user_id: u.id, _role: "admin" });
      setIsAdmin(!!ok);
    });
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl">Community <span className="text-muted-foreground text-xl">· ټولنه</span></h1>
      <p className="mt-1 text-sm text-muted-foreground">Share ideas, book reviews and summaries. · خپلې لیکنې، د کتابونو لنډیزونه او نظرونه شریک کړئ.</p>

      {userId ? (
        <Composer userId={userId} name={myName} onPosted={load} />
      ) : (
        <div className="mt-6 rounded-xl border bg-card p-5 text-center">
          <p className="text-sm">Sign in to write a post · د پوسټ لیکلو لپاره ننوځئ</p>
          <Link to="/account" className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Sign in / Sign up</Link>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {loading && <p className="text-center text-sm text-muted-foreground">Loading…</p>}
        {!loading && posts.length === 0 && <p className="text-center text-sm text-muted-foreground">No posts yet. Be the first! · لومړی پوسټ تاسو ولیکئ!</p>}
        {posts.map((p) => (
          <PostCard key={p.id} post={p} userId={userId} myName={myName} isAdmin={isAdmin}
            likes={likes.filter((l) => l.post_id === p.id)}
            comments={comments.filter((c) => c.post_id === p.id)}
            onChange={load} />
        ))}
      </div>
    </main>
  );
}


function PostCard({ post, userId, myName, isAdmin, likes, comments, onChange }: {
  post: Post; userId: string | null; myName: string; isAdmin: boolean; likes: Like[]; comments: Comment[]; onChange: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const liked = !!userId && likes.some((l) => l.user_id === userId);

  async function toggleLike() {
    if (!userId) { window.location.href = "/account"; return; }
    if (liked) await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", userId);
    else await supabase.from("post_likes").insert({ post_id: post.id, user_id: userId });
    onChange();
  }

  async function addComment() {
    if (!userId || !text.trim()) return;
    await supabase.from("post_comments").insert({ post_id: post.id, user_id: userId, author_name: myName, content: text.trim() });
    setText(""); onChange();
  }

  async function share() {
    const url = `${window.location.origin}/community#${post.id}`;
    const msg = `${post.content.slice(0, 140)}\n${url}`;
    if (navigator.share) { try { await navigator.share({ text: msg, url }); return; } catch { /* cancelled */ } }
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  async function del() {
    if (!confirm("Delete this post? · دا پوسټ حذف شي؟")) return;
    await supabase.from("community_posts").delete().eq("id", post.id);
    onChange();
  }

  return (
    <article id={post.id} className="rounded-xl border bg-card">
      <div className="flex items-center gap-3 p-4">
        <Avatar name={post.author_name} />
        <div className="flex-1">
          <p className="text-sm font-medium">{post.author_name || "Reader"}</p>
          <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
        </div>
        {post.status === "pending" && (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-600 dark:text-amber-400">Awaiting approval · د تایید په انتظار</span>
        )}
        {(userId === post.user_id || isAdmin) && (
          <button onClick={del} aria-label="Delete post" className="rounded-md p-2 text-muted-foreground hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
        )}
      </div>
      {post.content && <p className="whitespace-pre-wrap px-4 pb-3 text-sm leading-relaxed" dir="auto">{post.content}</p>}
      {post.image_url && <img src={post.image_url} alt="" className="max-h-[32rem] w-full object-cover" loading="lazy" />}
      <div className="flex justify-between px-4 py-2 text-xs text-muted-foreground">
        <span>{likes.length} likes</span>
        <button onClick={() => setShowComments(!showComments)}>{comments.length} comments</button>
      </div>
      <div className="grid grid-cols-3 border-t text-sm">
        <button onClick={toggleLike} className={`flex items-center justify-center gap-2 py-2.5 hover:bg-muted ${liked ? "text-primary" : "text-muted-foreground"}`}>
          <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} /> Like
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center justify-center gap-2 py-2.5 text-muted-foreground hover:bg-muted">
          <MessageCircle className="h-5 w-5" /> Comment
        </button>
        <button onClick={share} className="flex items-center justify-center gap-2 py-2.5 text-muted-foreground hover:bg-muted">
          <Share2 className="h-5 w-5" /> {copied ? "Copied" : "Share"}
        </button>
      </div>
      {showComments && (
        <div className="space-y-3 border-t p-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-xs">{(c.author_name || "?").charAt(0).toUpperCase()}</div>
              <div className="flex-1 rounded-2xl bg-muted px-3 py-2">
                <p className="text-xs font-medium">{c.author_name || "Reader"} <span className="font-normal text-muted-foreground">· {timeAgo(c.created_at)}</span></p>
                <p className="whitespace-pre-wrap text-sm" dir="auto">{c.content}</p>
              </div>
              {(userId === c.user_id || isAdmin) && (
                <button aria-label="Delete comment" onClick={async () => { await supabase.from("post_comments").delete().eq("id", c.id); onChange(); }}
                  className="self-start p-1 text-muted-foreground"><Trash2 className="h-3.5 w-3.5" /></button>
              )}
            </div>
          ))}
          {userId ? (
            <div className="flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment()}
                placeholder="Write a comment… · تبصره ولیکئ" dir="auto"
                className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <button onClick={addComment} disabled={!text.trim()} className="rounded-full bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50">Send</button>
            </div>
          ) : (
            <Link to="/account" className="text-sm text-primary">Sign in to comment · د تبصرې لپاره ننوځئ</Link>
          )}
        </div>
      )}
    </article>
  );
}
