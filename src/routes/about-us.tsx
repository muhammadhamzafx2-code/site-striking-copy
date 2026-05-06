import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/about-us")({
  head: () => ({
    meta: [
      { title: "About Exonax — Our Mission" },
      { name: "description", content: "Learn about Exonax: a global crypto exchange built on security, transparency and community." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <PageHeader title="About Exonax" subtitle="Our mission is to make digital assets accessible to everyone." />
      <section className="container mx-auto px-4 py-12 max-w-3xl space-y-6 text-muted-foreground leading-relaxed">
        <p>Exonax is a global cryptocurrency exchange serving 39 million customers across 200+ countries. We provide a secure, fast and transparent gateway into the digital economy — for first-time buyers and professional traders alike.</p>
        <p>Founded by a team of fintech and security veterans, we operate with a strict cold-storage policy, full Proof of Reserves, and 24/7 monitoring.</p>
        <div className="grid sm:grid-cols-3 gap-4 pt-6 not-prose">
          {[["39M+", "Users"], ["200+", "Countries"], ["$2.29B", "24h Volume"]].map(([v, l]) => (
            <Card key={l} className="p-6 text-center border-border">
              <div className="text-3xl font-bold text-brand">{v}</div>
              <div className="text-sm text-muted-foreground mt-1">{l}</div>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
