import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/exchange")({
  head: () => ({
    meta: [
      { title: "Spot Exchange — Trade Crypto | XMV" },
      {
        name: "description",
        content:
          "Trade BTC, ETH and 100+ altcoins on a fast, liquid spot exchange with live TradingView charts.",
      },
    ],
  }),
  component: ExchangePage,
});

const PAIRS = [
  { symbol: "BTCUSDT", label: "BTC / USDT", id: "bitcoin" },
  { symbol: "ETHUSDT", label: "ETH / USDT", id: "ethereum" },
  { symbol: "SOLUSDT", label: "SOL / USDT", id: "solana" },
  { symbol: "BNBUSDT", label: "BNB / USDT", id: "binancecoin" },
  { symbol: "XRPUSDT", label: "XRP / USDT", id: "ripple" },
  { symbol: "ADAUSDT", label: "ADA / USDT", id: "cardano" },
  { symbol: "DOGEUSDT", label: "DOGE / USDT", id: "dogecoin" },
  { symbol: "AVAXUSDT", label: "AVAX / USDT", id: "avalanche-2" },
  { symbol: "MATICUSDT", label: "MATIC / USDT", id: "matic-network" },
  { symbol: "LINKUSDT", label: "LINK / USDT", id: "chainlink" },
  { symbol: "DOTUSDT", label: "DOT / USDT", id: "polkadot" },
  { symbol: "TRXUSDT", label: "TRX / USDT", id: "tron" },
];

type Ticker = {
  price: number;
  high: number;
  low: number;
  changePct: number;
  volume: number;
};

function TradingViewChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "calc(100% - 32px)";
    widgetDiv.style.width = "100%";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `BINANCE:${symbol}`,
      interval: "60",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      withdateranges: true,
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full h-[70vh] min-h-[600px] md:min-h-[720px] rounded-lg overflow-hidden border border-border bg-secondary/40"
    />
  );
}

function ExchangePage() {
  const [symbol, setSymbol] = useState<string>("BTCUSDT");
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");

  const pair = useMemo(() => PAIRS.find((p) => p.symbol === symbol)!, [symbol]);
  const base = symbol.replace("USDT", "");

  useEffect(() => {
    let cancelled = false;
    setTicker(null);
    const load = async () => {
      try {
        const r = await fetch(
          `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
        );
        const d = await r.json();
        if (cancelled) return;
        setTicker({
          price: parseFloat(d.lastPrice),
          high: parseFloat(d.highPrice),
          low: parseFloat(d.lowPrice),
          changePct: parseFloat(d.priceChangePercent),
          volume: parseFloat(d.quoteVolume),
        });
      } catch {
        // ignore
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol]);

  const fmt = (n: number, d = 2) =>
    n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

  return (
    <>
      <PageHeader
        title="Spot Exchange"
        subtitle="Pick any pair and trade with a real-time TradingView chart."
      />
      <section className="container mx-auto px-4 py-10 space-y-4">
        <Card className="p-4 md:p-6 border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAIRS.map((p) => (
                  <SelectItem key={p.symbol} value={p.symbol}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-brand">
                {ticker ? `$${fmt(ticker.price, ticker.price < 1 ? 6 : 2)}` : "—"}
              </div>
              <div
                className={`text-sm ${
                  ticker && ticker.changePct >= 0 ? "text-brand" : "text-destructive"
                }`}
              >
                {ticker
                  ? `${ticker.changePct >= 0 ? "+" : ""}${ticker.changePct.toFixed(2)}% (24h)`
                  : "Loading..."}
              </div>
            </div>
          </div>
          <div className="hidden md:flex gap-6 text-sm">
            <div>
              <div className="text-muted-foreground">24h High</div>
              <div className="font-semibold">{ticker ? `$${fmt(ticker.high)}` : "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">24h Low</div>
              <div className="font-semibold">{ticker ? `$${fmt(ticker.low)}` : "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">24h Volume</div>
              <div className="font-semibold">
                {ticker ? `$${(ticker.volume / 1e6).toFixed(2)}M` : "—"}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-2 md:p-4 border-border">
          <TradingViewChart symbol={symbol} />
        </Card>

        <Card className="p-6 border-border grid sm:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-4 text-brand">Buy {base}</h3>
            <div className="space-y-3">
              <input
                className="w-full rounded-md bg-secondary px-3 py-2 text-sm"
                placeholder={`Price USDT (${ticker ? fmt(ticker.price) : "—"})`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <input
                className="w-full rounded-md bg-secondary px-3 py-2 text-sm"
                placeholder={`Amount ${base}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button className="w-full bg-brand hover:bg-brand-glow text-brand-foreground">
                Buy {base}
              </Button>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-destructive">Sell {base}</h3>
            <div className="space-y-3">
              <input
                className="w-full rounded-md bg-secondary px-3 py-2 text-sm"
                placeholder={`Price USDT (${ticker ? fmt(ticker.price) : "—"})`}
              />
              <input
                className="w-full rounded-md bg-secondary px-3 py-2 text-sm"
                placeholder={`Amount ${base}`}
              />
              <Button variant="destructive" className="w-full">
                Sell {base}
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}
