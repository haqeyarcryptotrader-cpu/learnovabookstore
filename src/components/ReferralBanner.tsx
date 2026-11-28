import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Share2, ShoppingBag, Wallet } from "lucide-react";

const TXT = {
  en: {
    dir: "ltr",
    title: "Earn money with referrals",
    sub: "Share your link. When a friend buys a book, you earn 20% of the price.",
    steps: ["Share your link", "Your friend buys a book", "You earn 20%"],
    cta: "Get my referral link",
  },
  fa: {
    dir: "rtl",
    title: "با معرفی دوستان درآمد کسب کنید",
    sub: "لینک خود را به اشتراک بگذارید. وقتی دوستتان کتاب بخرد، ۲۰٪ قیمت آن مال شماست.",
    steps: ["لینک خود را بفرستید", "دوستتان کتاب می‌خرد", "شما ۲۰٪ کمایی می‌کنید"],
    cta: "دریافت لینک معرفی من",
  },
  ps: {
    dir: "rtl",
    title: "د ملګرو په بلنه پیسې ګټه کړئ",
    sub: "خپل لینک ولېږئ. کله چې ملګری مو کتاب واخلي، د بیې ۲۰٪ ستاسو دی.",
    steps: ["خپل لینک ولېږئ", "ملګری مو کتاب اخلي", "تاسو ۲۰٪ ګټئ"],
    cta: "زما د بلنې لینک ترلاسه کړئ",
  },
} as const;

const ICONS = [Share2, ShoppingBag, Wallet];

export function ReferralBanner({ lang }: { lang: "en" | "fa" | "ps" }) {
  const t = TXT[lang];
  const rtl = t.dir === "rtl";
  const Arrow = rtl ? ArrowLeft : ArrowRight;
  return (
    <section dir={t.dir} className={`mx-auto max-w-6xl px-4 pt-8 ${rtl ? "font-rtl" : ""}`}>
      <div className="tile-ai relative overflow-hidden rounded-3xl p-6 shadow-book sm:p-8">
        <div className="grid items-center gap-6 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className={`text-2xl leading-snug sm:text-3xl ${rtl ? "font-rtl font-bold" : "font-display"}`}>{t.title}</h2>
            <p className="mt-2 text-sm leading-relaxed opacity-90">{t.sub}</p>
            <Link
              to="/account"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-stone-900 transition hover:opacity-90 active:scale-95"
            >
              {t.cta}
              <Arrow className="h-4 w-4" />
            </Link>
          </div>
          <ol className="grid gap-2.5">
            {t.steps.map((s, i) => {
              const Icon = ICONS[i];
              return (
                <li key={i} className="flex items-center gap-3 rounded-2xl bg-white/15 p-3 text-sm backdrop-blur">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span><b className="me-1">{i + 1}.</b>{s}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
