import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/verification")({
  head: () => ({ meta: [{ title: "Verification — XMV" }] }),
  component: VerificationPage,
});

function VerificationPage() {
  const { user } = useAuth();
  const [idType, setIdType] = useState("passport");
  const [idNumber, setIdNumber] = useState("");
  const [status, setStatus] = useState<string>("unverified");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid, "verification", "current")).then((s) => {
      const d = s.data();
      if (d) {
        setIdType(d.idType ?? "passport");
        setIdNumber(d.idNumber ?? "");
        setStatus(d.status ?? "unverified");
      }
    });
  }, [user]);

  const submit = async () => {
    if (!user) return;
    if (!idNumber.trim()) return toast.error("Enter ID number");
    setLoading(true);
    try {
      await setDoc(doc(db, "users", user.uid, "verification", "current"), {
        idType, idNumber, status: "pending", submittedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", user.uid), { kycStatus: "pending" });
      setStatus("pending");
      toast.success("Verification submitted for review");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  return (
    <Card className="p-6 border-border">
      <h1 className="text-2xl font-bold mb-2">KYC verification</h1>
      <p className="text-sm text-muted-foreground mb-6">Status: <span className="capitalize font-medium text-foreground">{status}</span></p>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="text-xs text-muted-foreground">ID type</label>
          <select value={idType} onChange={(e) => setIdType(e.target.value)} className="w-full rounded-md bg-secondary px-3 py-2 text-sm mt-1">
            <option value="passport">Passport</option>
            <option value="national_id">National ID</option>
            <option value="drivers_license">Driver's License</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">ID number</label>
          <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="w-full rounded-md bg-secondary px-3 py-2 text-sm mt-1" />
        </div>
        <Button onClick={submit} disabled={loading} className="bg-brand hover:bg-brand-glow text-brand-foreground">
          {loading ? "..." : "Submit"}
        </Button>
      </div>
    </Card>
  );
}
