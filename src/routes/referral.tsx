import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export const Route = createFileRoute("/referral")({
  head: () => ({
    meta: [
      { title: "Refer a Friend — Earn Together | XMV" },
      { name: "description", content: "Share your XMV referral link and both you and your friend earn rewards." },
    ],
  }),
  component: ReferralPage,
});

function ReferralPage() {
  return (
    <>
      <PageHeader title="Refer a Friend" subtitle="Invite friends to XMV and earn rewards together." />
      <section className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="p-8 border-border">
          <h3 className="font-semibold mb-2">Your referral link</h3>
          <div className="flex gap-2 mt-4">
            <input readOnly value="https://xmv.example/r/EXNX-ABC123" className="flex-1 rounded-md bg-secondary px-3 py-3 text-sm" />
            <Button className="bg-brand hover:bg-brand-glow text-brand-foreground"><Copy className="h-4 w-4 mr-2" />Copy</Button>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-border text-center">
            <div><div className="text-2xl font-bold">12</div><div className="text-xs text-muted-foreground">Friends invited</div></div>
            <div><div className="text-2xl font-bold text-brand">$240</div><div className="text-xs text-muted-foreground">Earned</div></div>
            <div><div className="text-2xl font-bold">8</div><div className="text-xs text-muted-foreground">Active</div></div>
          </div>
        </Card>
      </section>
    </>
  );
}
