import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/referrals")({
  head: () => ({ meta: [{ title: "Referrals — XMV" }] }),
  component: ReferralsPage,
});

interface Invitee { id: string; inviteeEmail?: string; joinedAt?: any; earnings?: number }

function ReferralsPage() {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [items, setItems] = useState<Invitee[]>([]);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((s) => setCode(s.data()?.referralCode ?? ""));
    return onSnapshot(collection(db, "users", user.uid, "referrals"), (snap) =>
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
  }, [user]);

  const link = typeof window !== "undefined" && code ? `${window.location.origin}/register?ref=${code}` : "";

  return (
    <Card className="p-6 border-border">
      <h1 className="text-2xl font-bold mb-6">Referrals</h1>
      <div className="space-y-2 mb-8">
        <div className="text-xs text-muted-foreground">Your code</div>
        <div className="text-2xl font-mono font-bold text-brand">{code || "—"}</div>
        <div className="text-xs text-muted-foreground mt-3">Share link</div>
        <div className="flex gap-2">
          <input value={link} readOnly className="flex-1 rounded-md bg-secondary px-3 py-2 text-sm font-mono" />
          <Button size="sm" onClick={() => { navigator.clipboard.writeText(link); toast.success("Copied"); }}>Copy</Button>
        </div>
      </div>
      <h2 className="font-semibold mb-3">Invitees ({items.length})</h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No referrals yet.</p>
      ) : (
        <div className="divide-y divide-border text-sm">
          {items.map((i) => (
            <div key={i.id} className="py-3 flex justify-between">
              <span>{i.inviteeEmail}</span>
              <span className="text-brand">+{i.earnings ?? 0} USDT</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
