import { Switch, Route, Router } from "wouter";
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

  // Redirect based on user role
  if (!user) return <Landing />;
  
  // Redirect admin users to admin panel
  if (user.role === "admin") {
    window.location.hash = '#/admin';
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary-glow font-display text-xl">Redirecting to admin panel...</div>
      </div>
    );
  }
  
  // Redirect owner users to owner dashboard
  if (user.role === "owner") {
    window.location.hash = '#/owner';
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary-glow font-display text-xl">Redirecting to owner dashboard...</div>
      </div>
    );
  }
  
  // Regular users go to server browser
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
