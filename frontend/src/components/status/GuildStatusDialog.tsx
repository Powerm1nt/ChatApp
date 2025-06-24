import { useState } from 'react';
import { Activity, Users, Hash, Calendar, Database, Signal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useSocketStore, GuildStatus } from '../../stores/socketStore';

interface GuildStatusDialogProps {
  guildId: string;
  guildName: string;
  children: React.ReactNode;
}

export function GuildStatusDialog({ guildId, guildName, children }: GuildStatusDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [guildStatus, setGuildStatus] = useState<GuildStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchGuildStatus } = useSocketStore();

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    
    if (open && !guildStatus) {
      setIsLoading(true);
      try {
        const status = await fetchGuildStatus(guildId);
        setGuildStatus(status);
      } catch (error) {
        console.error('Failed to fetch guild status:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'connected':
      case 'available':
      case 'active': return 'text-green-600';
      case 'empty':
      case 'inactive': return 'text-yellow-600';
      case 'disconnected':
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Guild Status
          </DialogTitle>
          <DialogDescription>
            Status and health information for {guildName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : guildStatus ? (
          <div className="space-y-4">
            {/* Status Overview */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Status</span>
              <Badge variant={getStatusColor(guildStatus.status)}>
                {guildStatus.status}
              </Badge>
            </div>

            {/* Statistics */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Statistics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>{guildStatus.stats.memberCount} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-green-500" />
                  <span>{guildStatus.stats.channelCount} channels</span>
                </div>
                <div className="flex items-center gap-2">
                  <Signal className="w-4 h-4 text-purple-500" />
                  <span>{guildStatus.stats.activeUsers} active</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{new Date(guildStatus.stats.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Health Status */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Health Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <span>Database</span>
                  </div>
                  <span className={getHealthColor(guildStatus.health.database)}>
                    {guildStatus.health.database}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    <span>Channels</span>
                  </div>
                  <span className={getHealthColor(guildStatus.health.channels)}>
                    {guildStatus.health.channels}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Members</span>
                  </div>
                  <span className={getHealthColor(guildStatus.health.members)}>
                    {guildStatus.health.members}
                  </span>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-gray-500 pt-2 border-t">
              Last updated: {new Date(guildStatus.timestamp).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Failed to load guild status
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}