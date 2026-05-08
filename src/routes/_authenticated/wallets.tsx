import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logActivity } from "@/lib/userData";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/wallets")({
  head: () => ({ meta: [{ title: "Wallets — XMV" }, { name: "description", content: "Manage your XMV crypto balances." }] }),
  component: WalletsPage,
});

interface Balance { id: string; asset: string; free: number; locked: number }

function WalletsPage() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [withdrawAmt, setWithdrawAmt] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "balances"), (snap) => {
      setBalances(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return unsub;
  }, [user]);

  const deposit = async (asset: string) => {
    if (!user) return;
    const amount = 100;
    const b = balances.find((x) => x.asset === asset);
    if (!b) return;
    await updateDoc(doc(db, "users", user.uid, "balances", asset), {
      free: (b.free || 0) + amount,
      updatedAt: serverTimestamp(),
    });
    await logActivity(user.uid, "deposit", { asset, amount, status: "completed" });
    toast.success(`Deposited ${amount} ${asset} (demo)`);
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

  return (
    <>
      <PageHeader title="Wallets" subtitle="Your XMV balances. Deposits and withdrawals are simulated for demo." />
      <section className="container mx-auto px-4 py-10 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {balances.map((b) => (
          <Card key={b.id} className="p-6 border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{b.asset}</h3>
              <span className="text-xs text-muted-foreground">free</span>
            </div>
            <div className="text-3xl font-bold mb-1">{(b.free ?? 0).toFixed(4)}</div>
            <div className="text-xs text-muted-foreground mb-4">Locked: {(b.locked ?? 0).toFixed(4)}</div>
            <div className="flex gap-2 mb-3">
              <Button size="sm" className="flex-1 bg-brand hover:bg-brand-glow text-brand-foreground" onClick={() => deposit(b.asset)}>Deposit</Button>
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Amount"
                value={withdrawAmt[b.asset] || ""}
                onChange={(e) => setWithdrawAmt({ ...withdrawAmt, [b.asset]: e.target.value })}
                className="flex-1 rounded-md bg-secondary px-3 py-2 text-sm"
              />
              <Button size="sm" variant="secondary" onClick={() => withdraw(b.asset)}>Withdraw</Button>
            </div>
          </Card>
        ))}
        {balances.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-12">No balances yet.</p>
        )}
      </section>
    </>
  );
}
