import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/sessions")({
  head: () => ({ meta: [{ title: "Sessions — XMV" }] }),
  component: SessionsPage,
});

interface Session { id: string; device?: string; lastSeen?: any; current?: boolean }

function SessionsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Session[]>([]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "users", user.uid, "sessions"), (snap) =>
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
  }, [user]);

  const revoke = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "sessions", id));
    toast.success("Session revoked");
  };

  return (
    <Card className="p-6 border-border">
      <h1 className="text-2xl font-bold mb-6">Active sessions</h1>
      <div className="space-y-3">
        {items.map((s) => (
          <div key={s.id} className="flex justify-between items-center p-3 rounded-md bg-secondary/40">
            <div className="text-sm truncate max-w-[60%]">{s.device}</div>
            <Button size="sm" variant="secondary" onClick={() => revoke(s.id)}>Revoke</Button>
          </div>
        ))}
        {items.length === 0 && <p className="text-muted-foreground text-sm">No sessions recorded.</p>}
      </div>
    </Card>
  );
}
