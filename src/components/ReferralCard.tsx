import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fmtAfn } from "@/lib/books";
import { MIN_PAYOUT_AFN, fetchMyPayouts, fetchReferralSummary, requestPayout, type MyPayout, type ReferralSummary } from "@/lib/referral";

const field = "w-full rounded-md border bg-background px-3 py-2 text-sm";
const METHODS = [
  ["store_credit", "Store credit / د پلورنځي کریډیټ"],
  ["hesabpay", "HesabPay"],
  ["mobile_money", "Mobile money / موبایل پیسې"],
  ["hawala", "Hawala / حواله"],
] as const;

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border p-2"><p className="text-[11px] text-muted-foreground">{label}</p><p className="font-semibold">{value}</p></div>;
}

export function ReferralCard() {
  const [s, setS] = useState<ReferralSummary | null>(null);
  const [payouts, setPayouts] = useState<MyPayout[]>([]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("store_credit");
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetchReferralSummary().then(setS).catch(() => {});
    fetchMyPayouts().then(setPayouts).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  if (!s || !s.code) return null;
  const link = `${window.location.origin}/?ref=${s.code}`;
  const text = `📚 د Learnova Books پلورنځی وګورئ: ${link}`;
  const available = Number(s.available_afn);

  const copy = () => navigator.clipboard.writeText(link).then(() => toast.success("Link copied / لینک کاپي شو"));
  const withdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await requestPayout(Number(amount), method, account);
      toast.success("Request sent / غوښتنه ولېږل شوه");
      setAmount(""); setAccount(""); load();
    } catch (err) { toast.error((err as Error).message); }
    setBusy(false);
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="font-display text-xl">Refer &amp; earn / ملګري راوبولئ او ګټه وکړئ</h2>
      <p className="mt-1 text-xs text-muted-foreground">Earn 20% of every purchase made through your link. / ستاسو د لینک له لارې د هر پېر ۲۰٪ ګټه.</p>
      <div className="mt-3 flex gap-2">
        <input readOnly className={field} value={link} onFocus={(e) => e.target.select()} />
        <button type="button" onClick={copy} className="rounded-md border px-3 text-sm">Copy</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">WhatsApp</a>
        <a href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("📚 Learnova Books")}`} target="_blank" rel="noreferrer" className="rounded-md border px-3 py-1.5 text-xs">Telegram</a>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <Stat label="Pending / په انتظار" value={fmtAfn(Number(s.pending_afn))} />
        <Stat label="Available / شته" value={fmtAfn(available)} />
        <Stat label="Paid / ورکړل شوي" value={fmtAfn(Number(s.paid_afn))} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Commission becomes available 7 days after your friend's order is confirmed. Orders so far: {s.referred_orders}</p>

      {available >= MIN_PAYOUT_AFN && (
        <form onSubmit={withdraw} className="mt-4 space-y-2 border-t pt-4">
          <p className="text-sm font-medium">Withdraw / ایستل (min {MIN_PAYOUT_AFN} AFN)</p>
          <input required type="number" min={MIN_PAYOUT_AFN} max={available} className={field} placeholder="Amount (AFN)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select className={field} value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {method !== "store_credit" && <input required className={field} placeholder="Your account / phone number" value={account} onChange={(e) => setAccount(e.target.value)} />}
          <button disabled={busy} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">{busy ? "Sending…" : "Request / غوښتنه"}</button>
        </form>
      )}

      {payouts.length > 0 && (
        <ul className="mt-4 divide-y border-t text-sm">
          {payouts.map((p) => (
            <li key={p.id} className="flex justify-between py-2">
              <span>{new Date(p.created_at).toLocaleDateString()} · {fmtAfn(Number(p.amount_afn))}</span>
              <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">{p.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
                                 }
