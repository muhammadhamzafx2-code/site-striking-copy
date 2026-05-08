import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountLayout,
});

const links = [
  ["/account/profile", "Profile"],
  ["/account/activities", "Activities"],
  ["/account/sessions", "Sessions"],
  ["/account/verification", "Verification"],
  ["/account/2fa", "2FA"],
  ["/account/password", "Password"],
  ["/account/referrals", "Referrals"],
] as const;

function AccountLayout() {
  return (
    <div className="container mx-auto px-4 py-10 grid md:grid-cols-[220px_1fr] gap-8">
      <aside>
        <h2 className="font-bold mb-4">Account</h2>
        <nav className="flex flex-col gap-1 text-sm">
          {links.map(([to, label]) => (
            <Link
              key={to}
              to={to}
              className="px-3 py-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              activeProps={{ className: "px-3 py-2 rounded-md bg-secondary text-foreground font-medium" }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
