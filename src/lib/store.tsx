import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { SEED_BOOKS, type Book, type Format } from "./books";

export interface CartItem { bookId: string; format: Format; qty: number }
export type Lang = "en" | "fa" | "ps";

interface Store {
  books: Book[];
  saveBook: (b: Book) => void;
  deleteBook: (id: string) => void;
  resetBooks: () => void;
  cart: CartItem[];
  addToCart: (bookId: string, format: Format) => void;
  setQty: (bookId: string, format: Format, qty: number) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  dark: boolean;
  toggleDark: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<Store | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>(SEED_BOOKS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setBooks(load("lnv-books", SEED_BOOKS));
    setCart(load("lnv-cart", []));
    setDark(load("lnv-dark", false));
    setLang(load("lnv-lang", "en"));
    setReady(true);
  }, []);

  useEffect(() => { if (ready) localStorage.setItem("lnv-books", JSON.stringify(books)); }, [books, ready]);
  useEffect(() => { if (ready) localStorage.setItem("lnv-cart", JSON.stringify(cart)); }, [cart, ready]);
  useEffect(() => { if (ready) localStorage.setItem("lnv-lang", JSON.stringify(lang)); }, [lang, ready]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    if (ready) localStorage.setItem("lnv-dark", JSON.stringify(dark));
  }, [dark, ready]);

  const value: Store = {
    books,
    saveBook: (b) => setBooks((p) => (p.some((x) => x.id === b.id) ? p.map((x) => (x.id === b.id ? b : x)) : [b, ...p])),
    deleteBook: (id) => {
      setBooks((p) => p.filter((x) => x.id !== id));
      setCart((c) => c.filter((i) => i.bookId !== id));
    },
    resetBooks: () => setBooks(SEED_BOOKS),
    cart,
    addToCart: (bookId, format) =>
      setCart((c) => {
        const ex = c.find((i) => i.bookId === bookId && i.format === format);
        if (ex) return c.map((i) => (i === ex ? { ...i, qty: format === "soft" ? 1 : i.qty + 1 } : i));
        return [...c, { bookId, format, qty: 1 }];
      }),
    setQty: (bookId, format, qty) =>
      setCart((c) =>
        qty <= 0
          ? c.filter((i) => !(i.bookId === bookId && i.format === format))
          : c.map((i) => (i.bookId === bookId && i.format === format ? { ...i, qty } : i)),
      ),
    clearCart: () => setCart([]),
    cartOpen,
    setCartOpen,
    dark,
    toggleDark: () => setDark((d) => !d),
    lang,
    setLang,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}
