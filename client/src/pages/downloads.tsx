import { useState, useEffect } from 'react';
import { Download, Monitor, Apple, Laptop, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type OS = 'windows' | 'mac' | 'linux' | 'unknown';

function detectOS(): OS {
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('win')) return 'windows';
  if (userAgent.includes('mac')) return 'mac';
  if (userAgent.includes('linux')) return 'linux';
  
  return 'unknown';
}

export default function Downloads() {
  const [detectedOS, setDetectedOS] = useState<OS>('unknown');

  useEffect(() => {
    setDetectedOS(detectOS());
  }, []);

  // GitHub repository - will be set when you deploy to GitHub
  // For now, this shows instructions to set it up
  const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || '';
  const LATEST_RELEASE_URL = GITHUB_REPO ? `https://github.com/${GITHUB_REPO}/releases/latest` : '';

  const downloads = {
    windows: {
      name: 'Windows',
      icon: Laptop,
      color: 'text-blue-500',
      url: `https://github.com/${GITHUB_REPO}/releases/latest/download/GameHub%20Launcher.exe`,
      fileSize: '~160MB',
      description: 'Portable executable for Windows 10/11',
    },
    mac: {
      name: 'macOS',
      icon: Apple,
      color: 'text-gray-400',
      url: `https://github.com/${GITHUB_REPO}/releases/latest/download/GameHub%20Launcher.dmg`,
      fileSize: '~165MB',
      description: 'DMG installer for macOS 10.15+',
    },
    linux: {
      name: 'Linux',
      icon: Monitor,
      color: 'text-yellow-500',
      url: `https://github.com/${GITHUB_REPO}/releases/latest/download/GameHub%20Launcher.AppImage`,
      fileSize: '~155MB',
      description: 'AppImage for Ubuntu/Debian/Fedora',
    },
  };

  const recommended = detectedOS !== 'unknown' ? downloads[detectedOS] : null;
  const Icon = recommended?.icon || Download;

  // Show setup instructions if GitHub repo is not configured
  if (!GITHUB_REPO) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Download GameHub Launcher</h1>
            <p className="text-xl text-muted-foreground">
              Desktop app with automatic mod management
            </p>
          </div>
          
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-6 h-6" />
                Setup Required
              </CardTitle>
              <CardDescription>
                To enable downloads, push your code to GitHub and configure your repository
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Quick Setup (3 steps):</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Push this project to GitHub</li>
                  <li>Set the <code className="bg-muted px-1 py-0.5 rounded">VITE_GITHUB_REPO</code> environment variable to <code className="bg-muted px-1 py-0.5 rounded">username/repository</code></li>
                  <li>Create a release on GitHub to trigger automatic builds</li>
                </ol>
              </div>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-semibold mb-2">Example:</p>
                <code className="text-sm">VITE_GITHUB_REPO=yourusername/gamehub-launcher</code>
              </div>
              
              <div className="mt-6">
                <p className="text-sm text-muted-foreground">
                  See <code className="bg-muted px-1 py-0.5 rounded">GITHUB_RELEASE_GUIDE.md</code> for complete setup instructions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="downloads-title">
            Download GameHub Launcher
          </h1>
          <p className="text-xl text-muted-foreground" data-testid="downloads-subtitle">
            Get the desktop app for automatic mod management and one-click server joining
          </p>
        </div>

        {/* Recommended Download */}
        {recommended && (
          <Card className="mb-8 border-primary" data-testid="recommended-download-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Icon className={`w-8 h-8 ${recommended.color}`} />
                <div>
                  <CardTitle>Recommended for You</CardTitle>
                  <CardDescription>
                    We detected you're using {recommended.name}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {recommended.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Size: {recommended.fileSize}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => window.open(recommended.url, '_blank')}
                  data-testid={`download-${detectedOS}`}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download for {recommended.name}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Platforms */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6" data-testid="all-platforms-title">
            All Platforms
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(downloads).map(([key, platform]) => {
              const PlatformIcon = platform.icon;
              return (
                <Card key={key} data-testid={`download-card-${key}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <PlatformIcon className={`w-6 h-6 ${platform.color}`} />
                      <CardTitle>{platform.name}</CardTitle>
                    </div>
                    <CardDescription>{platform.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Size: {platform.fileSize}
                    </p>
                    <Button
                      className="w-full"
                      variant={key === detectedOS ? 'default' : 'outline'}
                      onClick={() => window.open(platform.url, '_blank')}
                      data-testid={`button-download-${key}`}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Desktop App Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Native Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Faster load times, better performance, and offline access to your favorite servers
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Automatic Mod Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Detects installed mods, downloads missing ones via Steam, and launches DayZ automatically
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Installation Instructions */}
        <Card data-testid="installation-instructions">
          <CardHeader>
            <CardTitle>Installation Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Windows:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Download the .exe file</li>
                <li>Double-click to run (no installation required)</li>
                <li>Set your Steam path in Settings</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">macOS:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Download the .dmg file</li>
                <li>Open the DMG and drag to Applications</li>
                <li>Set your Steam path in Settings</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Linux:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Download the .AppImage file</li>
                <li>Make it executable: chmod +x GameHub-Launcher.AppImage</li>
                <li>Double-click to run</li>
                <li>Set your Steam path in Settings</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Windows Defender SmartScreen Warning */}
        <Card className="mt-8 border-amber-500/30 bg-amber-500/5" data-testid="windows-defender-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5" />
              Windows SmartScreen Warning
            </CardTitle>
            <CardDescription>
              You may see a "Windows protected your PC" message when running the app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-3">Why does this happen?</p>
              <p className="text-sm text-muted-foreground">
                GameHub Launcher is a new application and doesn't have a paid code-signing certificate yet ($300-500/year). 
                Windows shows this warning for unsigned apps as a precaution - it doesn't mean the app is unsafe.
              </p>
            </div>
            
            <div>
              <p className="text-sm font-semibold mb-2">How to run the app safely:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>When you see "Windows protected your PC", click <strong className="text-foreground">"More info"</strong></li>
                <li>Then click <strong className="text-foreground">"Run anyway"</strong> button</li>
                <li>The app will launch normally</li>
                <li>You only need to do this once - Windows will remember your choice</li>
              </ol>
            </div>

            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-400">
                <strong>✓ GameHub Launcher is safe:</strong> The app is open-source, runs locally on your machine, and only connects to Steam Workshop and game servers.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* View All Releases */}
        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => window.open(LATEST_RELEASE_URL, '_blank')}
            data-testid="button-view-releases"
          >
            View All Releases on GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}
