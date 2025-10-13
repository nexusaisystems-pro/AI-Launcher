import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DesktopProvider } from "@/contexts/desktop-context";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import OwnerDashboard from "@/pages/owner-dashboard";
import AdminPanel from "@/pages/admin-panel";
import Downloads from "@/pages/downloads";

function HomePage() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary-glow font-display text-xl">Loading...</div>
      </div>
    );
  }

  // Show landing page if not authenticated, dashboard if authenticated
  return user ? <Dashboard /> : <Landing />;
}

function Router() {
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
          <div className="dark">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </DesktopProvider>
    </QueryClientProvider>
  );
}

export default App;
