export type Category = "Tech & AI" | "Crypto & Finance" | "Self-Help" | "Islamic & History" | "Literature";
export const CATEGORIES: Category[] = ["Tech & AI", "Crypto & Finance", "Self-Help", "Islamic & History", "Literature"];
export const CITIES = ["Kabul", "Herat", "Mazar-i-Sharif", "Kandahar", "Jalalabad", "Kunduz", "Ghazni", "Bamyan", "Khost", "Other"];
export type Format = "hard" | "soft";

export interface Book {
  id: string;
  title: string;
  author: string;
  category: Category;
  hardPrice: number | null; // AFN, null = not available
  softPrice: number | null; // AFN
  coverUrl: string;
  description: string;
  inStock: boolean;
  pdfLink: string;
  samplePages?: string;
}

// Placeholder values — replace with the store's real details.
export const AFN_PER_USD = 70;
export const WHATSAPP_NUMBER = "93765238918";
export const PAYMENT_DETAILS = {
  hesabpay: "HesabPay: 079 614 2008 (Learnova Books)",
  hawala: "Hawala / Sarai Shahzada, Kabul — ask us on WhatsApp for the current agent",
  usdt: "USDT (TRC20): TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
};

export const toUsd = (afn: number) => afn / AFN_PER_USD;
export const fmtAfn = (n: number) => `${Math.round(n).toLocaleString("en-US")} AFN`;
export const fmtUsd = (afn: number) => `$${toUsd(afn).toFixed(2)}`;

export const priceFor = (b: Book, f: Format) => (f === "hard" ? b.hardPrice : b.softPrice);

export const waLink = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export const SEED_BOOKS: Book[] = [
  {
    id: "bitcoin-standard",
    title: "The Bitcoin Standard",
    author: "Saifedean Ammous",
    category: "Crypto & Finance",
    hardPrice: 1450,
    softPrice: 350,
    coverUrl: "",
    description: "A history of money from seashells to gold to Bitcoin, explaining why sound money matters and how a decentralised currency could reshape the global economy.",
    inStock: true,
    pdfLink: "",
    samplePages: "Chapter 1 — Money. Money is the medium of exchange: a good acquired not to be consumed, but to be traded for other goods…",
  },
  {
    id: "ai-superpowers",
    title: "AI Superpowers",
    author: "Kai-Fu Lee",
    category: "Tech & AI",
    hardPrice: 1300,
    softPrice: 300,
    coverUrl: "",
    description: "How the race between China and Silicon Valley is redefining artificial intelligence — and what it means for jobs and society in every country.",
    inStock: true,
    pdfLink: "",
    samplePages: "Introduction — Twenty years ago, few people imagined that a machine would beat the world's best Go player…",
  },
  {
    id: "atomic-habits",
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self-Help",
    hardPrice: 1100,
    softPrice: 250,
    coverUrl: "",
    description: "Tiny changes, remarkable results. A practical framework for building good habits, breaking bad ones and getting 1% better every day.",
    inStock: true,
    pdfLink: "",
    samplePages: "Chapter 1 — The Surprising Power of Atomic Habits. Habits are the compound interest of self-improvement…",
  },
  {
    id: "kite-runner",
    title: "The Kite Runner",
    author: "Khaled Hosseini",
    category: "Literature",
    hardPrice: 950,
    softPrice: null,
    coverUrl: "",
    description: "A story of friendship, betrayal and redemption set across Kabul's changing decades — one of the most beloved novels about Afghanistan.",
    inStock: true,
    pdfLink: "",
  },
  {
    id: "rumi-masnavi",
    title: "Selections from the Masnavi",
    author: "Mawlana Jalaluddin Balkhi (Rumi)",
    category: "Literature",
    hardPrice: 1200,
    softPrice: 200,
    coverUrl: "",
    description: "Timeless verses from the poet of Balkh, with English translation alongside the original Dari/Persian text.",
    inStock: true,
    pdfLink: "",
    samplePages: "Listen to the reed as it tells its tale, complaining of separations…",
  },
  {
    id: "lost-islamic-history",
    title: "Lost Islamic History",
    author: "Firas Alkhateeb",
    category: "Islamic & History",
    hardPrice: 1150,
    softPrice: 280,
    coverUrl: "",
    description: "Reclaiming Muslim civilisation from the past — the scholars, empires and ideas from Andalusia to Khorasan that shaped the world.",
    inStock: true,
    pdfLink: "",
    samplePages: "Chapter 1 — Arabia Before Islam…",
  },
  {
    id: "rich-dad",
    title: "Rich Dad Poor Dad",
    author: "Robert T. Kiyosaki",
    category: "Crypto & Finance",
    hardPrice: 900,
    softPrice: 200,
    coverUrl: "",
    description: "What the rich teach their kids about money that the poor and middle class do not — the classic primer on assets, liabilities and financial freedom.",
    inStock: false,
    pdfLink: "",
    samplePages: "Lesson 1 — The Rich Don't Work for Money…",
  },
  {
    id: "clean-code",
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Tech & AI",
    hardPrice: null,
    softPrice: 400,
    coverUrl: "",
    description: "A handbook of agile software craftsmanship. Learn to write code that is readable, maintainable and built to last.",
    inStock: true,
    pdfLink: "",
    samplePages: "Chapter 1 — Clean Code. You are reading this book for two reasons: you are a programmer, and you want to be a better one…",
  },
];
