import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

const coins = [
  { sym: "BTC", name: "Bitcoin", price: "$85,657.65", change: 0.32, vol: "$18.68B", cap: "$1.69T", color: "#F7931A" },
  { sym: "ETH", name: "Ethereum", price: "$2,520.91", change: 0.34, vol: "$8.04B", cap: "$303B", color: "#627EEA" },
  { sym: "BNB", name: "Binance Coin", price: "$675.12", change: -0.13, vol: "$604.7M", cap: "$98B", color: "#F3BA2F" },
  { sym: "BCH", name: "Bitcoin Cash", price: "$513.94", change: 3.7, vol: "$231M", cap: "$10B", color: "#0AC18E" },
  { sym: "TON", name: "Toncoin", price: "$1.45733", change: 1.37, vol: "$448M", cap: "$5B", color: "#0098EA" },
  { sym: "TRX", name: "Tron", price: "$0.36384", change: 2.27, vol: "$3.12B", cap: "$32B", color: "#FF060A" },
  { sym: "SHIB", name: "Shiba Inu", price: "$0.0000063", change: -0.32, vol: "$80M", cap: "$3.7B", color: "#FFA409" },
  { sym: "SOL", name: "Solana", price: "$91.7671", change: -0.02, vol: "$1.79B", cap: "$43B", color: "#9945FF" },
  { sym: "XRP", name: "XRP", price: "$0.5234", change: 1.12, vol: "$1.2B", cap: "$28B", color: "#23292F" },
  { sym: "ADA", name: "Cardano", price: "$0.4125", change: -1.23, vol: "$320M", cap: "$14B", color: "#0033AD" },
  { sym: "DOGE", name: "Dogecoin", price: "$0.1234", change: 4.56, vol: "$890M", cap: "$17B", color: "#C2A633" },
  { sym: "AVAX", name: "Avalanche", price: "$28.45", change: 2.11, vol: "$430M", cap: "$11B", color: "#E84142" },
];

export const Route = createFileRoute("/prices")({
  head: () => ({
    meta: [
      { title: "Crypto Prices — Live Market Data | Exonax" },
      { name: "description", content: "Track real-time prices, 24h volume, and market cap of Bitcoin, Ethereum and top altcoins." },
    ],
  }),
  component: PricesPage,
});

function PricesPage() {
  return (
    <>
      <PageHeader title="Crypto Prices" subtitle="Live market data updated in real time across the top digital assets." />
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
                {coins.map((c, i) => (
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
                    <td className="text-right font-semibold px-6">{c.price}</td>
                    <td className="text-right px-6">
                      <span className={`inline-flex items-center gap-1 font-medium ${c.change >= 0 ? "text-brand" : "text-destructive"}`}>
                        {c.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {c.change >= 0 ? "+" : ""}{c.change}%
                      </span>
                    </td>
                    <td className="text-right text-muted-foreground hidden md:table-cell px-6">{c.vol}</td>
                    <td className="text-right text-muted-foreground hidden lg:table-cell px-6">{c.cap}</td>
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
