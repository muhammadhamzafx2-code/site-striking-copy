import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import {
  getAvailableCurrencies,
  createDeposit,
  getPaymentStatus,
} from "@/lib/nowpayments.functions";
import { db } from "@/lib/firebase";
import { doc, setDoc, updateDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import { logActivity } from "@/lib/userData";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/buy-crypto")({
  head: () => ({
    meta: [
      { title: "Buy Crypto Instantly — Pay with Any Coin | XMV" },
      { name: "description", content: "Buy Bitcoin, Ethereum, USDT and 100+ coins instantly. Live pricing, low fees, on-chain delivery." },
    ],
  }),
  component: BuyCryptoPage,
});

const FINISHED = ["finished", "confirmed", "sending"];

interface ActiveDeposit {
  payment_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  status: string;
}

function BuyCryptoPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchCurrencies = useServerFn(getAvailableCurrencies);
  const submitDeposit = useServerFn(createDeposit);
  const fetchStatus = useServerFn(getPaymentStatus);

  const [currencies, setCurrencies] = useState<string[]>([]);
  const [currency, setCurrency] = useState<string>("usdttrc20");
  const [usdAmount, setUsdAmount] = useState<string>("100");
  const [creating, setCreating] = useState(false);
  const [active, setActive] = useState<ActiveDeposit | null>(null);
  const [polling, setPolling] = useState(false);
  const creditedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchCurrencies()
      .then((r) => {
        const list = (r.currencies ?? []).slice().sort();
        setCurrencies(list);
        if (list.length && !list.includes(currency)) setCurrency(list[0]);
      })
      .catch(() => {});
  }, []);

  // Poll deposit status & credit balance
  useEffect(() => {
    if (!active || !user) return;
    let cancelled = false;
    setPolling(true);
    const tick = async () => {
      try {
        const r = await fetchStatus({ data: { payment_id: active.payment_id } });
        if (cancelled || !r.ok) return;
        if (r.payment_status !== active.status) {
          setActive({ ...active, status: r.payment_status });
          await updateDoc(
            doc(db, "users", user.uid, "deposits", active.payment_id),
            { status: r.payment_status, actually_paid: r.actually_paid, updatedAt: serverTimestamp() },
          );
        }
        if (FINISHED.includes(r.payment_status) && !creditedRef.current.has(r.payment_id)) {
          creditedRef.current.add(r.payment_id);
          const asset = active.pay_currency.toUpperCase();
          // read existing balance
          const balSnap = await getDocs(collection(db, "users", user.uid, "balances"));
          const existing = balSnap.docs.find((d) => d.id === asset);
          const prevFree = existing ? (existing.data() as any).free ?? 0 : 0;
          const prevLocked = existing ? (existing.data() as any).locked ?? 0 : 0;
          await setDoc(
            doc(db, "users", user.uid, "balances", asset),
            {
              asset,
              free: prevFree + Number(r.actually_paid || active.pay_amount),
              locked: prevLocked,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
          await logActivity(user.uid, "deposit", {
            asset,
            amount: r.actually_paid || active.pay_amount,
            usd: active.price_amount,
            status: "completed",
            payment_id: r.payment_id,
            source: "buy-crypto",
          });
          toast.success(`Purchase confirmed: ${r.actually_paid} ${asset}`);
        }
      } catch {
        // ignore
      }
    };
    tick();
    const id = setInterval(tick, 12000);
    return () => {
      cancelled = true;
      setPolling(false);
      clearInterval(id);
    };
  }, [active?.payment_id, user]);

  const handleContinue = async () => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: "/buy-crypto" } });
      return;
    }
    const amt = Number(usdAmount);
    if (!amt || amt <= 0) return toast.error("Enter a USD amount");
    if (!currency) return toast.error("Select a currency");
    setCreating(true);
    try {
      const r = await submitDeposit({
        data: { uid: user.uid, pay_currency: currency, price_amount: amt, price_currency: "usd" },
      });
      if (!r.ok) throw new Error(r.error);
      const dep: ActiveDeposit = {
        payment_id: r.payment_id,
        pay_address: r.pay_address,
        pay_amount: r.pay_amount,
        pay_currency: r.pay_currency,
        price_amount: r.price_amount,
        price_currency: r.price_currency,
        status: r.payment_status,
      };
      await setDoc(doc(db, "users", user.uid, "deposits", r.payment_id), {
        ...dep,
        source: "buy-crypto",
        createdAt: serverTimestamp(),
      });
      setActive(dep);
      toast.success("Payment address generated");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to start purchase");
    } finally {
      setCreating(false);
    }
  };

  const reset = () => {
    setActive(null);
    setUsdAmount("100");
  };

  const featureList = useMemo(
    () => [
      "Pay with 100+ cryptocurrencies",
      "Live network rates via NowPayments",
      "On-chain delivery to your XMV wallet",
      "Auto-credit once confirmed",
    ],
    [],
  );

  return (
    <>
      <PageHeader title="Buy Crypto" subtitle="Fund your XMV wallet with any cryptocurrency. Auto-credited on confirmation." />
      <section className="container mx-auto px-4 py-12 grid md:grid-cols-2 gap-8 max-w-4xl">
        <Card className="p-6 md:p-8 border-border">
          {!active ? (
            <>
              <h3 className="text-xl font-semibold mb-6">Quick Buy</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Spend (USD)</label>
                  <Input
                    type="number"
                    min={1}
                    step="0.01"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    className="h-12 text-base font-semibold"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Receive</label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-12 text-base font-semibold">
                      <SelectValue placeholder={currencies.length ? "Select currency" : "Loading…"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {currencies.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleContinue}
                  disabled={creating || loading}
                  className="w-full h-12 bg-brand hover:bg-brand-glow text-brand-foreground font-semibold"
                >
                  {creating ? <Loader2 className="animate-spin" /> : user ? "Continue" : "Sign in to Buy"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Live network rates · Settled on-chain
                </p>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold mb-2">
                Send {active.pay_amount} {active.pay_currency.toUpperCase()}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                ${active.price_amount} USD will be credited once confirmed on-chain.
              </p>
              <div className="bg-white p-4 rounded-md mx-auto w-fit mb-4">
                <QRCodeSVG value={active.pay_address} size={180} />
              </div>
              <label className="text-xs text-muted-foreground">Address</label>
              <div className="flex gap-2 mt-1 mb-4">
                <Input readOnly value={active.pay_address} className="font-mono text-xs" />
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(active.pay_address);
                    toast.success("Address copied");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm flex items-center justify-between rounded-md border border-border px-3 py-2 mb-4">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium flex items-center gap-2">
                  {polling && !FINISHED.includes(active.status) && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {active.status}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={reset} className="flex-1">
                  New Purchase
                </Button>
                <Button onClick={() => navigate({ to: "/wallets" })} className="flex-1">
                  Go to Wallet
                </Button>
              </div>
            </>
          )}
        </Card>
        <div className="space-y-4">
          {featureList.map((t) => (
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
