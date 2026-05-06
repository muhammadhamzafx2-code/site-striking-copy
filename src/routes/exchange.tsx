import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/exchange")({
  head: () => ({
    meta: [
      { title: "Spot Exchange — Trade Crypto | Exonax" },
      { name: "description", content: "Trade BTC, ETH and 100+ altcoins on a fast, liquid spot exchange." },
    ],
  }),
  component: ExchangePage,
});

const orderBook = Array.from({ length: 8 }, (_, i) => ({
  price: (85657 + (i - 4) * 12).toFixed(2),
  amount: (Math.random() * 2).toFixed(4),
  total: (Math.random() * 100000).toFixed(0),
}));

function ExchangePage() {
  return (
    <>
      <PageHeader title="Spot Exchange" subtitle="Pro-grade trading tools with deep liquidity and ultra-low fees." />
      <section className="container mx-auto px-4 py-10 grid lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-3 p-6 border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">BTC/USDT</h2>
              <div className="text-3xl font-bold text-brand mt-1">$85,657.65</div>
              <div className="text-sm text-muted-foreground">+0.32% (24h)</div>
            </div>
            <div className="hidden md:flex gap-6 text-sm">
              <div><div className="text-muted-foreground">24h High</div><div className="font-semibold">$86,210</div></div>
              <div><div className="text-muted-foreground">24h Low</div><div className="font-semibold">$84,901</div></div>
              <div><div className="text-muted-foreground">Volume</div><div className="font-semibold">18.68B</div></div>
            </div>
          </div>
          <div className="aspect-[16/8] rounded-lg bg-secondary/40 grid place-items-center text-muted-foreground">
            Live chart preview
          </div>
        </Card>

        <Card className="p-6 border-border">
          <h3 className="font-semibold mb-4">Order Book</h3>
          <div className="space-y-1 text-xs font-mono">
            {orderBook.map((o, i) => (
              <div key={i} className={`flex justify-between ${i < 4 ? "text-destructive" : "text-brand"}`}>
                <span>{o.price}</span>
                <span className="text-muted-foreground">{o.amount}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-4 p-6 border-border grid sm:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-4 text-brand">Buy BTC</h3>
            <div className="space-y-3">
              <input className="w-full rounded-md bg-secondary px-3 py-2 text-sm" placeholder="Price USDT" />
              <input className="w-full rounded-md bg-secondary px-3 py-2 text-sm" placeholder="Amount BTC" />
              <Button className="w-full bg-brand hover:bg-brand-glow text-brand-foreground">Buy BTC</Button>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-destructive">Sell BTC</h3>
            <div className="space-y-3">
              <input className="w-full rounded-md bg-secondary px-3 py-2 text-sm" placeholder="Price USDT" />
              <input className="w-full rounded-md bg-secondary px-3 py-2 text-sm" placeholder="Amount BTC" />
              <Button variant="destructive" className="w-full">Sell BTC</Button>
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}
