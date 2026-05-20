import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Layout";
import { useState } from "react";
import { z } from "zod";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, appleProvider } from "@/lib/firebase";
import { toast } from "sonner";
import { ensureUserDoc, logActivity, logSession } from "@/lib/userData";

export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>) => ({ ref: typeof s.ref === "string" ? s.ref : undefined }),
  head: () => ({
    meta: [
      { title: "Create your XMV account" },
      { name: "description", content: "Sign up for XMV in seconds and start trading crypto." },
    ],
  }),
  component: RegisterPage,
});

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
  referralCode: z.string().trim().max(64).optional(),
});

function RegisterPage() {
  const navigate = useNavigate();
  const { ref } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(ref ?? "");
  const [loading, setLoading] = useState(false);

  const finish = async (uid: string) => {
    await logActivity(uid, "signup");
    await logSession(uid);
    navigate({ to: "/wallets" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, referralCode: referralCode || undefined });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, parsed.data.email, parsed.data.password);
      await ensureUserDoc(res.user, { referredBy: parsed.data.referralCode ?? null });
      toast.success("Account created");
      await finish(res.user.uid);
    } catch (err: any) {
      toast.error(err.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(res.user, { referredBy: referralCode || null });
      await finish(res.user.uid);
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const onApple = async () => {
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, appleProvider);
      await ensureUserDoc(res.user, { referredBy: referralCode || null });
      await finish(res.user.uid);
    } catch (err: any) {
      toast.error(err.message ?? "Apple sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="text-center mb-8 flex justify-center"><Logo /></div>
      <Card className="p-8 border-border">
        <h1 className="text-2xl font-bold mb-6">Create your account</h1>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md bg-secondary px-3 py-3 text-sm" />
          <input type="password" placeholder="Password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md bg-secondary px-3 py-3 text-sm" />
          <input type="text" placeholder="Referral code (optional)" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="w-full rounded-md bg-secondary px-3 py-3 text-sm" />
          <Button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-glow text-brand-foreground font-semibold">
            {loading ? "..." : "Sign Up"}
          </Button>
        </form>
        <div className="my-4 text-center text-xs text-muted-foreground">or</div>
        <Button type="button" variant="outline" className="w-full" onClick={onGoogle} disabled={loading}>
          Continue with Google
        </Button>
        <p className="text-sm text-muted-foreground text-center mt-6">
          Already have an account? <Link to="/login" className="text-brand">Log in</Link>
        </p>
      </Card>
    </div>
  );
}
