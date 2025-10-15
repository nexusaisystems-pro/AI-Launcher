import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Globe, Briefcase, Users, Server, Zap, Shield, Download, TrendingUp, CheckCircle, Loader2 } from "lucide-react";

export default function DayZLanding() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    serversOnline: number;
    totalPlayers: number;
    avgPlayers: number;
  }>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refetch every 30s
  });
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-900">
      {/* Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
            BETA TESTING
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
            DayZ Server Browser
          </h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Discover the best DayZ servers with AI-powered recommendations, automatic mod management, and seamless one-click joining.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/launcher">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8"
                data-testid="button-browse-servers"
              >
                <Globe className="w-5 h-5 mr-2" />
                Browse Servers
              </Button>
            </Link>
            <Link href="/owner">
              <Button 
                size="lg"
                variant="outline"
                className="glass border-green-500/30 hover:border-green-500/60 hover:bg-green-500/10 font-semibold px-8"
                data-testid="button-list-server"
              >
                <Briefcase className="w-5 h-5 mr-2" />
                List My Server
              </Button>
            </Link>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
          <Card className="glass border-green-500/30 bg-gradient-to-br from-green-950/30 to-slate-900/30">
            <CardContent className="pt-6 text-center">
              <Server className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white mb-1">
                {statsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                  `${stats?.serversOnline?.toLocaleString() || 0}`
                )}
              </div>
              <p className="text-sm text-slate-400">Active Servers</p>
            </CardContent>
          </Card>
          <Card className="glass border-green-500/30 bg-gradient-to-br from-green-950/30 to-slate-900/30">
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white mb-1">
                {statsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                  `${stats?.totalPlayers?.toLocaleString() || 0}`
                )}
              </div>
              <p className="text-sm text-slate-400">Players Online</p>
            </CardContent>
          </Card>
          <Card className="glass border-green-500/30 bg-gradient-to-br from-green-950/30 to-slate-900/30">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white mb-1">98%</div>
              <p className="text-sm text-slate-400">Platform Uptime</p>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto mb-16">
          {/* Player Features */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-green-400" />
              For Players
            </h2>
            <div className="space-y-4">
              <Card className="glass border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    AI-Powered Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400">
                    Get personalized server suggestions based on your play style, mod preferences, and performance needs.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="glass border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Automatic Mod Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400">
                    Download and install required mods automatically. No manual Workshop subscriptions needed.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="glass border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    One-Click Server Join
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400">
                    Join any server instantly. We handle mod checks, downloads, and game launching seamlessly.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="glass border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Real-Time Server Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400">
                    Live player counts, ping, server status, and performance metrics updated in real-time.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Server Owner Features */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-400" />
              For Server Owners
            </h2>
            <div className="space-y-4">
              <Card className="glass border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Enhanced Visibility
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400">
                    Reach 100,000+ players. Get featured in AI recommendations and quality rankings.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="glass border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Server Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400">
                    Track player trends, peak hours, retention rates, and growth metrics with detailed dashboards.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="glass border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Quality Badges & Trust Scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400">
                    Earn verified badges, quality grades (S/A/B/C), and trust scores to stand out from competitors.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="glass border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Sponsor Placements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400">
                    Boost your server to the top of search results and featured carousels for maximum exposure.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="glass border-green-500/30 bg-gradient-to-br from-green-950/30 to-slate-900/30 max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl text-white">Ready to Get Started?</CardTitle>
              <CardDescription className="text-slate-300 text-lg">
                Join thousands of players and server owners using GameHub Launcher
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/launcher">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8"
                  data-testid="button-browse-servers-footer"
                >
                  <Globe className="w-5 h-5 mr-2" />
                  Start Browsing Servers
                </Button>
              </Link>
              <Link href="/downloads">
                <Button 
                  size="lg"
                  variant="outline"
                  className="glass border-green-500/30 hover:border-green-500/60 hover:bg-green-500/10 font-semibold px-8"
                  data-testid="button-download-desktop"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Desktop App
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-500 text-sm">
            <p>© 2025 Nexus AI Systems. GameHub Launcher - DayZ Server Browser.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
