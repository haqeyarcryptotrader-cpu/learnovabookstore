import { BookOpen, FileDown } from "lucide-react";
import type { Book } from "@/lib/books";

export function FormatBadges({ book }: { book: Book }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {book.hardPrice != null && (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${book.inStock ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground line-through"}`}>
          <BookOpen className="h-3 w-3" /> Hard Copy Available
        </span>
      )}
      {book.softPrice != null && (
        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
          <FileDown className="h-3 w-3" /> Digital PDF Available
        </span>
      )}
    </div>
  );
}
