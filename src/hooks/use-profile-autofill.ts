import { useEffect } from "react";
import { fetchMyProfile } from "@/lib/db";

type Buyer = { name: string; phone: string; city: string; address: string };

/** Fills empty buyer fields from the signed-in customer's saved profile. */
export function useProfileAutofill<T extends Buyer>(setV: (f: (prev: T) => T) => void) {
  useEffect(() => {
    fetchMyProfile().then((p) => {
      if (!p) return;
      setV((prev) => ({
        ...prev,
        name: prev.name || p.full_name,
        phone: prev.phone || p.phone,
        address: prev.address || p.address,
        city: prev.address ? prev.city : p.city || prev.city,
      }));
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
