import { useState, useEffect } from 'react';
import { useDesktop } from '@/contexts/desktop-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  MoreVertical, 
  RefreshCw, 
  ExternalLink, 
  Trash2,
  Download,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SubscribedMod {
  workshopId: string;
  name: string;
  title: string;
  path: string;
  size: number;
  subscriptions: number;
  timeUpdated: number | null;
  workshopFileSize: number | null;
  previewUrl: string | null;
  status: string;
}

export default function Mods() {
  const { isDesktop, getSubscribedMods, unsubscribeFromMod, openModInWorkshop, deleteModFiles } = useDesktop();
  const { toast } = useToast();
  const [mods, setMods] = useState<SubscribedMod[]>([]);
  const [filteredMods, setFilteredMods] = useState<SubscribedMod[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'updated'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadMods = async () => {
    try {
      setIsRefreshing(true);
      const subscribedMods = await getSubscribedMods();
      setMods(subscribedMods);
      setFilteredMods(subscribedMods);
    } catch (error) {
      console.error('Failed to load mods:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mods. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isDesktop) {
      loadMods();
    } else {
      setIsLoading(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    let result = [...mods];

    if (searchQuery) {
      result = result.filter(mod =>
        mod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'updated':
          comparison = (a.timeUpdated || 0) - (b.timeUpdated || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredMods(result);
  }, [searchQuery, mods, sortBy, sortOrder]);

  const handleSort = (column: 'name' | 'size' | 'updated') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleUnsubscribe = async (workshopId: string, modName: string) => {
    try {
      const result = await unsubscribeFromMod(workshopId);
      if (result.success) {
        toast({
          title: 'Unsubscribed',
          description: `Unsubscribed from ${modName}`,
        });
        await loadMods();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to unsubscribe',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unsubscribe. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFiles = async (workshopId: string, modName: string) => {
    try {
      const result = await deleteModFiles(workshopId);
      if (result.success) {
        toast({
          title: 'Deleted',
          description: `Deleted files for ${modName}`,
        });
        await loadMods();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete files',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete files. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenInWorkshop = async (workshopId: string) => {
    await openModInWorkshop(workshopId);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Unknown';
    try {
      return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (!isDesktop) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Card className="p-8 text-center">
          <Download className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Desktop App Required</h2>
          <p className="text-muted-foreground mb-4">
            The Mods management feature is only available in the desktop app.
          </p>
          <Button onClick={() => window.location.hash = '#/downloads'} data-testid="button-download-desktop">
            Download Desktop App
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="mods-title">Mods</h1>
          <p className="text-muted-foreground">
            Manage your subscribed DayZ Workshop mods
          </p>
        </div>
        <Button
          onClick={loadMods}
          disabled={isRefreshing}
          size="sm"
          variant="outline"
          data-testid="button-refresh-mods"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search mods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-mods"
            />
          </div>
          <div className="text-sm text-muted-foreground" data-testid="text-mod-count">
            {filteredMods.length} {filteredMods.length === 1 ? 'mod' : 'mods'}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading mods...</span>
          </div>
        ) : filteredMods.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? 'No mods match your search' : 'No mods installed'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('name')}
                    data-testid="header-name"
                  >
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead data-testid="header-status">Status</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('size')}
                    data-testid="header-size"
                  >
                    Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('updated')}
                    data-testid="header-updated"
                  >
                    Updated {sortBy === 'updated' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="text-right" data-testid="header-actions">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMods.map((mod) => (
                  <TableRow key={mod.workshopId} data-testid={`row-mod-${mod.workshopId}`}>
                    <TableCell className="font-medium" data-testid={`text-mod-name-${mod.workshopId}`}>
                      {mod.title}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400" data-testid={`status-${mod.workshopId}`}>
                        {mod.status}
                      </span>
                    </TableCell>
                    <TableCell data-testid={`text-size-${mod.workshopId}`}>
                      {formatBytes(mod.size)}
                    </TableCell>
                    <TableCell data-testid={`text-updated-${mod.workshopId}`}>
                      {formatDate(mod.timeUpdated)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`button-actions-${mod.workshopId}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleOpenInWorkshop(mod.workshopId)}
                            data-testid={`action-open-workshop-${mod.workshopId}`}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open in Workshop
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteFiles(mod.workshopId, mod.title)}
                            className="text-orange-600 dark:text-orange-400"
                            data-testid={`action-delete-files-${mod.workshopId}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Files
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUnsubscribe(mod.workshopId, mod.title)}
                            className="text-destructive"
                            data-testid={`action-unsubscribe-${mod.workshopId}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Unsubscribe
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <div className="mt-6 text-sm text-muted-foreground">
        <p>
          Tip: Click on column headers to sort. Use the search box to filter mods by name.
        </p>
      </div>
    </div>
  );
}
