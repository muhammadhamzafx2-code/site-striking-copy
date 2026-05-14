import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const STRIPE_BASE = "https://api.stripe.com/v1";

function stripeKey() {
  const k = process.env.STRIPE_SANDBOX_API_KEY || process.env.STRIPE_LIVE_API_KEY;
  if (!k) throw new Error("Stripe key not configured");
  return k;
}

// CoinGecko symbol → id map for common coins. Falls back to symbol search.
const CG_IDS: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  usdt: "tether",
  usdttrc20: "tether",
  usdterc20: "tether",
  usdtbsc: "tether",
  usdc: "usd-coin",
  bnb: "binancecoin",
  bnbbsc: "binancecoin",
  sol: "solana",
  xrp: "ripple",
  ada: "cardano",
  doge: "dogecoin",
  trx: "tron",
  ton: "the-open-network",
  matic: "matic-network",
  pol: "matic-network",
  ltc: "litecoin",
  bch: "bitcoin-cash",
  avax: "avalanche-2",
  dot: "polkadot",
  shib: "shiba-inu",
  link: "chainlink",
  atom: "cosmos",
  near: "near",
};

function coinId(c: string): string {
  const k = c.toLowerCase();
  return CG_IDS[k] ?? k;
}

async function getUsdPrice(coin: string): Promise<number> {
  const id = coinId(coin);
  const r = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
  );
  if (!r.ok) throw new Error(`Price lookup failed (${r.status})`);
  const j = (await r.json()) as Record<string, { usd?: number }>;
  const p = j[id]?.usd;
  if (!p || p <= 0) throw new Error(`No price for ${coin}`);
  return p;
}

function form(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

export const getCryptoQuote = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ coin: z.string().min(1), usd: z.number().positive() }).parse,
  )
  .handler(async ({ data }) => {
    try {
      const price = await getUsdPrice(data.coin);
      const fee = data.usd * 0.01;
      const net = data.usd - fee;
      const coinAmount = net / price;
      return {
        ok: true as const,
        price_usd: price,
        coin_amount: coinAmount,
        fee_usd: fee,
        net_usd: net,
      };
    } catch (e: any) {
      return { ok: false as const, error: e.message ?? "Quote failed" };
    }
  });

export const createCardCheckout = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      uid: z.string().min(1),
      coin: z.string().min(1).max(20),
      usd: z.number().positive().min(1).max(10000),
      origin: z.string().url(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const price = await getUsdPrice(data.coin);
    const fee = data.usd * 0.01;
    const net = data.usd - fee;
    const coinAmount = net / price;
    const symbol = data.coin.toUpperCase();
    const cents = Math.round(data.usd * 100);

    const params: Record<string, string> = {
      mode: "payment",
      "payment_method_types[0]": "card",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(cents),
      "line_items[0][price_data][product_data][name]": `Buy ${coinAmount.toFixed(8)} ${symbol}`,
      "line_items[0][price_data][product_data][description]": `Wallet top-up: ${symbol} @ $${price.toFixed(2)} (1% fee)`,
      success_url: `${data.origin}/buy-crypto?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${data.origin}/buy-crypto?status=cancelled`,
      "metadata[uid]": data.uid,
      "metadata[coin]": symbol,
      "metadata[coin_amount]": coinAmount.toFixed(10),
      "metadata[usd_amount]": String(data.usd),
      "metadata[price_usd]": String(price),
      "metadata[fee_usd]": fee.toFixed(4),
      "metadata[source]": "buy-crypto-card",
    };

    const res = await fetch(`${STRIPE_BASE}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form(params),
    });
    const j = (await res.json()) as any;
    if (!res.ok) {
      return { ok: false as const, error: j?.error?.message ?? `Stripe ${res.status}` };
    }
    return {
      ok: true as const,
      url: j.url as string,
      session_id: j.id as string,
      coin_amount: coinAmount,
      price_usd: price,
      fee_usd: fee,
    };
  });
