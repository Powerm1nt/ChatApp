import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSocketStore } from '../../stores/socketStore';
import { CreateGuildDialog } from '../CreateGuildDialog';

export function GuildSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { guilds, fetchGuilds } = useSocketStore();

  useEffect(() => {
    fetchGuilds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isGuildActive = (guildId: string) => {
    const getShortId = (id: string) => {
      return id.split('-')[0];
    };
    const shortGuildId = getShortId(guildId);
    return location.pathname.includes(`/guild/${shortGuildId}`);
  };

  const getGuildInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleGuildClick = (guildId: string) => {
    // Get the first part of UUID (before first dash)
    const getShortId = (id: string) => {
      return id.split('-')[0];
    };
    
    // Navigate to the guild without a specific channel - let the guild view handle channel selection
    const shortGuildId = getShortId(guildId);
    navigate(`/guild/${shortGuildId}`);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col w-16 bg-gray-900 min-h-screen py-3 space-y-2">
        {/* App Logo / Home Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isActive('/me') ? 'secondary' : 'ghost'}
              size="icon"
              className={`w-12 h-12 mx-2 rounded-xl transition-all duration-200 ${
                isActive('/me')
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white hover:rounded-lg'
              }`}
              onClick={() => navigate('/me')}
            >
              <Home className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Home</p>
          </TooltipContent>
        </Tooltip>

        {/* Separator */}
        <div className="w-8 h-0.5 bg-gray-600 mx-auto rounded-full" />

        {/* Guild List */}
        <div className="flex flex-col space-y-2">
          {guilds.map((guild) => (
            <Tooltip key={guild.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`w-12 h-12 mx-2 rounded-xl transition-all duration-200 ${
                    isGuildActive(guild.id)
                      ? 'bg-primary text-primary-foreground rounded-lg'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white hover:rounded-lg'
                  }`}
                  onClick={() => handleGuildClick(guild.id)}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs font-semibold bg-transparent">
                      {getGuildInitials(guild.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{guild.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Add Guild Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <CreateGuildDialog>
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 mx-2 rounded-xl border-2 border-dashed border-gray-600 hover:border-gray-500 bg-transparent hover:bg-gray-700 text-gray-400 hover:text-green-400 transition-all duration-200"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </CreateGuildDialog>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Add a Server</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}