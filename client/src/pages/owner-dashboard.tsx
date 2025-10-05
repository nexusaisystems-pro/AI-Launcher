import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, TrendingUp, Users, Activity, Calendar, Zap, Shield, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface OwnedServer {
  id: string;
  address: string;
  name: string;
  map?: string;
  playerCount?: number;
  maxPlayers?: number;
  ping?: number;
  queue?: number;
  uptime?: number;
  region?: string;
  perspective?: string;
  mods?: any[];
  verified?: boolean;
  lastSeen?: string;
  ownership: {
    subscriptionTier: string;
    subscriptionStatus: string;
    trialEndsAt?: string;
    verifiedAt?: string;
  };
}

export default function OwnerDashboard() {
  const [, params] = useRoute("/dashboard");
  const sessionId = localStorage.getItem("sessionId") || "";

  const { data: ownedServers, isLoading } = useQuery<OwnedServer[]>({
    queryKey: ["/api/servers/owned", sessionId],
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!ownedServers || ownedServers.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
              <Crown className="w-6 h-6 text-amber-500" />
            </div>
            <CardTitle>No Servers Found</CardTitle>
            <CardDescription>
              You haven't claimed any servers yet. Find your server in the browser and click "Claim This Server" to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = "/"} data-testid="button-browse-servers">
              Browse Servers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const server = ownedServers[0];
  const ownership = server.ownership;
  const trialDaysRemaining = ownership.trialEndsAt 
    ? Math.ceil((new Date(ownership.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Server Dashboard</h1>
                <p className="text-sm text-muted-foreground">{server.name}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/"} data-testid="button-back-home">
              Back to Browser
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Trial Status Banner */}
        {ownership.subscriptionStatus === "trial" && (
          <div className="mb-6 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Free Trial Active</h3>
                <p className="text-sm text-muted-foreground">
                  You have {trialDaysRemaining} days remaining in your 7-day AI Insights trial.
                  Upgrade to continue accessing premium features after your trial ends.
                </p>
              </div>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600" data-testid="button-upgrade">
                Upgrade Now
              </Button>
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Players</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {server.playerCount}/{server.maxPlayers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((server.playerCount / server.maxPlayers) * 100)}% capacity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Ping</CardTitle>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{server.ping}ms</div>
              <p className="text-xs text-success mt-1">Excellent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Uptime</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{server.uptime || 99}%</div>
              <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Queue</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{server.queue || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">players waiting</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Server Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Server Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Server Address</p>
                    <p className="text-sm font-mono text-foreground">{server.address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Map</p>
                    <p className="text-sm text-foreground">{server.map}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Region</p>
                    <p className="text-sm text-foreground">{server.region || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Perspective</p>
                    <p className="text-sm text-foreground">{server.perspective || "Both"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Mods</p>
                    <p className="text-sm text-foreground">{server.mods?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Last Seen</p>
                    <p className="text-sm text-foreground">
                      {server.lastSeen ? formatDistanceToNow(new Date(server.lastSeen), { addSuffix: true }) : "Unknown"}
                    </p>
                  </div>
                </div>

                {server.verified && (
                  <div className="pt-4 border-t border-border">
                    <Badge className="badge-success">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified Server
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Placeholder for Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Player Analytics
                </CardTitle>
                <CardDescription>Coming soon with AI Insights Pro</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-secondary rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Player trend charts will appear here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Current Plan</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {ownership.subscriptionStatus === "trial" ? "Free Trial" : ownership.subscriptionTier}
                    </Badge>
                  </div>
                </div>

                {ownership.subscriptionStatus === "trial" && ownership.trialEndsAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Trial Ends</p>
                    <p className="text-sm text-foreground">
                      {new Date(ownership.trialEndsAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Verified</p>
                  <p className="text-sm text-foreground">
                    {ownership.verifiedAt ? formatDistanceToNow(new Date(ownership.verifiedAt), { addSuffix: true }) : "Not verified"}
                  </p>
                </div>

                <Button className="w-full" variant="outline" data-testid="button-manage-subscription">
                  Manage Subscription
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" data-testid="button-view-server">
                  <Activity className="w-4 h-4 mr-2" />
                  View in Browser
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-server-settings">
                  <Shield className="w-4 h-4 mr-2" />
                  Server Settings
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-promotion">
                  <Zap className="w-4 h-4 mr-2" />
                  Promote Server
                </Button>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Questions about your dashboard or premium features?
                </p>
                <Button variant="outline" size="sm" className="w-full" data-testid="button-support">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
