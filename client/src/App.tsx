import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DesktopProvider } from "@/contexts/desktop-context";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import OwnerDashboard from "@/pages/owner-dashboard";
import AdminPanel from "@/pages/admin-panel";
import Downloads from "@/pages/downloads";

function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary-glow font-display text-xl">Loading...</div>
      </div>
    );
  }

  // Debug logging
  console.log('[HomePage] User:', user);
  console.log('[HomePage] User role:', user?.role);

  // TEMP FIX: Invalidate cache to force refetch of user data
  // This ensures we get the latest role from the database
  if (user && user.role === "player" && user.email === "nexusaisystems@gmail.com") {
    console.log('[HomePage] Invalidating user cache to fetch updated role');
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  }

  // Redirect based on user role
  if (!user) return <Landing />;
  
  // Redirect admin users to admin panel
  if (user.role === "admin") {
    console.log('[HomePage] Redirecting admin to /admin');
    return <Redirect to="/admin" />;
  }
  
  // Redirect owner users to owner dashboard
  if (user.role === "owner") {
    console.log('[HomePage] Redirecting owner to /owner');
    return <Redirect to="/owner" />;
  }
  
  // Regular users go to server browser
  console.log('[HomePage] Showing Dashboard for regular user');
  return <Dashboard />;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/launcher" component={Dashboard} />
      <Route path="/downloads" component={Downloads} />
      <Route path="/owner" component={OwnerDashboard} />
      <Route path="/admin" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DesktopProvider>
        <TooltipProvider>
          <Router hook={useHashLocation}>
            <div className="dark">
              <Toaster />
              <AppRouter />
            </div>
          </Router>
        </TooltipProvider>
      </DesktopProvider>
    </QueryClientProvider>
  );
}

export default App;
