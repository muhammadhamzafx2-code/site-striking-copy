import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const NP_BASE = "https://api.nowpayments.io/v1";

function key() {
  const k = process.env.NOWPAYMENTS_API_KEY;
  if (!k) throw new Error("NOWPAYMENTS_API_KEY not configured");
  return k;
}

export const getAvailableCurrencies = createServerFn({ method: "GET" }).handler(async () => {
  const res = await fetch(`${NP_BASE}/merchant/coins`, {
    headers: { "x-api-key": key() },
  });
  if (!res.ok) {
    return { currencies: [] as string[], error: `NowPayments error ${res.status}` };
  }
  const data = (await res.json()) as { selectedCurrencies?: string[] };
  return { currencies: (data.selectedCurrencies ?? []).map((c) => c.toLowerCase()), error: null };
});

export const getMinAmount = createServerFn({ method: "GET" })
  .inputValidator((d: { currency_from: string; currency_to?: string }) => d)
  .handler(async ({ data }) => {
    const params = new URLSearchParams({
      currency_from: data.currency_from,
      currency_to: data.currency_to ?? data.currency_from,
    });
    const res = await fetch(`${NP_BASE}/min-amount?${params}`, {
      headers: { "x-api-key": key() },
    });
    if (!res.ok) return { min_amount: null, error: `NowPayments ${res.status}` };
    const json = (await res.json()) as { min_amount: number };
    return { min_amount: json.min_amount, error: null };
  });

export const createDeposit = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      uid: z.string().min(1),
      pay_currency: z.string().min(1),
      price_amount: z.number().positive(),
      price_currency: z.string().default("usd"),
    }).parse,
  )
  .handler(async ({ data }) => {
    const res = await fetch(`${NP_BASE}/payment`, {
      method: "POST",
      headers: { "x-api-key": key(), "Content-Type": "application/json" },
      body: JSON.stringify({
        price_amount: data.price_amount,
        price_currency: data.price_currency,
        pay_currency: data.pay_currency,
        order_id: `${data.uid}-${Date.now()}`,
        order_description: `XMV deposit for user ${data.uid}`,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false as const, error: json?.message ?? `NowPayments ${res.status}` };
    }
    return {
      ok: true as const,
      payment_id: String(json.payment_id),
      pay_address: json.pay_address as string,
      pay_amount: json.pay_amount as number,
      pay_currency: json.pay_currency as string,
      price_amount: json.price_amount as number,
      price_currency: json.price_currency as string,
      payment_status: json.payment_status as string,
      order_id: json.order_id as string,
      expiration_estimate_date: json.expiration_estimate_date as string | undefined,
    };
  });

export const getPaymentStatus = createServerFn({ method: "GET" })
  .inputValidator((d: { payment_id: string }) => d)
  .handler(async ({ data }) => {
    const res = await fetch(`${NP_BASE}/payment/${data.payment_id}`, {
      headers: { "x-api-key": key() },
    });
    const json = await res.json();
    if (!res.ok) return { ok: false as const, error: json?.message ?? `NowPayments ${res.status}` };
    return {
      ok: true as const,
      payment_id: String(json.payment_id),
      payment_status: json.payment_status as string,
      pay_address: json.pay_address as string,
      pay_amount: json.pay_amount as number,
      actually_paid: (json.actually_paid as number) ?? 0,
      pay_currency: json.pay_currency as string,
      price_amount: json.price_amount as number,
      price_currency: json.price_currency as string,
      order_id: json.order_id as string,
    };
  });
