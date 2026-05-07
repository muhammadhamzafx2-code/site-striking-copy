import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Layout";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log In to XMV" },
      { name: "description", content: "Access your XMV account to trade, deposit and manage your portfolio." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="text-center mb-8"><Logo /></div>
      <Card className="p-8 border-border">
        <h1 className="text-2xl font-bold mb-6">Welcome back</h1>
        <form className="space-y-4">
          <input type="email" placeholder="Email" className="w-full rounded-md bg-secondary px-3 py-3 text-sm" />
          <input type="password" placeholder="Password" className="w-full rounded-md bg-secondary px-3 py-3 text-sm" />
          <Button className="w-full bg-brand hover:bg-brand-glow text-brand-foreground font-semibold">Log In</Button>
        </form>
        <p className="text-sm text-muted-foreground text-center mt-6">
          New to XMV? <Link to="/register" className="text-brand">Sign up</Link>
        </p>
      </Card>
    </div>
  );
}
