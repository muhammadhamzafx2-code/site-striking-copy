import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Crown, Headphones, Zap, Gift } from "lucide-react";

export const Route = createFileRoute("/vip")({
  head: () => ({
    meta: [
      { title: "VIP Program — Exclusive Benefits | XMV" },
      { name: "description", content: "Unlock dedicated support, lower fees and exclusive perks with the XMV VIP program." },
    ],
  }),
  component: VipPage,
});

const perks = [
  { icon: Crown, title: "Lower fees", text: "Maker fees as low as 0% for top tiers." },
  { icon: Headphones, title: "Dedicated manager", text: "24/7 personal account manager and priority support." },
  { icon: Zap, title: "Higher limits", text: "Increased withdrawal and trading volume limits." },
  { icon: Gift, title: "Exclusive perks", text: "Invitations to events, airdrops and beta features." },
];

function VipPage() {
  return (
    <>
      <PageHeader title="XMV VIP" subtitle="Built for high-volume traders and institutions." />
      <section className="container mx-auto px-4 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {perks.map((p) => (
          <Card key={p.title} className="p-6 border-border">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/15 text-brand mb-4">
              <p.icon className="h-6 w-6" />
            </div>
            <h3 className="font-semibold">{p.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{p.text}</p>
          </Card>
        ))}
      </section>
    </>
  );
}
