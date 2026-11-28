import { supabase } from "@/integrations/supabase/client";

const KEY = "lnv-ref";
const DAYS = 30;
export const MIN_PAYOUT_AFN = 500;

export function captureReferral() {
  if (typeof window === "undefined") return;
  try {
    const code = new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase();
    if (code && /^[A-Z0-9]{4,12}$/.test(code))
      localStorage.setItem(KEY, JSON.stringify({ code, exp: Date.now() + DAYS * 86400000 }));
  } catch { /* storage blocked */ }
}

export function getStoredReferral(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, exp } = JSON.parse(raw) as { code: string; exp: number };
    if (Date.now() > exp) { localStorage.removeItem(KEY); return null; }
    return code;
  } catch { return null; }
}

type RpcResult = { data: unknown; error: { message: string } | null };
async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const call = supabase.rpc as unknown as (fn: string, args?: Record<string, unknown>) => Promise<RpcResult>;
  const { data, error } = await call.call(supabase, fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export interface ReferralSummary { code: string; pending_afn: number; available_afn: number; paid_afn: number; referred_orders: number }
export interface MyPayout { id: string; amount_afn: number; method: string; status: string; created_at: string }
export interface AdminPayout extends MyPayout { user_id: string; full_name: string; phone: string; email: string; account: string }
export interface AdminCommission { id: string; order_id: string; referrer_name: string; referrer_phone: string; amount_afn: number; status: string; matured: boolean; created_at: string }

export const fetchReferralSummary = async () => (await rpc<ReferralSummary[]>("my_referral_summary"))?.[0] ?? null;
export const fetchMyPayouts = () => rpc<MyPayout[]>("my_referral_payouts");
export const requestPayout = (amount: number, method: string, account: string) =>
  rpc<null>("request_referral_payout", { _amount: amount, _method: method, _account: account });
export const adminListPayouts = () => rpc<AdminPayout[]>("admin_list_payouts");
export const adminListCommissions = () => rpc<AdminCommission[]>("admin_list_commissions");
export const adminSetPayoutStatus = (id: string, status: "requested" | "paid" | "rejected") =>
  rpc<null>("admin_set_payout_status", { _id: id, _status: status });
