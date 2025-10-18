import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DesktopProvider } from "@/contexts/desktop-context";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Homepage from "@/pages/homepage";
import DayZLanding from "@/pages/dayz-landing";
import Dashboard from "@/pages/dashboard";
import Mods from "@/pages/mods";
import OwnerDashboard from "@/pages/owner-dashboard";
import AdminPanel from "@/pages/admin-panel";
import Downloads from "@/pages/downloads";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Homepage} />
      <Route path="/dayz" component={DayZLanding} />
      <Route path="/launcher" component={Dashboard} />
      <Route path="/mods" component={Mods} />
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
