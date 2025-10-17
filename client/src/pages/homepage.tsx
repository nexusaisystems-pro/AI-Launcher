import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Gamepad2, ArrowRight, Sparkles, Users, Shield, Zap, Loader2, Server, Brain, Target, TrendingUp, Mail, ExternalLink, Play, ChevronRight, Cpu, Network, Rocket } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNewsletterSubscriptionSchema, type InsertNewsletterSubscription } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface GameCardProps {
  name: string;
  status: "beta" | "coming-soon";
  colorScheme: string;
  icon: React.ReactNode;
  path?: string;
  stats?: {
    servers?: number;
    players?: number;
  };
  statsLoading?: boolean;
}

function GameCard({ name, status, colorScheme, icon, path, stats, statsLoading }: GameCardProps) {
  const content = (
    <Card 
      className={`glass border-2 ${colorScheme} transition-all duration-300 hover:scale-105 hover:shadow-2xl ${path ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
      data-testid={`card-game-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <CardTitle className="text-lg font-bold text-white">{name}</CardTitle>
              <Badge 
                variant={status === "beta" ? "default" : "secondary"}
                className={`mt-1 text-xs ${status === "beta" ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}
              >
                {status === "beta" ? "BETA" : "SOON"}
              </Badge>
            </div>
          </div>
          {path && <ArrowRight className="w-4 h-4 text-white/50" />}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-slate-300 text-sm mb-2">
          {status === "beta" 
            ? "Live Now" 
            : "Notify me"}
        </CardDescription>
        {status === "beta" && stats && (
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 text-slate-400">
              <Server className="w-3 h-3" />
              {statsLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <span className="font-semibold">{stats.servers?.toLocaleString() || 0}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Users className="w-3 h-3" />
              {statsLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <span className="font-semibold">{stats.players?.toLocaleString() || 0}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (path) {
    return <Link href={path}>{content}</Link>;
  }
  
  return content;
}

export default function Homepage() {
  const { toast } = useToast();
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<{
    serversOnline: number;
    totalPlayers: number;
    avgPlayers: number;
  }>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000,
  });

  const form = useForm<InsertNewsletterSubscription>({
    resolver: zodResolver(insertNewsletterSubscriptionSchema),
    defaultValues: {
      email: "",
      name: "",
    },
  });

  const newsletterMutation = useMutation({
    mutationFn: async (data: InsertNewsletterSubscription) => {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Subscription failed");
      return response.json();
    },
    onSuccess: () => {
      setNewsletterSubmitted(true);
      toast({
        title: "Welcome aboard!",
        description: "You're subscribed to GameHub AI insights.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Subscription failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertNewsletterSubscription) => {
    newsletterMutation.mutate(data);
  };

  const upcomingGames = [
    {
      name: "Rust",
      status: "coming-soon" as const,
      colorScheme: "border-orange-500/30 hover:border-orange-500/60 bg-gradient-to-br from-orange-950/20 to-slate-900/20",
      icon: <Gamepad2 className="w-6 h-6 text-orange-400" />
    },
    {
      name: "Valheim",
      status: "coming-soon" as const,
      colorScheme: "border-blue-500/30 hover:border-blue-500/60 bg-gradient-to-br from-blue-950/20 to-slate-900/20",
      icon: <Gamepad2 className="w-6 h-6 text-blue-400" />
    },
    {
      name: "Minecraft",
      status: "coming-soon" as const,
      colorScheme: "border-emerald-500/30 hover:border-emerald-500/60 bg-gradient-to-br from-emerald-950/20 to-slate-900/20",
      icon: <Gamepad2 className="w-6 h-6 text-emerald-400" />
    },
    {
      name: "Arma 3",
      status: "coming-soon" as const,
      colorScheme: "border-yellow-500/30 hover:border-yellow-500/60 bg-gradient-to-br from-yellow-950/20 to-slate-900/20",
      icon: <Gamepad2 className="w-6 h-6 text-yellow-400" />
    },
    {
      name: "Counter Strike 2",
      status: "coming-soon" as const,
      colorScheme: "border-purple-500/30 hover:border-purple-500/60 bg-gradient-to-br from-purple-950/20 to-slate-900/20",
      icon: <Gamepad2 className="w-6 h-6 text-purple-400" />
    },
    {
      name: "7 Days to Die",
      status: "coming-soon" as const,
      colorScheme: "border-red-500/30 hover:border-red-500/60 bg-gradient-to-br from-red-950/20 to-slate-900/20",
      icon: <Gamepad2 className="w-6 h-6 text-red-400" />
    },
    {
      name: "Project Zomboid",
      status: "coming-soon" as const,
      colorScheme: "border-pink-500/30 hover:border-pink-500/60 bg-gradient-to-br from-pink-950/20 to-slate-900/20",
      icon: <Gamepad2 className="w-6 h-6 text-pink-400" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Hero Section with AI Branding */}
      <div className="relative border-b border-slate-800/50 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="container relative mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto">
            {/* Main headline */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="relative">
                  <Brain className="w-14 h-14 text-primary animate-pulse" />
                  <div className="absolute inset-0 blur-2xl bg-primary/50 animate-pulse" />
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
                  GameHub<span className="text-primary"> AI</span>
                </h1>
              </div>
              <p className="text-2xl md:text-3xl text-slate-300 mb-4 font-bold">
                Neural-Powered Server Discovery
              </p>
              <p className="text-lg text-slate-400 max-w-3xl mx-auto">
                Next-generation multi-game launcher with AI-driven recommendations, predictive queue intelligence, and instant mod synchronization
              </p>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-xl font-bold">100K+</span>
                <span className="text-sm">Players</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Server className="w-5 h-5 text-primary" />
                <span className="text-xl font-bold">{stats?.serversOnline?.toLocaleString() || '0'}</span>
                <span className="text-sm">Servers</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm">Verified</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-sm">One-Click Join</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dayz">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-14 text-lg font-bold group" data-testid="button-launch-beta">
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Launch DayZ Beta
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/downloads">
                <Button variant="outline" size="lg" className="border-primary/50 text-primary hover:bg-primary/10 px-8 h-14 text-lg" data-testid="button-download-app">
                  <Rocket className="w-5 h-5 mr-2" />
                  Download Desktop App
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured DayZ Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-green-500/10 via-slate-900/50 to-primary/10 border-2 border-green-500/30 rounded-2xl p-8 md:p-12 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-green-500 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
            </div>

            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-4">
                  LIVE BETA
                </Badge>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                  DayZ is Live
                </h2>
                <p className="text-xl text-slate-300 mb-6">
                  Join thousands of players with AI-powered server matching, automatic mod downloads, and instant server joining
                </p>
                
                {/* Live stats */}
                <div className="flex gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">
                      {statsLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : stats?.serversOnline?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-slate-400">Servers Online</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">
                      {statsLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : stats?.totalPlayers?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-slate-400">Players Active</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/launcher">
                    <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto" data-testid="button-browse-servers">
                      <Server className="w-4 h-4 mr-2" />
                      Browse Servers
                    </Button>
                  </Link>
                  <Link href="/dayz">
                    <Button variant="outline" size="lg" className="border-green-500/50 text-green-400 hover:bg-green-500/10 w-full sm:w-auto" data-testid="button-learn-more">
                      Learn More
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Brain className="w-5 h-5 text-primary" />
                    <h3 className="text-white font-semibold">Neural Server Discovery</h3>
                  </div>
                  <p className="text-sm text-slate-400">AI analyzes your playstyle to recommend perfect servers</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-5 h-5 text-green-400" />
                    <h3 className="text-white font-semibold">Predictive Queue Intelligence</h3>
                  </div>
                  <p className="text-sm text-slate-400">Smart queue predictions and automatic mod management</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-white font-semibold">Instant Join Technology</h3>
                  </div>
                  <p className="text-sm text-slate-400">One-click joining with automatic mod synchronization</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why AI Matters Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Why <span className="text-primary">AI</span> Changes Everything
          </h2>
          <p className="text-lg text-slate-400">
            Traditional server browsers show you a list. GameHub AI understands you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
              <Cpu className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Data Ingestion</h3>
            <p className="text-slate-400">
              Real-time server metrics, player behavior, mod compatibility data processed every second
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
              <Network className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">ML Enrichment</h3>
            <p className="text-slate-400">
              Neural networks analyze patterns to predict server quality, uptime, and player experience
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center border border-yellow-500/30">
              <TrendingUp className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Smart Recommendations</h3>
            <p className="text-slate-400">
              Personalized server suggestions based on your preferences, playstyle, and community fit
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Games Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">More Games Coming Soon</h2>
          <p className="text-slate-400">Expanding to 7 additional games in 2025</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {upcomingGames.map((game) => (
            <GameCard key={game.name} {...game} />
          ))}
        </div>
      </div>

      {/* Command Center Footer */}
      <div className="border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
            {/* Newsletter */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                <Mail className="w-6 h-6 text-primary" />
                AI Server Insights
              </h3>
              <p className="text-slate-400 mb-4">
                Get weekly AI-powered server analytics, new game announcements, and exclusive beta access
              </p>
              
              {newsletterSubmitted ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-400 text-center">
                  ✓ You're subscribed! Check your email for confirmation.
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              placeholder="your@email.com" 
                              {...field} 
                              className="bg-slate-900 border-slate-700"
                              data-testid="input-newsletter-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      disabled={newsletterMutation.isPending}
                      className="w-full bg-primary hover:bg-primary/90"
                      data-testid="button-subscribe-newsletter"
                    >
                      {newsletterMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      {newsletterMutation.isPending ? "Subscribing..." : "Subscribe to AI Insights"}
                    </Button>
                  </form>
                </Form>
              )}
            </div>

            {/* Contact & Links */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">Command Center</h3>
              <div className="space-y-3 text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <a href="mailto:support@gamehublauncher.com" className="hover:text-primary transition-colors" data-testid="link-contact-email">
                    support@gamehublauncher.com
                  </a>
                </div>
                <div className="flex gap-4 pt-2">
                  <Button variant="outline" size="sm" className="border-slate-700 hover:border-primary" data-testid="button-discord">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Discord
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-700 hover:border-primary" data-testid="button-docs">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Documentation
                  </Button>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-sm">
                    <strong className="text-white">Nexus AI Systems</strong><br/>
                    Building the future of gaming infrastructure with artificial intelligence
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12 pt-8 border-t border-slate-800">
            <p className="text-slate-500 text-sm">
              © 2025 Nexus AI Systems. GameHub Launcher - Neural-Powered Multi-Game Server Browser Platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
