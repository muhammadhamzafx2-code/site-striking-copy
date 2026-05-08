import { Link, Outlet } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Globe, Moon, Menu, LogOut, Wallet, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand/15 text-brand">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 17l5-5 4 4 8-9" />
          <path d="M14 7h6v6" />
        </svg>
      </div>
      <span className="text-xl font-bold tracking-tight">XMV</span>
    </Link>
  );
}

const navLinks = [
  { to: "/exchange", label: "Trade" },
  { to: "/prices", label: "Markets" },
  { to: "/buy-crypto", label: "Buy crypto" },
  { to: "/fees", label: "Fees" },
  { to: "/vip", label: "VIP" },
  { to: "/blog", label: "Blog" },
] as const;

function Header() {
  const { user, signOut } = useAuth();
  const initial = (user?.displayName || user?.email || "?").charAt(0).toUpperCase();
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-10">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="hover:text-foreground transition"
                activeProps={{ className: "text-foreground" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="grid h-9 w-9 place-items-center rounded-full bg-brand text-brand-foreground font-semibold text-sm">
                  {initial}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="text-xs">{user.email}</DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/wallets"><Wallet className="h-4 w-4 mr-2" /> Wallets</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account/profile"><UserIcon className="h-4 w-4 mr-2" /> Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="secondary" size="sm" className="hidden sm:inline-flex">Log In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-brand hover:bg-brand-glow text-brand-foreground font-semibold">Sign Up</Button>
              </Link>
            </>
          )}
          <button className="ml-2 hidden sm:grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground"><Globe className="h-4 w-4" /></button>
          <button className="hidden sm:grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground"><Moon className="h-4 w-4" /></button>
          <button className="md:hidden grid h-9 w-9 place-items-center rounded-full bg-secondary"><Menu className="h-4 w-4" /></button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const cols = [
    { title: "Products", items: [["Trade", "/exchange"], ["Markets", "/prices"], ["Buy crypto", "/buy-crypto"], ["VIP", "/vip"]] },
    { title: "Company", items: [["About Us", "/about-us"], ["Blog", "/blog"], ["Fees", "/fees"], ["Affiliate", "/affiliate"], ["Referral", "/referral"]] },
    { title: "Support", items: [["Help Center", "/help/terms"], ["Terms of Service", "/help/terms"], ["Login", "/login"], ["Register", "/register"]] },
  ] as const;
  return (
    <footer className="border-t border-border mt-10">
      <div className="container mx-auto px-4 py-12 grid md:grid-cols-4 gap-8 text-sm">
        <div>
          <Logo />
          <p className="mt-4 text-muted-foreground">The new era of crypto asset exchange.</p>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="font-semibold mb-4">{col.title}</h4>
            <ul className="space-y-2 text-muted-foreground">
              {col.items.map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="hover:text-brand">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} XMV. All rights reserved.</div>
    </footer>
  );
}

export function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
