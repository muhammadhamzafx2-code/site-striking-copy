import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Layout";
import { useState } from "react";
import { z } from "zod";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, referralCode: referralCode || undefined });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, parsed.data.email, parsed.data.password);
      await setDoc(doc(db, "users", res.user.uid), {
        email: res.user.email,
        referralCode: parsed.data.referralCode ?? null,
        createdAt: serverTimestamp(),
      });
      toast.success("Account created");
      navigate({ to: "/" });
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
      await setDoc(
        doc(db, "users", res.user.uid),
        { email: res.user.email, displayName: res.user.displayName, createdAt: serverTimestamp() },
        { merge: true }
      );
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-in failed");
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
