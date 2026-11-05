import { BellRing, MessageCircle } from "lucide-react";
import { WHATSAPP_CHANNEL_URL, waLink } from "@/lib/books";

export function WhatsAppChannelBanner() {
  const href = WHATSAPP_CHANNEL_URL || waLink("Assalamu Alaikum! Please add me to the Learnova Books free-books list. · مهرباني وکړئ د وړیا کتابونو لېست ته مې ور اضافه کړئ.");
  return (
    <section className="mx-auto max-w-6xl px-4 pt-10">
      <div className="relative overflow-hidden rounded-2xl bg-whatsapp p-6 text-whatsapp-foreground sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-background/15 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-background/20"><BellRing className="h-6 w-6" /></span>
            <div>
              <h2 className="font-display text-2xl">Get new free books on WhatsApp</h2>
              <p dir="rtl" className="mt-1 font-rtl text-base">زموږ واټساپ چینل ته یوځای شئ — هر نوی وړیا کتاب لومړی تاسو ته رسېږي.</p>
            </div>
          </div>
          <a href={href} target="_blank" rel="noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-md transition hover:scale-105">
            <MessageCircle className="h-4 w-4" /> Join channel · یوځای شئ
          </a>
        </div>
      </div>
    </section>
  );
}
