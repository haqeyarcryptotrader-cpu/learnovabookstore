import { describe, expect, it } from "vitest";
import { CATEGORIES, normalizeCategory, SEED_BOOKS } from "@/lib/books";

describe("Book categorization", () => {
  it("provides the sixteen requested upload and visitor categories", () => {
    expect([...CATEGORIES]).toEqual([
      "Computer Science", "Psychology", "Philosophy", "Self- development",
      "Languages and literature", "Engineering", "Medical", "Teacher guide",
      "Science", "Comic", "Children", "Arts and Music", "Religion",
      "Mathematics", "Law", "Economics",
    ]);
  });

  it.each([
    ["Tech & AI", "Computer Science"],
    ["Crypto & Finance", "Economics"],
    ["Self-Help", "Self- development"],
    ["Islamic & History", "Religion"],
    ["Literature", "Languages and literature"],
  ])("keeps existing %s books discoverable under %s", (oldCategory, category) => {
    expect(normalizeCategory(oldCategory)).toBe(category);
  });

  it.each(CATEGORIES)("preserves the selected %s category", (category) => {
    expect(normalizeCategory(category)).toBe(category);
  });

  it("uses supported categories for all sample books", () => {
    for (const book of SEED_BOOKS) expect(CATEGORIES).toContain(book.category);
  });
});