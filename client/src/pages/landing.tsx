import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Users, TrendingUp, Shield, Zap, Star, Video, DollarSign, BarChart3, Rocket, CheckCircle2, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PrivacyPolicyDialog } from "@/components/privacy-policy-dialog";
import { TermsOfServiceDialog } from "@/components/terms-of-service-dialog";

interface PlatformStats {
  serversOnline: string;
  totalPlayers: string;
  avgPing: string;
  topMap: string;
  activeSearches: number;
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: stats } = useQuery<PlatformStats>({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Update every 30s
  });

  const handleSignUp = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute inset-0 opacity-30">
          {mounted && Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary/20 rounded-full"
              initial={{ 
                x: Math.random() * window.innerWidth, 
                y: Math.random() * window.innerHeight,
                scale: 0 
              }}
              animate={{
                x: [null, Math.random() * window.innerWidth],
                y: [null, Math.random() * window.innerHeight],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* Logo/Brand */}
            <div className="mb-6">
              <h1 className="text-6xl md:text-7xl font-bold font-display bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-2">
                GameHub Launcher
              </h1>
              <p className="text-lg text-muted-foreground">Powered by Nexus AI Systems</p>
            </div>

            {/* Tagline */}
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The Next-Generation Game Server Platform
            </h2>

            {/* Beta Badge */}
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-6 neon-border">
              <Rocket className="w-5 h-5 text-primary" />
              <span className="font-bold font-display">DayZ Launcher • Beta Testing Phase</span>
            </div>

            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Join 100,000 players discovering the best servers with AI-powered recommendations, 
              real-time stats, and one-click joining
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  className="text-xl px-12 py-6 neon-glow bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 font-bold font-display"
                  onClick={handleSignUp}
                  data-testid="button-join-beta"
                >
                  🚀 Join the Beta - It's Free
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-xl px-12 py-6 border-primary/50 hover:bg-primary/10 font-bold font-display"
                  onClick={() => setLocation('/downloads')}
                  data-testid="button-download-app"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Desktop App
                </Button>
              </motion.div>
            </div>

            {/* Live Stats */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 flex flex-wrap justify-center gap-4"
              >
                <div className="text-sm text-primary-glow font-bold" data-testid="text-servers-online">
                  ✨ {stats.serversOnline} servers online
                </div>
                <div className="text-sm text-accent-glow font-bold" data-testid="text-players-online">
                  👥 {stats.totalPlayers} players online
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Trust Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="border-t border-b border-primary/20 py-6 mb-16"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>Verified by BattleMetrics</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span>Real-time Data</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Ready for 100K+ Players</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Platform Stats Dashboard */}
      <div className="container mx-auto px-4 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-2xl font-bold text-center mb-8 font-display">Platform Stats (Live)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="glass-card neon-border">
              <CardContent className="p-6 text-center">
                <Gamepad2 className="w-12 h-12 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold font-display text-primary-glow mb-1" data-testid="text-stat-servers">
                  {stats?.serversOnline || '0'}
                </div>
                <div className="text-sm text-muted-foreground">Servers Online</div>
                <div className="text-xs text-primary mt-1">+12 today</div>
              </CardContent>
            </Card>

            <Card className="glass-card neon-border">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-accent mx-auto mb-3" />
                <div className="text-3xl font-bold font-display text-accent-glow mb-1" data-testid="text-stat-players">
                  {stats?.totalPlayers || '0'}
                </div>
                <div className="text-sm text-muted-foreground">Players Online</div>
                <div className="text-xs text-accent mt-1">Peak: 28K</div>
              </CardContent>
            </Card>

            <Card className="glass-card neon-border">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold font-display text-primary-glow mb-1">156</div>
                <div className="text-sm text-muted-foreground">Active Searches</div>
                <div className="text-xs text-primary mt-1">Right now</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>

      {/* Value Props - Three Audiences */}
      <div className="container mx-auto px-4 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Tabs defaultValue="players" className="max-w-5xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8 glass-card p-1">
              <TabsTrigger value="players" className="font-bold font-display" data-testid="tab-players">
                👥 For Players
              </TabsTrigger>
              <TabsTrigger value="streamers" className="font-bold font-display" data-testid="tab-streamers">
                🎥 For Streamers
              </TabsTrigger>
              <TabsTrigger value="owners" className="font-bold font-display" data-testid="tab-owners">
                🖥️ For Server Owners
              </TabsTrigger>
            </TabsList>

            <TabsContent value="players" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glass-card neon-border">
                  <CardContent className="p-6">
                    <Star className="w-10 h-10 text-primary mb-4" />
                    <h4 className="text-xl font-bold mb-2 font-display">Find Your Perfect Server</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• AI-powered recommendations</li>
                      <li>• Quality scoring (S/A/B/C/D/F grades)</li>
                      <li>• One-click join + auto mod setup</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="glass-card neon-border">
                  <CardContent className="p-6">
                    <Shield className="w-10 h-10 text-primary mb-4" />
                    <h4 className="text-xl font-bold mb-2 font-display">Never Play on Dead Servers</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Real-time player counts</li>
                      <li>• Uptime & reliability scores</li>
                      <li>• Fraud detection alerts</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="glass-card neon-border md:col-span-2">
                  <CardContent className="p-6">
                    <Zap className="w-10 h-10 text-primary mb-4" />
                    <h4 className="text-xl font-bold mb-2 font-display">Lightning-Fast Browsing</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• 2,937 servers in 0.3 seconds</li>
                      <li>• Advanced filters (map/mods/ping/quality)</li>
                      <li>• Save favorites & get alerts</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="streamers" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glass-card neon-border">
                  <CardContent className="p-6">
                    <DollarSign className="w-10 h-10 text-primary mb-4" />
                    <h4 className="text-xl font-bold mb-2 font-display">Get Paid to Play</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Partner with server owners</li>
                      <li>• Featured streamer placement</li>
                      <li>• Revenue share opportunities</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="glass-card neon-border">
                  <CardContent className="p-6">
                    <Shield className="w-10 h-10 text-primary mb-4" />
                    <h4 className="text-xl font-bold mb-2 font-display">Stream Snipe Protection</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Private server visibility options</li>
                      <li>• Delayed location sharing</li>
                      <li>• Subscriber-only server info</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="glass-card neon-border md:col-span-2">
                  <CardContent className="p-6">
                    <Video className="w-10 h-10 text-primary mb-4" />
                    <h4 className="text-xl font-bold mb-2 font-display">Grow Your Audience</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Exposure to 100K+ platform users</li>
                      <li>• "Live Now" sidebar feature</li>
                      <li>• Cross-promotion opportunities</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="owners" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glass-card neon-border">
                  <CardContent className="p-6">
                    <BarChart3 className="w-10 h-10 text-primary mb-4" />
                    <h4 className="text-xl font-bold mb-2 font-display">Premium Analytics Dashboard</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Player retention metrics</li>
                      <li>• Peak hour analysis</li>
                      <li>• Competitor benchmarking</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="glass-card neon-border">
                  <CardContent className="p-6">
                    <TrendingUp className="w-10 h-10 text-primary mb-4" />
                    <h4 className="text-xl font-bold mb-2 font-display">Boost Your Server</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Featured placement ($15-30/mo)</li>
                      <li>• Sponsored sidebar slots</li>
                      <li>• Top search results</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="glass-card neon-border md:col-span-2">
                  <CardContent className="p-6">
                    <Users className="w-10 h-10 text-primary mb-4" />
                    <h4 className="text-xl font-bold mb-2 font-display">Partner with Streamers</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Verified server badges</li>
                      <li>• Direct streamer partnerships</li>
                      <li>• Event promotion tools</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Beta Positioning */}
      <div className="container mx-auto px-4 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="glass-card neon-border">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4 font-display flex items-center gap-2">
                <Rocket className="w-6 h-6 text-primary" />
                Why Beta?
              </h3>
              <p className="text-muted-foreground mb-4">
                GameHub Launcher's DayZ integration is feature-complete and ready for 100,000 players. 
                We're in beta to gather feedback and ensure the best possible experience as we expand 
                to Rust, Arma 3, and beyond.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-bold">Full DayZ Integration</div>
                    <div className="text-sm text-muted-foreground">2,937 servers with real-time data</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-bold">AI-Powered Features</div>
                    <div className="text-sm text-muted-foreground">Smart search & recommendations</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Rocket className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <div className="font-bold">Multi-Game Support</div>
                    <div className="text-sm text-muted-foreground">Rust, Arma 3 coming soon</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Rocket className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <div className="font-bold">Streamer Partnerships</div>
                    <div className="text-sm text-muted-foreground">Rolling out now</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center glass-card neon-border p-12 max-w-3xl mx-auto"
        >
          <h3 className="text-3xl font-bold mb-4 font-display">
            Ready to Find Your Perfect DayZ Server?
          </h3>
          <p className="text-muted-foreground mb-6">
            Join 12,482 players in the GameHub Launcher Beta
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              className="text-xl px-12 py-6 neon-glow bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 font-bold font-display"
              onClick={handleSignUp}
              data-testid="button-join-beta-footer"
            >
              🚀 Sign Up Free - 30 Seconds
            </Button>
          </motion.div>
          <p className="text-xs text-muted-foreground mt-4">
            No credit card required • Google, Apple, or Email
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-primary/20 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="text-center md:text-left">
              <div className="font-bold text-foreground mb-1">GameHub Launcher™</div>
              <div>Powered by Nexus AI Systems</div>
              <div className="mt-1">
                <a href="mailto:hello@gamehublauncher.com" className="text-primary hover:underline">
                  hello@gamehublauncher.com
                </a>
              </div>
            </div>
            <div className="flex gap-6">
              <PrivacyPolicyDialog>
                <button className="hover:text-primary transition-colors" data-testid="link-privacy-policy">
                  Privacy Policy
                </button>
              </PrivacyPolicyDialog>
              <TermsOfServiceDialog>
                <button className="hover:text-primary transition-colors" data-testid="link-terms-of-service">
                  Terms of Service
                </button>
              </TermsOfServiceDialog>
              <a href="https://nexusaisystems.pro" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                About Nexus AI
              </a>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground mt-4">
            © 2025 Nexus AI Systems. All rights reserved. • gamehublauncher.com
          </div>
        </div>
      </footer>
    </div>
  );
}
