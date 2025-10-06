import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Loader2, Server, Shield, UserCircle } from "lucide-react";

export default function OwnerDashboard() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [serverAddress, setServerAddress] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch owned servers
  const { data: ownedServers, isLoading: serversLoading } = useQuery({
    queryKey: ["/api/owner/servers"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Fetch pending claims
  const { data: pendingClaims, isLoading: claimsLoading } = useQuery({
    queryKey: ["/api/owner/claims"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Create claim mutation
  const createClaimMutation = useMutation({
    mutationFn: async (address: string) => {
      return await apiRequest("/api/owner/claims", {
        method: "POST",
        body: JSON.stringify({ serverAddress: address }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Claim Created",
        description: `Verification token: ${data.verificationToken}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/claims"] });
      setServerAddress("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Owner Dashboard</h1>
              <p className="text-sm text-slate-400">Manage your game servers</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="w-8 h-8 text-slate-400" />
              )}
              <div className="text-sm">
                <div className="text-white font-medium">
                  {user?.firstName || user?.lastName 
                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                    : user?.email || "User"}
                </div>
                <div className="text-slate-400 text-xs capitalize">{user?.role}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/api/logout"}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Claim Server Form */}
          <Card className="lg:col-span-1 bg-slate-900/50 border-slate-800" data-testid="card-claim-server">
            <CardHeader>
              <CardTitle className="text-white">Claim Server</CardTitle>
              <CardDescription className="text-slate-400">
                Enter your server address to claim ownership
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (serverAddress.trim()) {
                    createClaimMutation.mutate(serverAddress.trim());
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="serverAddress" className="text-slate-300">
                    Server Address (IP:Port)
                  </Label>
                  <Input
                    id="serverAddress"
                    placeholder="e.g., 192.168.1.1:2302"
                    value={serverAddress}
                    onChange={(e) => setServerAddress(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    data-testid="input-server-address"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                  disabled={createClaimMutation.isPending || !serverAddress.trim()}
                  data-testid="button-submit-claim"
                >
                  {createClaimMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Claim...
                    </>
                  ) : (
                    "Create Claim"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Owned Servers */}
          <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800" data-testid="card-owned-servers">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Server className="w-5 h-5" />
                Your Servers
              </CardTitle>
              <CardDescription className="text-slate-400">
                Servers you own and manage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {serversLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                </div>
              ) : ownedServers && ownedServers.length > 0 ? (
                <div className="space-y-3">
                  {ownedServers.map((server: any) => (
                    <div
                      key={server.address}
                      className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                      data-testid={`server-${server.address}`}
                    >
                      <div className="font-medium text-white">{server.name}</div>
                      <div className="text-sm text-slate-400">{server.address}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No servers claimed yet</p>
                  <p className="text-sm mt-1">Use the form to claim your first server</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Claims */}
          <Card className="lg:col-span-3 bg-slate-900/50 border-slate-800" data-testid="card-pending-claims">
            <CardHeader>
              <CardTitle className="text-white">Pending Claims</CardTitle>
              <CardDescription className="text-slate-400">
                Claims awaiting verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {claimsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                </div>
              ) : pendingClaims && pendingClaims.length > 0 ? (
                <div className="space-y-3">
                  {pendingClaims.map((claim: any) => (
                    <div
                      key={claim.id}
                      className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                      data-testid={`claim-${claim.id}`}
                    >
                      <div className="font-medium text-white">{claim.serverAddress}</div>
                      <div className="text-sm text-slate-400">Status: {claim.status}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <p>No pending claims</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
