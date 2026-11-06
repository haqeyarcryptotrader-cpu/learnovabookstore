import { createFileRoute } from "@tanstack/react-router";
import { ReadingAssistant } from "@/components/ReadingAssistant";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Reading Guide — Learnova Books" },
      { name: "description", content: "Tell us what you want to read and our AI guide finds matching books and community posts." },
      { property: "og:title", content: "AI Reading Guide — Learnova Books" },
      { property: "og:description", content: "Find the right book in Pashto, Dari or English with the Learnova AI guide." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <div className="pb-12"><ReadingAssistant /></div>,
});
