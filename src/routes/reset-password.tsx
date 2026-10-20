import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — Learnova Books Store" },
      { name: "description", content: "Choose a new password for your Learnova Books admin account." },
      { property: "og:title", content: "Reset password — Learnova Books Store" },
      { property: "og:description", content: "Set a new admin password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. / پاسورډ بدل شو.");
    navigate({ to: "/admin" });
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl">New password</h1>
      <p className="mt-1 text-sm text-muted-foreground">نوی پاسورډ ولیکئ</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input type="password" required minLength={6} placeholder="New password" className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={busy} className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">
          {busy ? "Please wait…" : "Save password"}
        </button>
      </form>
    </div>
  );
}
