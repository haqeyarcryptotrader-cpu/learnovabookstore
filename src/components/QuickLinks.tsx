import { Link } from "@tanstack/react-router";
import { ArrowRight, BellRing, Compass, Sparkles } from "lucide-react";
import { WHATSAPP_CHANNEL_URL, waLink } from "@/lib/books";

const tile = "group relative flex aspect-square flex-col justify-between overflow-hidden rounded-2xl border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:aspect-[4/3] sm:p-5";

function Inner({ icon: Icon, title, sub }: { icon: typeof Sparkles; title: string; sub: string }) {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-background/20 blur-2xl" />
      <Icon aria-hidden className="pointer-events-none absolute -bottom-4 -right-4 h-24 w-24 opacity-15 transition-transform duration-500 group-hover:scale-110" />
      <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-background/25 backdrop-blur"><Icon className="h-6 w-6" /></span>
      <div className="relative">
        <p className="font-display text-base leading-tight sm:text-xl">{title}</p>
        <p dir="auto" className="mt-1 flex items-center gap-1 text-xs opacity-85">{sub} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" /></p>
      </div>
    </>
  );
}

export function QuickLinks() {
  const wa = WHATSAPP_CHANNEL_URL || waLink("Assalamu Alaikum! Please add me to the Learnova Books free-books list. · مهرباني وکړئ د وړیا کتابونو لېست ته مې ور اضافه کړئ.");
  return (
    <section className="mx-auto max-w-6xl px-4 pt-8">
      <div className="grid grid-cols-3 gap-3 sm:gap-5">
        <Link to="/assistant" className={`${tile} bg-primary text-primary-foreground`}>
          <Inner icon={Sparkles} title="AI Guide" sub="کتاب راته ومومه" />
        </Link>
        <Link to="/community" className={`${tile} cover-history`}>
          <Inner icon={Compass} title="Explore" sub="د لوستونکو لیکنې" />
        </Link>
        <a href={wa} target="_blank" rel="noreferrer" className={`${tile} bg-whatsapp text-whatsapp-foreground`}>
          <Inner icon={BellRing} title="Free books" sub="WhatsApp چینل" />
        </a>
      </div>
    </section>
  );
}
