import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fmtAfn } from "@/lib/books";
import { adminListCommissions, adminListPayouts, adminSetPayoutStatus, type AdminCommission, type AdminPayout } from "@/lib/referral";

export function ReferralAdmin() {
  const [payouts, setPayouts] = useState<AdminPayout[] | null>(null);
  const [comms, setComms] = useState<AdminCommission[]>([]);
  const load = () => {
    adminListPayouts().then(setPayouts).catch((e) => toast.error(e.message));
    adminListCommissions().then(setComms).catch(() => {});
  };
  useEffect(() => { load(); }, []);
  const set = async (id: string, status: "paid" | "rejected") => {
    try { await adminSetPayoutStatus(id, status); toast.success("Updated"); load(); }
    catch (e) { toast.error((e as Error).message); }
  };
  if (!payouts) return <p className="p-8 text-center text-muted-foreground">Loading…</p>;
  return (
    <div className="mt-6 space-y-8">
      <section>
        <h2 className="font-semibold">Withdrawal requests ({payouts.filter((p) => p.status === "requested").length} waiting)</h2>
        <div className="mt-3 space-y-3">
          {payouts.length === 0 && <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">No requests yet.</p>}
          {payouts.map((p) => (
            <div key={p.id} className="rounded-lg border bg-card p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{p.full_name || "—"} · {p.phone} · {p.email}</p>
                <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">{p.status}</span>
              </div>
              <p className="mt-1">{fmtAfn(Number(p.amount_afn))} via <b>{p.method}</b> {p.account && `→ ${p.account}`}</p>
              <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
              {p.status === "requested" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => set(p.id, "paid")} className="rounded-md bg-primary px-4 py-1.5 text-xs text-primary-foreground">Mark paid / ورکړل شو</button>
                  <button onClick={() => set(p.id, "rejected")} className="rounded-md border border-destructive/40 px-4 py-1.5 text-xs text-destructive">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-semibold">Recent commissions</h2>
        <ul className="mt-3 divide-y rounded-lg border bg-card text-sm">
          {comms.length === 0 && <li className="p-6 text-center text-muted-foreground">None yet.</li>}
          {comms.map((c) => (
            <li key={c.id} className="flex flex-wrap justify-between gap-2 p-3">
              <span>{c.referrer_name || "—"} · {c.referrer_phone} · {fmtAfn(Number(c.amount_afn))}</span>
              <span className="text-xs text-muted-foreground">{c.status === "rejected" ? "rejected" : c.matured ? "available" : "waiting 7 days"}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
                    }
