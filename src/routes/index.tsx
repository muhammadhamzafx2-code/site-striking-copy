import { createFileRoute } from "@tanstack/react-router";
import heroImg from "@/assets/hero-rocket.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Shield, Lock, Zap, FileCheck, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Exonax — Buy & sell crypto in minutes" },
      {
        name: "description",
        content:
          "Trade Bitcoin, Ethereum, USDT and the top altcoins on the new era of crypto asset exchange.",
      },
    ],
  }),
  component: Index,
});

const coins = [
  { sym: "BTC", name: "Bitcoin", price: "$85,657.65", change: 0.32, vol: "$18.68B", color: "#F7931A" },
  { sym: "ETH", name: "Ethereum", price: "$2,520.91", change: 0.34, vol: "$8.04B", color: "#627EEA" },
  { sym: "BNB", name: "Binance Coin", price: "$675.12", change: -0.13, vol: "$604.7M", color: "#F3BA2F" },
  { sym: "BCH", name: "Bitcoin Cash", price: "$513.94", change: 3.7, vol: "$231.0M", color: "#0AC18E" },
  { sym: "TON", name: "Toncoin", price: "$1.45733", change: 1.37, vol: "$448.2M", color: "#0098EA" },
  { sym: "TRX", name: "Tron", price: "$0.36384", change: 2.27, vol: "$3.12B", color: "#FF060A" },
  { sym: "SHIB", name: "Shiba Inu", price: "$0.0000063", change: -0.32, vol: "$80.2M", color: "#FFA409" },
  { sym: "SOL", name: "Solana", price: "$91.7671", change: -0.02, vol: "$1.79B", color: "#9945FF" },
];

const benefits = [
  { icon: Shield, title: "Secure Asset Storage", text: "We use advanced encryption and storage systems to ensure your funds are always safe." },
  { icon: Lock, title: "Reliable Account Protection", text: "We apply strict cybersecurity standards to ensure maximum protection for your account." },
  { icon: Zap, title: "Robust Platform", text: "Our system quickly responds to threats and prevents any hacking attempts." },
  { icon: FileCheck, title: "Transparency with PoR", text: "The Proof of Reserves system confirms that all client assets are securely stored and fully backed." },
];

const faqs = [
  { q: "What is a Cryptocurrency Exchange?", a: "A cryptocurrency exchange is an online marketplace where users can buy, sell, and trade digital assets such as Bitcoin, Ethereum, and many others. These platforms provide secure transactions, liquidity, and user-friendly tools that make trading accessible for both beginners and professionals." },
  { q: "What product does Exonax offer?", a: "Exonax is a versatile platform that covers all key needs of crypto traders. It offers spot trading with high liquidity, futures contracts with leverage, copy trading, and automated bots for hands-off strategies." },
  { q: "How to Buy Bitcoin and Other Cryptocurrencies on Exonax?", a: "Create an account and complete verification (KYC). Then fund your account using fiat or crypto deposits. Once your balance is ready, you can buy Bitcoin, Ethereum, stablecoins, or other popular assets instantly." },
  { q: "How to Track Cryptocurrency Prices on Exonax in Real Time?", a: "Exonax provides live price charts, trading volumes, and historical data so you can monitor the market at any time. Interactive charts with indicators help traders analyze trends and plan strategies." },
  { q: "How to trade cryptocurrencies on Exonax?", a: "After funding your account, you can start trading in the spot market or explore futures with leverage. The platform offers professional tools such as real-time charts, technical indicators, stop-loss and take-profit orders." },
  { q: "How does Exonax ensure the security of user funds and data?", a: "Security is a top priority. Exonax stores most funds in cold wallets, protected from online threats. Accounts are safeguarded with two-factor authentication (2FA), encryption, and withdrawal whitelists." },
];


function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="container mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
            Buy &amp; sell <br />
            <span className="bg-gradient-to-r from-brand to-brand-glow bg-clip-text text-transparent">crypto in minutes</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-md">
            Trade Bitcoin, Ethereum, USDT, and the top altcoins on the new era of crypto asset exchange.
          </p>
          <form className="mt-8 flex items-center gap-2 rounded-full bg-card p-2 pl-5 max-w-md border border-border shadow-[var(--shadow-glow)]">
            <Input
              type="email"
              placeholder="Enter your email address"
              className="border-0 bg-transparent focus-visible:ring-0 shadow-none px-0"
            />
            <Button className="rounded-full bg-brand hover:bg-brand-glow text-brand-foreground font-semibold px-6">Get Started</Button>
          </form>
          <div className="mt-6">
            <button className="grid h-12 w-12 place-items-center rounded-full bg-card border border-border hover:bg-secondary transition">
              <svg viewBox="0 0 24 24" className="h-6 w-6"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            </button>
          </div>
        </div>
        <div className="relative">
          <img src={heroImg} alt="Astronaut on a Bitcoin rocket" className="w-full h-auto drop-shadow-2xl" width={1024} height={1024} />
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { v: "200+", l: "Countries" },
    { v: "39 million", l: "Investors from Around the World" },
    { v: "$450 million", l: "Fund reserve" },
    { v: "$2.29 billion", l: "Trading Volume in 24h" },
  ];
  return (
    <section className="container mx-auto px-4 -mt-8 relative z-10">
      <Card className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-card/80 backdrop-blur border-border">
        {stats.map((s) => (
          <div key={s.l}>
            <div className="text-2xl md:text-3xl font-bold">{s.v}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
          </div>
        ))}
      </Card>
    </section>
  );
}

