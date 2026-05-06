import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/fees")({
  head: () => ({
    meta: [
      { title: "Trading Fees & Limits | Exonax" },
      { name: "description", content: "Industry-low trading, deposit and withdrawal fees on Exonax." },
    ],
  }),
  component: FeesPage,
});

const tiers = [
  { tier: "Regular", vol: "< $50,000", maker: "0.10%", taker: "0.10%" },
  { tier: "VIP 1", vol: "$50,000+", maker: "0.08%", taker: "0.10%" },
  { tier: "VIP 2", vol: "$500,000+", maker: "0.06%", taker: "0.08%" },
  { tier: "VIP 3", vol: "$5,000,000+", maker: "0.04%", taker: "0.06%" },
  { tier: "VIP 4", vol: "$25,000,000+", maker: "0.02%", taker: "0.04%" },
  { tier: "VIP 5", vol: "$100,000,000+", maker: "0.00%", taker: "0.02%" },
];

function FeesPage() {
  return (
    <>
      <PageHeader title="Fee Schedule" subtitle="Transparent maker / taker fees that scale with your volume." />
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="overflow-hidden border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left py-4 px-6 font-medium">Tier</th>
                <th className="text-left py-4 px-6 font-medium">30d Volume</th>
                <th className="text-right py-4 px-6 font-medium">Maker</th>
                <th className="text-right py-4 px-6 font-medium">Taker</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.tier} className="border-t border-border">
                  <td className="py-4 px-6 font-semibold">{t.tier}</td>
                  <td className="py-4 px-6 text-muted-foreground">{t.vol}</td>
                  <td className="py-4 px-6 text-right text-brand font-semibold">{t.maker}</td>
                  <td className="py-4 px-6 text-right">{t.taker}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </>
  );
}
