import { createFileRoute, Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" search={{ redirect: location.pathname }} replace />;
  }
  return <Outlet />;
}
