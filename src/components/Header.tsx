import logo from "@/assets/learnova-logo.png.asset.json";
import { Link } from "@tanstack/react-router";
import { Moon, ShoppingBag, Sun, Settings } from "lucide-react";
import { useStore } from "@/lib/store";

export function Header() {
  const { cart, setCartOpen, dark, toggleDark, lang, setLang } = useStore();
  const count = cart.reduce((s, i) => s + i.qty, 0);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo.url} alt="Learnova Books" className="h-10 w-10 rounded-md object-cover" />
          <span className="font-display text-lg leading-none sm:text-xl">Learnova <span className="text-primary">Books</span></span>
        </Link>
        <div className="flex items-center gap-1">
          <div className="hidden rounded-md border p-0.5 text-xs sm:flex">
            {(["en", "fa", "ps"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`rounded px-2 py-1 ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                {l === "en" ? "EN" : l === "fa" ? "دری" : "پښتو"}
              </button>
            ))}
          </div>
          <Link to="/admin" aria-label="Admin" className="rounded-md p-2 text-muted-foreground hover:bg-muted">
            <Settings className="h-5 w-5" />
          </Link>
          <button onClick={toggleDark} aria-label="Toggle theme" className="rounded-md p-2 text-muted-foreground hover:bg-muted">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button onClick={() => setCartOpen(true)} aria-label="Open cart" className="relative rounded-md p-2 hover:bg-muted">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{count}</span>}
          </button>
        </div>
      </div>
      <div className="flex justify-center gap-1 border-t py-1 text-xs sm:hidden">
        {(["en", "fa", "ps"] as const).map((l) => (
          <button key={l} onClick={() => setLang(l)}
            className={`rounded px-2 py-0.5 ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {l === "en" ? "English" : l === "fa" ? "دری" : "پښتو"}
          </button>
        ))}
      </div>
    </header>
  );
}
