import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/profile")({
  head: () => ({ meta: [{ title: "Profile — XMV" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((s) => {
      const d = s.data() ?? {};
      setDisplayName(d.displayName ?? "");
      setPhone(d.phone ?? "");
      setCountry(d.country ?? "");
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName, phone, country, updatedAt: serverTimestamp(),
      });
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  return (
    <Card className="p-6 border-border">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="text-xs text-muted-foreground">Email</label>
          <input value={user?.email ?? ""} disabled className="w-full rounded-md bg-secondary/50 px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Display name</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-md bg-secondary px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-md bg-secondary px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Country</label>
          <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-md bg-secondary px-3 py-2 text-sm mt-1" />
        </div>
        <Button onClick={save} disabled={loading} className="bg-brand hover:bg-brand-glow text-brand-foreground">
          {loading ? "..." : "Save changes"}
        </Button>
      </div>
    </Card>
  );
}
