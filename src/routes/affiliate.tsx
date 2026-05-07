import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/affiliate")({
  head: () => ({
    meta: [
      { title: "Affiliate Program — Earn up to 50% | XMV" },
      { name: "description", content: "Promote XMV and earn lifetime commissions on your referrals' trading fees." },
    ],
  }),
  component: AffiliatePage,
});

function AffiliatePage() {
  return (
    <>
      <PageHeader title="Affiliate Program" subtitle="Earn up to 50% commission on every referred trade — for life." />
      <section className="container mx-auto px-4 py-12 grid md:grid-cols-3 gap-6 max-w-5xl">
        {[
          { v: "50%", l: "Commission rate" },
          { v: "Lifetime", l: "Earnings" },
          { v: "Daily", l: "Payouts" },
        ].map((s) => (
          <Card key={s.l} className="p-8 text-center border-border">
            <div className="text-4xl font-bold text-brand">{s.v}</div>
            <div className="text-sm text-muted-foreground mt-2">{s.l}</div>
          </Card>
        ))}
      </section>
      <div className="text-center pb-16">
        <Button size="lg" className="bg-brand hover:bg-brand-glow text-brand-foreground font-semibold rounded-full px-8">Join the program</Button>
      </div>
    </>
  );
}
