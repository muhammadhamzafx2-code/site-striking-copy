import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/password")({
  head: () => ({ meta: [{ title: "Change password — XMV" }] }),
  component: PasswordPage,
});

function PasswordPage() {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user || !user.email) return;
    if (next.length < 8) return toast.error("New password must be 8+ chars");
    setLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(auth.currentUser!, cred);
      await updatePassword(auth.currentUser!, next);
      toast.success("Password updated");
      setCurrent(""); setNext("");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  return (
    <Card className="p-6 border-border">
      <h1 className="text-2xl font-bold mb-6">Change password</h1>
      <div className="space-y-4 max-w-md">
        <input type="password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} className="w-full rounded-md bg-secondary px-3 py-2 text-sm" />
        <input type="password" placeholder="New password (8+ chars)" value={next} onChange={(e) => setNext(e.target.value)} className="w-full rounded-md bg-secondary px-3 py-2 text-sm" />
        <Button onClick={submit} disabled={loading} className="bg-brand hover:bg-brand-glow text-brand-foreground">
          {loading ? "..." : "Update password"}
        </Button>
      </div>
    </Card>
  );
}
