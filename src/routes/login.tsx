import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Layout";
import { useState } from "react";
import { z } from "zod";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, appleProvider } from "@/lib/firebase";
import { toast } from "sonner";
import { ensureUserDoc, logActivity, logSession } from "@/lib/userData";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : "/wallets" }),
  head: () => ({
    meta: [
      { title: "Log In to XMV" },
      { name: "description", content: "Access your XMV account to trade, deposit and manage your portfolio." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const after = async (uid: string) => {
    await logActivity(uid, "login");
    await logSession(uid);
    navigate({ to: redirect || "/wallets" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, parsed.data.email, parsed.data.password);
      await ensureUserDoc(res.user);
      toast.success("Welcome back");
      await after(res.user.uid);
    } catch (err: any) {
      toast.error(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(res.user);
      await after(res.user.uid);
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
      await ensureUserDoc(res.user);
      await after(res.user.uid);
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
        <h1 className="text-2xl font-bold mb-6">Welcome back</h1>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md bg-secondary px-3 py-3 text-sm" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md bg-secondary px-3 py-3 text-sm" />
          <div className="text-right">
            <Link to="/forgot-password" className="text-xs text-brand hover:underline">Forgot password?</Link>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-glow text-brand-foreground font-semibold">
            {loading ? "..." : "Log In"}
          </Button>
        </form>
        <div className="my-4 text-center text-xs text-muted-foreground">or</div>
        <Button type="button" variant="outline" className="w-full" onClick={onGoogle} disabled={loading}>
          Continue with Google
        </Button>
        <Button type="button" variant="outline" className="w-full mt-2 bg-black text-white hover:bg-black/90 hover:text-white border-black" onClick={onApple} disabled={loading}>
          <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.86-3.08.41-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.41C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          Continue with Apple
        </Button>
        <p className="text-sm text-muted-foreground text-center mt-6">
          New to XMV? <Link to="/register" className="text-brand">Sign up</Link>
        </p>
      </Card>
    </div>
  );
}
