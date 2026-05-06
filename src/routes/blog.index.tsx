import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";

export const posts = [
  { slug: "what-is-a-crypto-conference", title: "What is a Crypto Conference?", excerpt: "An overview of crypto conferences and why they matter for traders and builders.", date: "May 1, 2026" },
  { slug: "crypto-trading-strategies", title: "Crypto Trading: Methods & Strategies", excerpt: "From DCA to swing trading — popular strategies for any market condition.", date: "Apr 24, 2026" },
  { slug: "ethereum-2025-priorities", title: "Ethereum 2025 — Foundation Priorities", excerpt: "How the Ethereum Foundation plans to evolve the network.", date: "Apr 12, 2026" },
  { slug: "crypto-lending-explained", title: "Crypto Lending — Everything to Know", excerpt: "Understand the basics, risks and rewards of lending your digital assets.", date: "Mar 30, 2026" },
  { slug: "spot-and-avoid-scams", title: "4 Methods to Spot and Avoid Crypto Scams", excerpt: "Practical tips to keep your funds safe online.", date: "Mar 18, 2026" },
  { slug: "vietnam-crypto-bust", title: "Vietnam Police Bust $1M Crypto Scam", excerpt: "A look at one of the largest recent regional enforcement actions.", date: "Mar 5, 2026" },
];

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Exonax Blog — Crypto News & Guides" },
      { name: "description", content: "News, guides and analysis from the Exonax team." },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <>
      <PageHeader title="Blog" subtitle="Crypto news, guides and platform updates." />
      <section className="container mx-auto px-4 py-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((p) => (
          <Link key={p.slug} to="/blog/$slug" params={{ slug: p.slug }}>
            <Card className="p-6 h-full border-border hover:border-brand/40 transition">
              <div className="aspect-[16/9] rounded-lg mb-4" style={{ background: "var(--gradient-hero)" }} />
              <div className="text-xs text-muted-foreground">{p.date}</div>
              <h3 className="font-semibold mt-2 text-lg">{p.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{p.excerpt}</p>
            </Card>
          </Link>
        ))}
      </section>
    </>
  );
}
