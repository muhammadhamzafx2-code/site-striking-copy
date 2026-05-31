import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const FLW_BASE = "https://api.flutterwave.com/v3";

function flwKey() {
  const k = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!k) throw new Error("Flutterwave key not configured");
  return k;
}

const CG_IDS: Record<string, string> = {
  btc: "bitcoin", eth: "ethereum", usdt: "tether", usdc: "usd-coin",
  bnb: "binancecoin", sol: "solana", xrp: "ripple", ada: "cardano",
  doge: "dogecoin", trx: "tron", ton: "the-open-network", matic: "matic-network",
  ltc: "litecoin", bch: "bitcoin-cash", avax: "avalanche-2", dot: "polkadot",
  shib: "shiba-inu", link: "chainlink", atom: "cosmos", near: "near",
};

async function fetchJson(url: string, attempts = 3): Promise<any> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url, { headers: { accept: "application/json" } });
      if (r.ok) return await r.json();
      lastErr = new Error(`HTTP ${r.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((res) => setTimeout(res, 300 * (i + 1)));
  }
  throw lastErr ?? new Error("fetch failed");
}

async function getUsdPrice(coin: string): Promise<number> {
  const id = CG_IDS[coin.toLowerCase()] ?? coin.toLowerCase();
  // Try CoinGecko first
  try {
    const j = await fetchJson(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
      2,
    );
    const p = j?.[id]?.usd;
    if (p && p > 0) return p;
  } catch {}
  // Fallback: Coinbase spot price (uses symbol)
  try {
    const sym = coin.toUpperCase();
    const j = await fetchJson(
      `https://api.coinbase.com/v2/prices/${sym}-USD/spot`,
      2,
    );
    const p = Number(j?.data?.amount);
    if (p && p > 0) return p;
  } catch {}
  // Fallback: Binance
  try {
    const sym = coin.toUpperCase();
    const j = await fetchJson(
      `https://api.binance.com/api/v3/ticker/price?symbol=${sym}USDT`,
      2,
    );
    const p = Number(j?.price);
    if (p && p > 0) return p;
  } catch {}
  throw new Error(`Price lookup failed for ${coin}`);
}

// Country -> Flutterwave-supported local charge currency.
// Charging in local currency avoids "card cannot be charged" intl restrictions.
const COUNTRY_CURRENCY: Record<string, string> = {
  NG: "NGN", KE: "KES", GH: "GHS", UG: "UGX", TZ: "TZS", ZA: "ZAR",
  RW: "RWF", ZM: "ZMW", MW: "MWK", SL: "SLL", LR: "LRD",
  CM: "XAF", CG: "XAF", GA: "XAF", TD: "XAF", CF: "XAF", GQ: "XAF",
  CI: "XOF", SN: "XOF", BJ: "XOF", BF: "XOF", ML: "XOF", NE: "XOF", TG: "XOF",
  EG: "EGP", MA: "MAD",
  US: "USD", GB: "GBP",
  AT: "EUR", BE: "EUR", CY: "EUR", DE: "EUR", EE: "EUR", ES: "EUR", FI: "EUR",
  FR: "EUR", GR: "EUR", IE: "EUR", IT: "EUR", LT: "EUR", LU: "EUR", LV: "EUR",
  MT: "EUR", NL: "EUR", PT: "EUR", SI: "EUR", SK: "EUR",
};
const ZERO_DECIMAL = new Set(["UGX", "RWF", "XAF", "XOF", "TZS", "SLL"]);

async function getFxRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  try {
    const j = await fetchJson(`https://open.er-api.com/v6/latest/${from}`, 2);
    const r = Number(j?.rates?.[to]);
    if (r && r > 0) return r;
  } catch {}
  try {
    const j = await fetchJson(`https://api.exchangerate.host/latest?base=${from}&symbols=${to}`, 2);
    const r = Number(j?.rates?.[to]);
    if (r && r > 0) return r;
  } catch {}
  throw new Error(`FX lookup failed ${from}->${to}`);
}

export const createFlutterwaveCheckout = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      uid: z.string().min(1),
      email: z.string().email().optional(),
      coin: z.string().min(1).max(20),
      usd: z.number().positive().min(1).max(10000),
      origin: z.string().url(),
      country: z.string().length(2).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    try {
      const price = await getUsdPrice(data.coin);
      const fee = data.usd * 0.01;
      const net = data.usd - fee;
      const coinAmount = net / price;
      const symbol = data.coin.toUpperCase();
      const tx_ref = `xmv_${data.uid}_${data.coin}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const cc = (data.country ?? "").toUpperCase();
      const chargeCurrency = COUNTRY_CURRENCY[cc] ?? "USD";
      const fxRate = await getFxRate("USD", chargeCurrency);
      const chargeAmount = data.usd * fxRate;
      const amountStr = ZERO_DECIMAL.has(chargeCurrency)
        ? Math.round(chargeAmount).toString()
        : chargeAmount.toFixed(2);

      const body = {
        tx_ref,
        amount: amountStr,
        currency: chargeCurrency,
        redirect_url: `${data.origin}/buy-crypto?status=success&tx_ref=${tx_ref}`,
        customer: {
          email: data.email ?? `${data.uid}@xmvwallet.user`,
        },
        customizations: {
          title: "XMV Wallet Top-up",
          description: `Buy ${coinAmount.toFixed(8)} ${symbol}`,
        },
        meta: {
          uid: data.uid,
          coin: symbol,
          coin_amount: coinAmount.toFixed(10),
          usd_amount: String(data.usd),
          price_usd: String(price),
          fee_usd: fee.toFixed(4),
          charge_currency: chargeCurrency,
          charge_amount: amountStr,
          fx_rate: String(fxRate),
          buyer_country: cc || "unknown",
          source: "buy-crypto-card",
        },
      };

      const res = await fetch(`${FLW_BASE}/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${flwKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as any;
      if (!res.ok || j?.status !== "success") {
        return { ok: false as const, error: j?.message ?? `Flutterwave ${res.status}` };
      }
      return {
        ok: true as const,
        url: j.data.link as string,
        tx_ref,
        coin_amount: coinAmount,
        price_usd: price,
        fee_usd: fee,
      };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "Checkout failed" };
    }
  });
