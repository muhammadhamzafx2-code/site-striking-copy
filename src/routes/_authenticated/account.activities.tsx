import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/_authenticated/account/activities")({
  head: () => ({ meta: [{ title: "Activities — XMV" }] }),
  component: ActivitiesPage,
});

interface Activity { id: string; type: string; asset?: string; amount?: number; status?: string; createdAt?: any }

function ActivitiesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Activity[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "activities"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(q, (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))));
  }, [user]);

  return (
    <Card className="p-6 border-border">
      <h1 className="text-2xl font-bold mb-6">Activities</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No activity yet.</p>
      ) : (
        <div className="divide-y divide-border text-sm">
          {items.map((a) => (
            <div key={a.id} className="py-3 flex justify-between">
              <div>
                <div className="font-medium capitalize">{a.type}</div>
                <div className="text-xs text-muted-foreground">{a.createdAt?.toDate?.().toLocaleString?.() ?? ""}</div>
              </div>
              <div className="text-right">
                {a.amount !== undefined && <div>{a.amount} {a.asset}</div>}
                {a.status && <div className="text-xs text-muted-foreground capitalize">{a.status}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
