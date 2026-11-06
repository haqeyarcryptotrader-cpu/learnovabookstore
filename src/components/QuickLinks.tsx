import { Link } from "@tanstack/react-router";
import { BellRing, ChevronLeft, Compass, Sparkles } from "lucide-react";
import { WHATSAPP_CHANNEL_URL, waLink } from "@/lib/books";

type IconType = typeof Sparkles;

function Inner({ icon: Icon, title, sub }: { icon: IconType; title: string; sub: string }) {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-background/15 blur-2xl" />
      <Icon aria-hidden className="pointer-events-none absolute -bottom-6 -right-5 h-28 w-28 opacity-10" />
      <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-background/20 backdrop-blur">
        <Icon className="h-6 w-6" />
      </span>
      <div className="relative">
        <p className="font-display text-lg leading-tight sm:text-xl">{title}</p>
        <span dir="rtl" className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-background/15 px-3 py-1 text-xs font-medium">
          {sub}
          <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        </span>
      </div>
    </>
  );
}

const tile =
  "group relative flex h-40 flex-col justify-between overflow-hidden rounded-2xl p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:h-44 sm:p-5";

function Tile({ to, href, cls, icon, title, sub }: { to?: string; href?: string; cls: string; icon: IconType; title: string; sub: string }) {
  const inner = <Inner icon={icon} title={title} sub={sub} />;
  if (to) return <Link to={to} className={`${tile} ${cls}`}>{inner}</Link>;
  return <a href={href} target="_blank" rel="noreferrer" className={`${tile} ${cls}`}>{inner}</a>;
}

export function QuickLinks() {
  const wa = WHATSAPP_CHANNEL_URL || waLink("Assalamu Alaikum! Please add me to the Learnova Books free-books list. · مهرباني وکړئ د وړیا کتابونو لېست ته مې ور اضافه کړئ.");
  return (
    <section className="mx-auto max-w-6xl px-4 pt-10">
      <div className="relative overflow-hidden rounded-3xl border bg-card/50 p-5 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 right-8 h-52 w-52 rounded-full bg-accent/25 blur-3xl" />

        <div dir="rtl" className="relative mb-6 text-center font-rtl sm:mb-8">
          <p dir="ltr" className="mb-3 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-primary">
            <span className="h-px w-6 bg-primary/40" /> Learnova Books <span className="h-px w-6 bg-primary/40" />
          </p>
          <h2 className="text-3xl font-bold leading-snug text-balance sm:text-4xl">هر کتاب، یوه نوې نړۍ</h2>
          <p dir="ltr" className="mt-1 font-display text-base italic text-muted-foreground sm:text-lg">Every book, a new world</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">کتاب ومومه، خپله لیکنه شریکه کړه، او وړیا PDFونه ترلاسه کړه.</p>
        </div>

        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          <Tile to="/assistant" cls="tile-ai" icon={Sparkles} title="AI Guide" sub="کتاب راته ومومه" />
          <Tile to="/community" cls="tile-explore" icon={Compass} title="Explore" sub="د لوستونکو لیکنې" />
          <Tile href={wa} cls="tile-free" icon={BellRing} title="Free books" sub="WhatsApp چینل" />
        </div>
      </div>
    </section>
  );
}
