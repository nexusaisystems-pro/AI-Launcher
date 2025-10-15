import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Shield, Users, Server, Activity, CheckCircle, XCircle, Clock, UserCircle, Database, Play, RefreshCw, Globe, Briefcase, LogOut } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPanel() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("claims");
  const [enrichmentRunning, setEnrichmentRunning] = useState(false);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;
    
    if (!isAuthenticated || user?.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, authLoading, user, toast]);

  // Fetch pending claims
  const { data: pendingClaims, isLoading: claimsLoading } = useQuery({
    queryKey: ["/api/admin/claims"],
    retry: false,
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Fetch all servers
  const { data: servers, isLoading: serversLoading } = useQuery({
    queryKey: ["/api/admin/servers"],
    retry: false,
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Fetch enrichment progress
  const { data: enrichmentProgress, refetch: refetchProgress } = useQuery({
    queryKey: ["/api/admin/enrich-servers/progress"],
    retry: false,
    enabled: isAuthenticated && user?.role === "admin",
    refetchInterval: enrichmentRunning ? 2000 : false, // Poll every 2s when running
  });

  // Approve claim mutation
  const approveClaimMutation = useMutation({
    mutationFn: async (claimId: string) => {
      return await apiRequest(`/api/admin/claims/${claimId}/approve`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Claim Approved",
        description: "Server ownership has been granted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/claims"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject claim mutation
  const rejectClaimMutation = useMutation({
    mutationFn: async (claimId: string) => {
      return await apiRequest(`/api/admin/claims/${claimId}/reject`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Claim Rejected",
        description: "The claim has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/claims"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Start enrichment mutation
  const startEnrichmentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/enrich-servers");
    },
    onSuccess: () => {
      setEnrichmentRunning(true);
      toast({
        title: "Enrichment Started",
        description: "Server enrichment process has begun. This will take approximately 1-2 hours.",
      });
      refetchProgress();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Monitor enrichment completion
  useEffect(() => {
    if (enrichmentProgress?.isRunning) {
      setEnrichmentRunning(true);
    } else if (enrichmentRunning && enrichmentProgress && !enrichmentProgress.isRunning) {
      setEnrichmentRunning(false);
      toast({
        title: "Enrichment Complete!",
        description: `Successfully enriched ${enrichmentProgress.successfulEnrichments} servers.`,
      });
    }
  }, [enrichmentProgress, enrichmentRunning, toast]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              <p className="text-sm text-slate-400">Platform administration</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/launcher">
              <Button
                variant="outline"
                size="sm"
                className="glass border-primary/30 hover:border-primary/50"
                data-testid="button-nav-browser"
              >
                <Globe className="w-4 h-4 mr-2" />
                Server Browser
              </Button>
            </Link>
            <Link href="/owner">
              <Button
                variant="outline"
                size="sm"
                className="glass border-primary/30 hover:border-primary/50"
                data-testid="button-nav-owner"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Owner Dashboard
              </Button>
            </Link>
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
                    : user?.email || "Admin"}
                </div>
                <Badge variant="secondary" className="text-xs bg-purple-600/20 text-purple-400 border-purple-500/30">
                  Admin
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/api/logout"}
              className="glass border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="bg-slate-900/50 border-slate-800" data-testid="card-stats-claims">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Pending Claims</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {claimsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  pendingClaims?.length || 0
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800" data-testid="card-stats-users">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {usersLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  users?.length || 0
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">Registered accounts</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800" data-testid="card-stats-servers">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Total Servers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {serversLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  servers?.length || 0
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">In the system</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Card className="bg-slate-900/50 border-slate-800" data-testid="card-management-tabs">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader>
              <TabsList className="bg-slate-800/50">
                <TabsTrigger value="claims" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400" data-testid="tab-claims">
                  <Clock className="w-4 h-4 mr-2" />
                  Pending Claims
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400" data-testid="tab-users">
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="servers" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400" data-testid="tab-servers">
                  <Server className="w-4 h-4 mr-2" />
                  Servers
                </TabsTrigger>
                <TabsTrigger value="enrichment" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400" data-testid="tab-enrichment">
                  <Database className="w-4 h-4 mr-2" />
                  Data Enrichment
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* Pending Claims Tab */}
              <TabsContent value="claims" className="mt-0">
                {claimsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                  </div>
                ) : pendingClaims && pendingClaims.length > 0 ? (
                  <div className="space-y-4">
                    {pendingClaims.map((claim: any) => (
                      <div
                        key={claim.id}
                        className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                        data-testid={`claim-${claim.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-white">{claim.serverAddress}</h3>
                              <Badge variant="outline" className="text-xs border-yellow-600/30 text-yellow-400">
                                {claim.status}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-slate-400">
                              <p>User: {claim.userEmail || "Unknown"}</p>
                              <p>Token: <code className="text-purple-400">{claim.verificationToken}</code></p>
                              <p>Requested: {new Date(claim.createdAt).toLocaleString()}</p>
                              {claim.expiresAt && (
                                <p>Expires: {new Date(claim.expiresAt).toLocaleString()}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-600/30 text-green-400 hover:bg-green-600/20"
                              onClick={() => approveClaimMutation.mutate(claim.id)}
                              disabled={approveClaimMutation.isPending || rejectClaimMutation.isPending}
                              data-testid={`button-approve-${claim.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600/30 text-red-400 hover:bg-red-600/20"
                              onClick={() => rejectClaimMutation.mutate(claim.id)}
                              disabled={approveClaimMutation.isPending || rejectClaimMutation.isPending}
                              data-testid={`button-reject-${claim.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No pending claims</p>
                    <p className="text-sm mt-1">All claims have been processed</p>
                  </div>
                )}
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="mt-0">
                {usersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                  </div>
                ) : users && users.length > 0 ? (
                  <div className="space-y-3">
                    {users.map((u: any) => (
                      <div
                        key={u.id}
                        className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                        data-testid={`user-${u.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {u.profileImageUrl ? (
                              <img 
                                src={u.profileImageUrl} 
                                alt={u.email} 
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <UserCircle className="w-10 h-10 text-slate-500" />
                            )}
                            <div>
                              <div className="font-medium text-white">
                                {u.firstName || u.lastName 
                                  ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
                                  : u.email}
                              </div>
                              <div className="text-sm text-slate-400">{u.email}</div>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={
                              u.role === "admin" 
                                ? "border-purple-600/30 text-purple-400" 
                                : u.role === "owner"
                                ? "border-cyan-600/30 text-cyan-400"
                                : "border-slate-600/30 text-slate-400"
                            }
                          >
                            {u.role}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No users found</p>
                  </div>
                )}
              </TabsContent>

              {/* Servers Tab */}
              <TabsContent value="servers" className="mt-0">
                {serversLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                  </div>
                ) : servers && servers.length > 0 ? (
                  <div className="space-y-3">
                    {servers.map((s: any) => (
                      <div
                        key={s.id}
                        className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                        data-testid={`server-${s.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-white">{s.name}</div>
                            <div className="text-sm text-slate-400 mt-1">
                              <p>Address: {s.address}</p>
                              {s.ownerEmail && <p>Owner: {s.ownerEmail}</p>}
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={
                              s.ownerId 
                                ? "border-green-600/30 text-green-400" 
                                : "border-slate-600/30 text-slate-400"
                            }
                          >
                            {s.ownerId ? "Claimed" : "Unclaimed"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No servers found</p>
                  </div>
                )}
              </TabsContent>

              {/* Data Enrichment Tab */}
              <TabsContent value="enrichment" className="mt-0">
                <div className="space-y-6">
                  {/* Enrichment Status Card */}
                  <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">BattleMetrics Data Enrichment</h3>
                        <p className="text-sm text-slate-400 mt-1">
                          Fetch quality data for all servers to ensure accurate S/A/B/C/D/F grading
                        </p>
                      </div>
                      <Button
                        onClick={() => startEnrichmentMutation.mutate()}
                        disabled={enrichmentRunning || startEnrichmentMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                        data-testid="button-start-enrichment"
                      >
                        {enrichmentRunning ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Start Enrichment
                          </>
                        )}
                      </Button>
                    </div>

                    {enrichmentProgress && (
                      <div className="space-y-4 mt-6">
                        {/* Progress Bar */}
                        {enrichmentProgress.totalServers > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Progress</span>
                              <span className="text-white font-medium">
                                {enrichmentProgress.processedServers} / {enrichmentProgress.totalServers} servers
                              </span>
                            </div>
                            <Progress 
                              value={(enrichmentProgress.processedServers / enrichmentProgress.totalServers) * 100} 
                              className="h-2"
                            />
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>
                                Batch {enrichmentProgress.currentBatch} / {enrichmentProgress.totalBatches}
                              </span>
                              {enrichmentProgress.estimatedCompletionTime && (
                                <span>
                                  ETA: {new Date(enrichmentProgress.estimatedCompletionTime).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Statistics Grid */}
                        <div className="grid grid-cols-3 gap-4 pt-4">
                          <div className="text-center p-3 bg-green-600/10 rounded-lg border border-green-600/20">
                            <div className="text-2xl font-bold text-green-400">
                              {enrichmentProgress.successfulEnrichments}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">Successful</div>
                          </div>
                          <div className="text-center p-3 bg-red-600/10 rounded-lg border border-red-600/20">
                            <div className="text-2xl font-bold text-red-400">
                              {enrichmentProgress.failedEnrichments}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">Failed</div>
                          </div>
                          <div className="text-center p-3 bg-blue-600/10 rounded-lg border border-blue-600/20">
                            <div className="text-2xl font-bold text-blue-400">
                              {enrichmentProgress.skippedServers}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">Skipped</div>
                          </div>
                        </div>

                        {/* Status Info */}
                        <div className="pt-4 border-t border-slate-700">
                          <div className="flex items-center gap-2">
                            <Activity className={`w-4 h-4 ${enrichmentProgress.isRunning ? 'text-green-400 animate-pulse' : 'text-slate-500'}`} />
                            <span className="text-sm text-slate-400">
                              Status: <span className={enrichmentProgress.isRunning ? 'text-green-400' : 'text-slate-400'}>
                                {enrichmentProgress.isRunning ? 'Running' : 'Idle'}
                              </span>
                            </span>
                          </div>
                          {enrichmentProgress.startTime && (
                            <div className="text-xs text-slate-500 mt-2">
                              Started: {new Date(enrichmentProgress.startTime).toLocaleString()}
                            </div>
                          )}
                        </div>

                        {/* Errors (if any) */}
                        {enrichmentProgress.errors && enrichmentProgress.errors.length > 0 && (
                          <div className="pt-4 border-t border-slate-700">
                            <details className="text-sm">
                              <summary className="text-slate-400 cursor-pointer hover:text-slate-300">
                                Errors ({enrichmentProgress.errors.length})
                              </summary>
                              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                                {enrichmentProgress.errors.slice(0, 10).map((error: string, i: number) => (
                                  <div key={i} className="text-xs text-red-400 font-mono bg-red-950/20 p-2 rounded">
                                    {error}
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    )}

                    {!enrichmentProgress && (
                      <div className="text-center py-8 text-slate-400">
                        <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No enrichment data available</p>
                        <p className="text-xs mt-1">Click "Start Enrichment" to begin</p>
                      </div>
                    )}
                  </div>

                  {/* Info Card */}
                  <div className="p-4 bg-blue-600/10 rounded-lg border border-blue-600/20">
                    <div className="flex gap-3">
                      <Activity className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-blue-400 font-medium">What is enrichment?</p>
                        <p className="text-slate-400 mt-1">
                          Enrichment fetches real BattleMetrics data (rank, uptime, player activity) for all servers. 
                          This ensures accurate quality grades (S/A/B/C/D/F) instead of defaulting to C-grade.
                        </p>
                        <p className="text-slate-500 mt-2 text-xs">
                          Estimated time: ~1-2 hours for full dataset • Rate limited to prevent API throttling
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
