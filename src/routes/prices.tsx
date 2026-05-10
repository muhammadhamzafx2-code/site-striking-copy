import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";

type Coin = {
  id: string;
  sym: string;
  name: string;
  color: string;
  price: number;
  change: number;
  vol: number;
  cap: number;
};

const COINS: Array<{ id: string; sym: string; name: string; color: string }> = [
  { id: "bitcoin", sym: "BTC", name: "Bitcoin", color: "#F7931A" },
  { id: "ethereum", sym: "ETH", name: "Ethereum", color: "#627EEA" },
  { id: "binancecoin", sym: "BNB", name: "Binance Coin", color: "#F3BA2F" },
  { id: "bitcoin-cash", sym: "BCH", name: "Bitcoin Cash", color: "#0AC18E" },
  { id: "the-open-network", sym: "TON", name: "Toncoin", color: "#0098EA" },
  { id: "tron", sym: "TRX", name: "Tron", color: "#FF060A" },
  { id: "shiba-inu", sym: "SHIB", name: "Shiba Inu", color: "#FFA409" },
  { id: "solana", sym: "SOL", name: "Solana", color: "#9945FF" },
  { id: "ripple", sym: "XRP", name: "XRP", color: "#23292F" },
  { id: "cardano", sym: "ADA", name: "Cardano", color: "#0033AD" },
  { id: "dogecoin", sym: "DOGE", name: "Dogecoin", color: "#C2A633" },
  { id: "avalanche-2", sym: "AVAX", name: "Avalanche", color: "#E84142" },
];

const MARKUP = 1.10;
const TTL = 24 * 60 * 60 * 1000;
const CACHE_KEY = "xmv:prices:v1";

export const Route = createFileRoute("/prices")({
  head: () => ({
    meta: [
      { title: "Crypto Prices — Live Market Data | XMV" },
      { name: "description", content: "Track real-time prices, 24h volume, and market cap of Bitcoin, Ethereum and top altcoins." },
    ],
  }),
  component: PricesPage,
});

function fmtPrice(n: number) {
  if (n >= 1) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toPrecision(3)}`;
}
function fmtBig(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

async function fetchCoins(): Promise<Coin[]> {
  const ids = COINS.map((c) => c.id).join(",");
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch prices");
  const data: any[] = await res.json();
  return COINS.map((c) => {
    const m = data.find((d) => d.id === c.id);
    return {
      ...c,
      price: (m?.current_price ?? 0) * MARKUP,
      change: m?.price_change_percentage_24h ?? 0,
      vol: (m?.total_volume ?? 0) * MARKUP,
      cap: (m?.market_cap ?? 0) * MARKUP,
    };
  });
}

function PricesPage() {
  const [coins, setCoins] = useState<Coin[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem(CACHE_KEY) : null;
        if (raw) {
          const cached = JSON.parse(raw) as { ts: number; coins: Coin[] };
          if (Date.now() - cached.ts < TTL) {
            if (!cancelled) {
              setCoins(cached.coins);
              setUpdatedAt(cached.ts);
            }
            return;
          }
        }
        setLoading(true);
        const fresh = await fetchCoins();
        if (cancelled) return;
        const ts = Date.now();
        setCoins(fresh);
        setUpdatedAt(ts);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts, coins: fresh }));
      } catch {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw && !cancelled) {
          const cached = JSON.parse(raw) as { ts: number; coins: Coin[] };
          setCoins(cached.coins);
          setUpdatedAt(cached.ts);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Crypto Prices"
        subtitle={
          updatedAt
            ? `Live market data. Last updated ${new Date(updatedAt).toLocaleString()} — refreshes every 24h.`
            : "Live market data updated daily across the top digital assets."
        }
      />
      <section className="container mx-auto px-4 py-12">
        <Card className="overflow-hidden border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="text-left py-4 px-6 font-medium">#</th>
                  <th className="text-left py-4 px-6 font-medium">Name</th>
                  <th className="text-right py-4 px-6 font-medium">Price</th>
                  <th className="text-right py-4 px-6 font-medium">24h Change</th>
                  <th className="text-right py-4 px-6 font-medium hidden md:table-cell">Volume</th>
                  <th className="text-right py-4 px-6 font-medium hidden lg:table-cell">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {!coins && loading &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-4 px-6 text-muted-foreground">{i + 1}</td>
                      <td className="py-4 px-6 text-muted-foreground" colSpan={5}>
                        Loading…
                      </td>
                    </tr>
                  ))}
                {coins?.map((c, i) => (
                  <tr key={c.sym} className="border-t border-border hover:bg-secondary/30">
                    <td className="py-4 px-6 text-muted-foreground">{i + 1}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full text-white text-xs font-bold" style={{ background: c.color }}>{c.sym.slice(0, 2)}</div>
                        <div>
                          <div className="font-semibold">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.sym}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right font-semibold px-6">{fmtPrice(c.price)}</td>
                    <td className="text-right px-6">
                      <span className={`inline-flex items-center gap-1 font-medium ${c.change >= 0 ? "text-brand" : "text-destructive"}`}>
                        {c.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {c.change >= 0 ? "+" : ""}{c.change.toFixed(2)}%
                      </span>
                    </td>
                    <td className="text-right text-muted-foreground hidden md:table-cell px-6">{fmtBig(c.vol)}</td>
                    <td className="text-right text-muted-foreground hidden lg:table-cell px-6">{fmtBig(c.cap)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </>
  );
}
