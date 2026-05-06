import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/buy-crypto")({
  head: () => ({
    meta: [
      { title: "Buy Crypto with Card — Instant | Exonax" },
      { name: "description", content: "Buy Bitcoin, Ethereum and USDT with credit card or bank transfer in minutes." },
    ],
  }),
  component: BuyCryptoPage,
});

function BuyCryptoPage() {
  return (
    <>
      <PageHeader title="Buy Crypto" subtitle="Purchase digital assets instantly with card, bank or P2P." />
      <section className="container mx-auto px-4 py-12 grid md:grid-cols-2 gap-8 max-w-4xl">
        <Card className="p-8 border-border">
          <h3 className="text-xl font-semibold mb-6">Quick Buy</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Spend</label>
              <div className="flex gap-2 mt-1">
                <input className="flex-1 rounded-md bg-secondary px-3 py-3 font-semibold" defaultValue="100" />
                <select className="rounded-md bg-secondary px-3 py-3 font-semibold">
                  <option>USD</option><option>EUR</option><option>GBP</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Receive</label>
              <div className="flex gap-2 mt-1">
                <input className="flex-1 rounded-md bg-secondary px-3 py-3 font-semibold" defaultValue="0.00117" />
                <select className="rounded-md bg-secondary px-3 py-3 font-semibold">
                  <option>BTC</option><option>ETH</option><option>USDT</option>
                </select>
              </div>
            </div>
            <Button className="w-full bg-brand hover:bg-brand-glow text-brand-foreground font-semibold">Continue</Button>
            <p className="text-xs text-muted-foreground text-center">1 BTC ≈ 85,657.65 USD · Updated every 10s</p>
          </div>
        </Card>
        <div className="space-y-4">
          {["Pay with Visa or Mastercard", "SEPA & wire transfers", "Apple Pay & Google Pay", "0% fee on first purchase"].map((t) => (
            <Card key={t} className="p-5 border-border flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-brand" />
              <span className="font-medium">{t}</span>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
