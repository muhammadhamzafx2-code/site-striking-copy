import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/help/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | XMV" },
      { name: "description", content: "Read the XMV terms of service and user agreement." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <>
      <PageHeader title="Terms of Service" subtitle="Last updated: May 2026" />
      <section className="container mx-auto px-4 py-12 max-w-3xl space-y-6 text-muted-foreground leading-relaxed">
        {["Acceptance of Terms", "Account Registration", "Eligibility", "Trading Rules", "Fees", "Risk Disclosure", "Privacy", "Limitation of Liability"].map((s, i) => (
          <div key={s}>
            <h2 className="text-xl font-semibold text-foreground">{i + 1}. {s}</h2>
            <p className="mt-2">By using XMV, you agree to comply with all applicable laws and platform rules. Crypto trading involves substantial risk; you should only trade with funds you can afford to lose.</p>
          </div>
        ))}
      </section>
    </>
  );
}
