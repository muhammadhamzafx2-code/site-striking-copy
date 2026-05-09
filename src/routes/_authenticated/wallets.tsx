import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logActivity } from "@/lib/userData";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  getAvailableCurrencies,
  createDeposit,
  getPaymentStatus,
} from "@/lib/nowpayments.functions";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wallets")({
  head: () => ({
    meta: [
      { title: "Wallets — XMV" },
      { name: "description", content: "Manage your XMV crypto balances and deposit any cryptocurrency." },
    ],
  }),
  component: WalletsPage,
});

interface Balance {
  id: string;
  asset: string;
  free: number;
  locked: number;
}

interface DepositDoc {
  payment_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  status: string;
  createdAt?: any;
}

const FINISHED = ["finished", "confirmed", "sending"];

function WalletsPage() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [withdrawAmt, setWithdrawAmt] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);

  const fetchCurrencies = useServerFn(getAvailableCurrencies);
  const submitDeposit = useServerFn(createDeposit);
  const fetchStatus = useServerFn(getPaymentStatus);

  const [currencies, setCurrencies] = useState<string[]>([]);
  const [currency, setCurrency] = useState<string>("");
  const [usdAmount, setUsdAmount] = useState<string>("25");
  const [creating, setCreating] = useState(false);
  const [activeDeposit, setActiveDeposit] = useState<DepositDoc | null>(null);
  const [polling, setPolling] = useState(false);
  const creditedRef = useRef<Set<string>>(new Set());

  // Live balances
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "balances"), (snap) => {
      setBalances(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return unsub;
  }, [user]);

  // Load currencies once dialog opens
  useEffect(() => {
    if (!open || currencies.length) return;
    fetchCurrencies()
      .then((r) => {
        const list = (r.currencies ?? []).slice().sort();
        setCurrencies(list);
        if (!currency && list.length) setCurrency(list.includes("usdttrc20") ? "usdttrc20" : list[0]);
      })
      .catch((e) => toast.error(e.message ?? "Failed to load currencies"));
  }, [open]);

  // Poll active deposit status
  useEffect(() => {
    if (!activeDeposit || !user) return;
    let cancelled = false;
    setPolling(true);
    const tick = async () => {
      try {
        const r = await fetchStatus({ data: { payment_id: activeDeposit.payment_id } });
        if (cancelled || !r.ok) return;
        if (r.payment_status !== activeDeposit.status) {
          setActiveDeposit({ ...activeDeposit, status: r.payment_status });
          await updateDoc(
            doc(db, "users", user.uid, "deposits", activeDeposit.payment_id),
            { status: r.payment_status, actually_paid: r.actually_paid, updatedAt: serverTimestamp() },
          );
        }
        if (FINISHED.includes(r.payment_status) && !creditedRef.current.has(r.payment_id)) {
          creditedRef.current.add(r.payment_id);
          await creditBalance(user.uid, activeDeposit.pay_currency.toUpperCase(), r.actually_paid || activeDeposit.pay_amount);
          await logActivity(user.uid, "deposit", {
            asset: activeDeposit.pay_currency.toUpperCase(),
            amount: r.actually_paid || activeDeposit.pay_amount,
            usd: activeDeposit.price_amount,
            status: "completed",
            payment_id: r.payment_id,
          });
          toast.success(`Deposit confirmed: ${r.actually_paid} ${activeDeposit.pay_currency.toUpperCase()}`);
        }
      } catch {
        // ignore intermittent
      }
    };
    tick();
    const id = setInterval(tick, 12000);
    return () => {
      cancelled = true;
      setPolling(false);
      clearInterval(id);
    };
  }, [activeDeposit?.payment_id, user]);

  const creditBalance = async (uid: string, asset: string, amount: number) => {
    const ref = doc(db, "users", uid, "balances", asset);
    const existing = balances.find((b) => b.asset === asset);
    await setDoc(
      ref,
      {
        asset,
        free: (existing?.free ?? 0) + Number(amount || 0),
        locked: existing?.locked ?? 0,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  };

  const startDeposit = async () => {
    if (!user) return;
    const amt = Number(usdAmount);
    if (!amt || amt <= 0) return toast.error("Enter a USD amount");
    if (!currency) return toast.error("Select a currency");
    setCreating(true);
    try {
      const r = await submitDeposit({
        data: { uid: user.uid, pay_currency: currency, price_amount: amt, price_currency: "usd" },
      });
      if (!r.ok) throw new Error(r.error);
      const dep: DepositDoc = {
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
        createdAt: serverTimestamp(),
      });
      setActiveDeposit(dep);
      toast.success("Deposit address generated. Send the exact amount.");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create deposit");
    } finally {
      setCreating(false);
    }
  };

  const withdraw = async (asset: string) => {
    if (!user) return;
    const amt = Number(withdrawAmt[asset] || 0);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    const b = balances.find((x) => x.asset === asset);
    if (!b || b.free < amt) return toast.error("Insufficient balance");
    await updateDoc(doc(db, "users", user.uid, "balances", asset), {
      free: b.free - amt,
      updatedAt: serverTimestamp(),
    });
    await logActivity(user.uid, "withdraw", { asset, amount: amt, status: "pending" });
    setWithdrawAmt({ ...withdrawAmt, [asset]: "" });
    toast.success(`Withdrawal of ${amt} ${asset} submitted`);
  };

  const reset = () => {
    setActiveDeposit(null);
    setUsdAmount("25");
  };

  return (
    <>
      <PageHeader
        title="Wallets"
        subtitle="Deposit any cryptocurrency via NowPayments. Funds credit automatically once confirmed on-chain."
      />
      <section className="container mx-auto px-4 py-10">
        <div className="flex justify-end mb-4">
          <Button
            className="bg-brand hover:bg-brand-glow text-brand-foreground"
            onClick={() => setOpen(true)}
          >
            Deposit Crypto
          </Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {balances.map((b) => (
            <Card key={b.id} className="p-6 border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{b.asset}</h3>
                <span className="text-xs text-muted-foreground">free</span>
              </div>
              <div className="text-3xl font-bold mb-1">{(b.free ?? 0).toFixed(6)}</div>
              <div className="text-xs text-muted-foreground mb-4">
                Locked: {(b.locked ?? 0).toFixed(6)}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Amount"
                  value={withdrawAmt[b.asset] || ""}
                  onChange={(e) => setWithdrawAmt({ ...withdrawAmt, [b.asset]: e.target.value })}
                />
                <Button size="sm" variant="secondary" onClick={() => withdraw(b.asset)}>
                  Withdraw
                </Button>
              </div>
            </Card>
          ))}
          {balances.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-12">
              No balances yet. Click "Deposit Crypto" to fund your wallet.
            </p>
          )}
        </div>
      </section>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="max-w-md">
          {!activeDeposit ? (
            <>
              <DialogHeader>
                <DialogTitle>Deposit Crypto</DialogTitle>
                <DialogDescription>
                  Choose a currency and USD amount. We'll generate a unique deposit address.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Currency</label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
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
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Amount (USD)</label>
                  <Input
                    type="number"
                    min={1}
                    step="0.01"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={startDeposit}
                  disabled={creating}
                  className="bg-brand hover:bg-brand-glow text-brand-foreground"
                >
                  {creating ? <Loader2 className="animate-spin" /> : "Generate Address"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  Send {activeDeposit.pay_amount} {activeDeposit.pay_currency.toUpperCase()}
                </DialogTitle>
                <DialogDescription>
                  Send exactly this amount to the address below. ${activeDeposit.price_amount} USD will be credited once confirmed on-chain.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="bg-white p-4 rounded-md mx-auto w-fit">
                  <QRCodeSVG value={activeDeposit.pay_address} size={180} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Address</label>
                  <div className="flex gap-2 mt-1">
                    <Input readOnly value={activeDeposit.pay_address} className="font-mono text-xs" />
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(activeDeposit.pay_address);
                        toast.success("Address copied");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium flex items-center gap-2">
                    {polling && !FINISHED.includes(activeDeposit.status) && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    {activeDeposit.status}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={reset}>
                  New Deposit
                </Button>
                <Button onClick={() => setOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
