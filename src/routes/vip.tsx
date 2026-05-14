import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Headphones, Zap, Gift, Check, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createVipCheckout, createBillingPortal } from "@/lib/stripe.functions";
import { toast } from "sonner";

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

type Tier = {
  id: "silver" | "gold" | "platinum";
  name: string;
  tagline: string;
  monthly: { key: string; price: number };
  yearly: { key: string; price: number };
  features: string[];
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    id: "silver",
    name: "Silver",
    tagline: "Get started with VIP perks",
    monthly: { key: "vip_silver_monthly", price: 9.99 },
    yearly: { key: "vip_silver_yearly", price: 99.9 },
    features: [
      "Reduced trading fees (0.15% maker)",
      "Higher daily withdrawal limits",
      "Priority email support",
      "Early access to new coins",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    tagline: "Most popular for active traders",
    monthly: { key: "vip_gold_monthly", price: 29.99 },
    yearly: { key: "vip_gold_yearly", price: 299.9 },
    highlight: true,
    features: [
      "Maker fees from 0.05%",
      "10× higher withdrawal limits",
      "24/7 live chat support",
      "Exclusive airdrops & rewards",
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    tagline: "Institutional-grade benefits",
    monthly: { key: "vip_platinum_monthly", price: 99.99 },
    yearly: { key: "vip_platinum_yearly", price: 999.9 },
    features: [
      "0% maker fees",
      "Institutional limits",
      "Dedicated account manager",
      "Beta features & event invites",
    ],
  },
];

function VipPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [vip, setVip] = useState<{
    tier?: string | null;
    status?: string | null;
    priceKey?: string | null;
    expiresAt?: string | null;
    cancelAtPeriodEnd?: boolean;
  }>({});

  // Live VIP profile
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const d = snap.data() ?? {};
      setVip({
        tier: d.vipTier ?? null,
        status: d.vipStatus ?? null,
        priceKey: d.vipPriceKey ?? null,
        expiresAt: d.vipExpiresAt ?? null,
        cancelAtPeriodEnd: !!d.vipCancelAtPeriodEnd,
      });
    });
    return () => unsub();
  }, [user]);

  // Post-checkout toast
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status === "success") toast.success("Subscription activated — welcome to VIP!");
    if (status === "cancelled") toast.info("Checkout cancelled.");
    if (status) {
      const u = new URL(window.location.href);
      u.searchParams.delete("status");
      u.searchParams.delete("session_id");
      window.history.replaceState({}, "", u.toString());
    }
  }, []);

  const subscribe = async (priceKey: string) => {
    if (!user) {
      toast.error("Please sign in first.");
      navigate({ to: "/login" });
      return;
    }
    setLoadingKey(priceKey);
    try {
      const r = await createVipCheckout({
        data: { uid: user.uid, email: user.email ?? undefined, priceKey: priceKey as any, origin: window.location.origin },
      });
      if (r.ok) window.location.href = r.url;
      else toast.error(r.error);
    } catch (e: any) {
      toast.error(e?.message ?? "Checkout failed");
    } finally {
      setLoadingKey(null);
    }
  };

  const openPortal = async () => {
    if (!user) return;
    setPortalLoading(true);
    try {
      const r = await createBillingPortal({ data: { uid: user.uid, origin: window.location.origin } });
      if (r.ok) window.open(r.url, "_blank");
      else toast.error(r.error);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const isCurrent = (priceKey: string) =>
    vip.priceKey === priceKey && (vip.status === "active" || vip.status === "trialing");

  const hasAnyVip = !!vip.tier && vip.status !== "canceled";

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

      {hasAnyVip && (
        <section className="container mx-auto px-4 pb-4">
          <Card className="p-6 border-brand/40 bg-brand/5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Current plan</div>
              <div className="text-lg font-semibold capitalize">XMV VIP {vip.tier}</div>
              {vip.expiresAt && (
                <div className="text-xs text-muted-foreground mt-1">
                  {vip.cancelAtPeriodEnd
                    ? `Cancels on ${new Date(vip.expiresAt).toLocaleDateString()}`
                    : `Renews on ${new Date(vip.expiresAt).toLocaleDateString()}`}
                </div>
              )}
            </div>
            <Button variant="outline" onClick={openPortal} disabled={portalLoading}>
              {portalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
              Manage billing
            </Button>
          </Card>
        </section>
      )}

      <section className="container mx-auto px-4 pb-16">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="inline-flex rounded-xl border border-border p-1 bg-card">
            {(["monthly", "yearly"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  billing === b ? "bg-brand text-brand-foreground" : "text-muted-foreground"
                }`}
              >
                {b === "monthly" ? "Monthly" : "Yearly · save ~17%"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((t) => {
            const plan = billing === "monthly" ? t.monthly : t.yearly;
            const current = isCurrent(plan.key);
            return (
              <Card
                key={t.id}
                className={`p-6 flex flex-col border ${
                  t.highlight ? "border-brand shadow-lg shadow-brand/10" : "border-border"
                }`}
              >
                {t.highlight && (
                  <div className="self-start mb-2 text-xs px-2 py-0.5 rounded-full bg-brand/15 text-brand font-medium">
                    Most popular
                  </div>
                )}
                <h3 className="text-xl font-bold">{t.name}</h3>
                <p className="text-sm text-muted-foreground">{t.tagline}</p>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground text-sm">/{billing === "monthly" ? "mo" : "yr"}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-brand mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={t.highlight ? "default" : "outline"}
                  disabled={loadingKey === plan.key || current}
                  onClick={() => subscribe(plan.key)}
                >
                  {current ? (
                    "Current plan"
                  ) : loadingKey === plan.key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : hasAnyVip ? (
                    "Switch to this plan"
                  ) : (
                    `Subscribe to ${t.name}`
                  )}
                </Button>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Payments are processed securely by Stripe. Cancel anytime — you keep access until the end of your billing period.
        </p>
      </section>
    </>
  );
}
