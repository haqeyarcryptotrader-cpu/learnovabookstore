import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type Recommendation = {
  summary: string;
  books: { id: string; reason: string }[];
  posts: { id: string; reason: string }[];
  error?: string;
};

export const recommendReads = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ query: z.string().trim().min(2).max(500) }).parse(d))
  .handler(async ({ data }): Promise<Recommendation> => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const [b, p] = await Promise.all([
      sb.from("books").select("id,title,author,category,description").limit(300),
      sb.from("community_posts").select("id,author_name,content").eq("status", "approved").order("created_at", { ascending: false }).limit(150),
    ]);
    const books = b.data ?? [];
    const posts = p.data ?? [];
    const catalog = {
      books: books.map((x) => ({ id: x.id, title: x.title, author: x.author, category: x.category, description: x.description.slice(0, 300) })),
      posts: posts.map((x) => ({ id: x.id, author: x.author_name, text: x.content.slice(0, 400) })),
    };

    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions:
          "You are the reading assistant of Learnova Books, an Afghan bookstore. Using ONLY the provided catalog, pick up to 5 books and up to 3 community posts that best match the reader's interest or question. Reply in the reader's language (Pashto, Dari or English). Reasons are one short sentence each. Never invent ids. If nothing fits, return empty lists and say so in the summary.",
        input: `Reader request: ${data.query}\n\nCatalog JSON:\n${JSON.stringify(catalog)}`,
        text: {
          format: {
            type: "json_schema",
            name: "recommendation",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["summary", "books", "posts"],
              properties: {
                summary: { type: "string" },
                books: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "reason"], properties: { id: { type: "string" }, reason: { type: "string" } } } },
                posts: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "reason"], properties: { id: { type: "string" }, reason: { type: "string" } } } },
              },
            },
          },
        },
      });
      let text = "";
      for (const item of res.output ?? []) {
        if (item.type === "message") for (const c of item.content) if (c.type === "output_text") text += c.text;
      }
      const parsed = JSON.parse(text) as Recommendation;
      const bookIds = new Set(books.map((x) => x.id));
      const postIds = new Set(posts.map((x) => x.id));
      return {
        summary: parsed.summary,
        books: parsed.books.filter((x) => bookIds.has(x.id)),
        posts: parsed.posts.filter((x) => postIds.has(x.id)),
      };
    } catch (e) {
      console.error("recommendReads failed", e);
      const msg = e instanceof GatewayError && e.httpStatus === 429 ? "Too many requests, try again shortly." : e instanceof GatewayError && e.httpStatus === 402 ? "AI credits are used up." : "The assistant is unavailable right now.";
      return { summary: "", books: [], posts: [], error: msg };
    }
  });