function Markets() {
  return (
    <section id="markets" className="container mx-auto px-4 py-20">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">Markets</h2>
          <p className="text-muted-foreground mt-2">Top assets by volume on Exonax.</p>
        </div>
        <div className="flex gap-2 text-sm">
          {["All", "Top Gainers", "Top Losers", "Recently Added"].map((t, i) => (
            <button key={t} className={`px-4 py-2 rounded-full border border-border ${i === 0 ? "bg-brand text-brand-foreground border-transparent" : "text-muted-foreground hover:text-foreground"}`}>{t}</button>
          ))}
        </div>
      </div>
      <Card className="overflow-hidden border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left py-4 px-6 font-medium">Name</th>
                <th className="text-right py-4 px-6 font-medium">Last Price</th>
                <th className="text-right py-4 px-6 font-medium">Change</th>
                <th className="text-right py-4 px-6 font-medium hidden md:table-cell">24h Volume</th>
                <th className="py-4 px-6"></th>
              </tr>
            </thead>
            <tbody>
              {coins.map((c) => (
                <tr key={c.sym} className="border-t border-border hover:bg-secondary/30 transition">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full text-white text-xs font-bold" style={{ background: c.color }}>{c.sym.slice(0,2)}</div>
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.sym}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right font-semibold">{c.price}</td>
                  <td className="text-right">
                    <span className={`inline-flex items-center gap-1 font-medium ${c.change >= 0 ? "text-brand" : "text-destructive"}`}>
                      {c.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {c.change >= 0 ? "+" : ""}{c.change}%
                    </span>
                  </td>
                  <td className="text-right text-muted-foreground hidden md:table-cell">{c.vol}</td>
                  <td className="text-right pr-6">
                    <Button variant="ghost" size="sm" className="text-brand hover:text-brand-glow">Trade</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="text-center mt-8">
        <Button variant="outline" className="rounded-full border-brand/40 text-brand hover:bg-brand/10 hover:text-brand">Discover more assets</Button>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section id="benefits" className="container mx-auto px-4 py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">Why choose Exonax</h2>
        <p className="text-muted-foreground mt-3">Built on security, transparency, and reliability.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((b) => (
          <Card key={b.title} className="p-6 bg-card border-border hover:border-brand/40 transition group">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/15 text-brand group-hover:scale-110 transition">
              <b.icon className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">{b.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Community() {
  const socials = [
    { name: "Twitter | X", handle: "@exonax_crypto", icon: "𝕏" },
    { name: "Telegram", handle: "@exonax_exchange", icon: "✈" },
    { name: "Instagram", handle: "@exonax_world", icon: "◎" },
  ];
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">Join the Exonax community</h2>
        <p className="text-muted-foreground mt-3">Stay updated with the latest news, updates, and exclusive promotions.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {socials.map((s) => (
          <Card key={s.name} className="p-6 flex items-center gap-4 bg-card border-border hover:border-brand/40 transition cursor-pointer">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-brand text-brand-foreground text-xl font-bold">{s.icon}</div>
            <div>
              <div className="font-semibold">{s.name}</div>
              <div className="text-sm text-muted-foreground">{s.handle}</div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="container mx-auto px-4 py-16">
      <Card className="relative overflow-hidden p-10 md:p-16 text-center border-border" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 50%, var(--brand) 0%, transparent 50%)" }} />
        <div className="relative">
          <h2 className="text-3xl md:text-5xl font-bold">Start your crypto journey right now!</h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">Unlock the world of digital assets and earn with Exonax.</p>
          <Button size="lg" className="mt-8 rounded-full bg-brand hover:bg-brand-glow text-brand-foreground font-semibold px-8">Register Now</Button>
        </div>
      </Card>
    </section>
  );
}

function FAQ() {
  return (
    <section id="faq" className="container mx-auto px-4 py-20 max-w-3xl">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-border">
            <AccordionTrigger className="text-left text-base hover:text-brand">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border mt-10">
      <div className="container mx-auto px-4 py-12 grid md:grid-cols-4 gap-8 text-sm">
        <div>
          <Logo />
          <p className="mt-4 text-muted-foreground">The new era of crypto asset exchange.</p>
        </div>
        {[
          { title: "Products", items: ["Trade", "Markets", "Buy crypto", "VIP"] },
          { title: "Company", items: ["About Us", "Blog", "Fee Rate", "Affiliate"] },
          { title: "Support", items: ["Help Center", "Terms of Service", "Privacy", "Contact"] },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="font-semibold mb-4">{col.title}</h4>
            <ul className="space-y-2 text-muted-foreground">
              {col.items.map((i) => <li key={i}><a href="#" className="hover:text-brand">{i}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Exonax. All rights reserved.</div>
    </footer>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <Stats />
      <Markets />
      <Benefits />
      <Community />
      <CTA />
      <FAQ />
      <Footer />
    </div>
  );
}
