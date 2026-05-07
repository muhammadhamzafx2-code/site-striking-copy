import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Layout";
import { useState } from "react";
import { z } from "zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your XMV password" },
      { name: "description", content: "Send a password reset link to your XMV account email." },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.string().trim().email("Invalid email").max(255);

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(email);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, parsed.data, {
        url: window.location.origin + "/login",
      });
      toast.success("Check your inbox for the reset link.");
      setEmail("");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="text-center mb-8 flex justify-center"><Logo /></div>
      <Card className="p-8 border-border">
        <h1 className="text-2xl font-bold mb-2">Reset your password</h1>
        <p className="text-sm text-muted-foreground mb-6">We'll email you a link to set a new password.</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md bg-secondary px-3 py-3 text-sm" />
          <Button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-glow text-brand-foreground font-semibold">
            {loading ? "..." : "Send reset link"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground text-center mt-6">
          Back to <Link to="/login" className="text-brand">Log in</Link>
        </p>
      </Card>
    </div>
  );
}
