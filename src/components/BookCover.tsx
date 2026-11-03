import type { Book } from "@/lib/books";
import { cn } from "@/lib/utils";

const PALETTES: Record<string, string> = {
  "Computer Science": "cover-tech",
  Psychology: "cover-self",
  Philosophy: "cover-history",
  "Self- development": "cover-self",
  "Languages and literature": "cover-lit",
  Engineering: "cover-tech",
  Medical: "cover-history",
  "Teacher guide": "cover-self",
  Science: "cover-tech",
  Comic: "cover-crypto",
  Children: "cover-self",
  "Arts and Music": "cover-lit",
  Religion: "cover-history",
  Mathematics: "cover-tech",
  Law: "cover-lit",
  Economics: "cover-crypto",
};

export function BookCover({ book, className }: { book: Book; className?: string }) {
  if (book.coverUrl) {
    return (
      <img src={book.coverUrl} alt={`Cover of ${book.title}`} loading="lazy"
        className={cn("aspect-[2/3] w-full rounded-md object-cover shadow-book", className)} />
    );
  }
  return (
    <div className={cn("relative flex aspect-[2/3] w-full flex-col justify-between overflow-hidden rounded-md p-4 shadow-book", PALETTES[book.category], className)}>
      <div className="absolute inset-y-0 left-0 w-2 bg-foreground/10" />
      <span className="text-[10px] uppercase tracking-[0.2em] opacity-75">{book.category}</span>
      <div>
        <div className="mb-3 h-px w-10 bg-current opacity-60" />
        <h3 className="font-display text-xl leading-tight sm:text-2xl">{book.title}</h3>
      </div>
      <span className="text-xs opacity-85">{book.author}</span>
    </div>
  );
}
