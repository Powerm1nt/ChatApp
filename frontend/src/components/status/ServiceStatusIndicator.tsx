import { useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useSocketStore } from '../../stores/socketStore';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ServiceStatusIndicator() {
  const { serviceStatus, fetchServiceStatus } = useSocketStore();

  useEffect(() => {
    // Fetch initial status
    fetchServiceStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!serviceStatus) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Loading...
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Loading service status...</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const isHealthy = serviceStatus.status === 'ok';
  const uptimeHours = Math.floor(serviceStatus.uptime / 3600);
  const uptimeMinutes = Math.floor((serviceStatus.uptime % 3600) / 60);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isHealthy ? "default" : "destructive"} 
            className="flex items-center gap-1 cursor-pointer"
          >
            {isHealthy ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            <Activity className="w-3 h-3" />
            {isHealthy ? 'Online' : 'Issues'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold">Service Status</div>
            <div className="text-sm">
              <div>Status: {serviceStatus.status}</div>
              <div>Uptime: {uptimeHours}h {uptimeMinutes}m</div>
              <div>Last check: {new Date(serviceStatus.timestamp).toLocaleTimeString()}</div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Services:</div>
              <div>• Database: {serviceStatus.services?.database || 'unknown'}</div>
              <div>• WebSocket: {serviceStatus.services?.websocket || 'unknown'}</div>
              <div>• API: {serviceStatus.services?.api || 'unknown'}</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}