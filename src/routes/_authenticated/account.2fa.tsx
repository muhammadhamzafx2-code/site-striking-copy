import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Secret, TOTP } from "otpauth";
import { QRCodeSVG } from "qrcode.react";

export const Route = createFileRoute("/_authenticated/account/2fa")({
  head: () => ({ meta: [{ title: "2FA — XMV" }] }),
  component: TwoFAPage,
});

function TwoFAPage() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((s) => {
      const d = s.data() ?? {};
      setEnabled(!!d.twoFAEnabled);
      setSecret(d.twoFASecret ?? null);
    });
  }, [user]);

  const generate = () => {
    const s = new Secret({ size: 20 }).base32;
    setSecret(s);
    setCode("");
  };

  const totpUri = secret && user
    ? new TOTP({ issuer: "XMV", label: user.email ?? "user", secret: Secret.fromBase32(secret) }).toString()
    : "";

  const enable = async () => {
    if (!user || !secret) return;
    const totp = new TOTP({ issuer: "XMV", label: user.email ?? "user", secret: Secret.fromBase32(secret) });
    if (totp.validate({ token: code, window: 1 }) === null) return toast.error("Invalid code");
    await updateDoc(doc(db, "users", user.uid), { twoFAEnabled: true, twoFASecret: secret, updatedAt: serverTimestamp() });
    setEnabled(true);
    toast.success("2FA enabled");
  };

  const disable = async () => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), { twoFAEnabled: false, twoFASecret: null });
    setEnabled(false); setSecret(null); setCode("");
    toast.success("2FA disabled");
  };

  return (
    <Card className="p-6 border-border">
      <h1 className="text-2xl font-bold mb-2">Two-factor authentication</h1>
      <p className="text-sm text-muted-foreground mb-6">Status: <span className="font-medium text-foreground">{enabled ? "Enabled" : "Disabled"}</span></p>
      {enabled ? (
        <Button variant="destructive" onClick={disable}>Disable 2FA</Button>
      ) : (
        <div className="space-y-4 max-w-md">
          {!secret ? (
            <Button onClick={generate} className="bg-brand hover:bg-brand-glow text-brand-foreground">Generate secret</Button>
          ) : (
            <>
              <div className="bg-white p-4 rounded-md inline-block"><QRCodeSVG value={totpUri} size={160} /></div>
              <div className="text-xs font-mono break-all text-muted-foreground">{secret}</div>
              <input placeholder="Enter 6-digit code" value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-md bg-secondary px-3 py-2 text-sm" />
              <Button onClick={enable} className="bg-brand hover:bg-brand-glow text-brand-foreground">Verify & enable</Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
