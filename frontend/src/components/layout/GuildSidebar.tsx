import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Plus, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSocketStore } from "../../stores/socketStore";
import { CreateGuildDialog } from "../CreateGuildDialog";
import { ServiceStatusIndicator } from "../status/ServiceStatusIndicator";
import { GuildStatusDialog } from "../status/GuildStatusDialog";
import { parseShortUuid } from "../../utilities";

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
    return location.pathname.includes(`/guild/${guildId}`);
  };

  const getGuildInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleGuildClick = (guildId: string) => {
    // Navigate to the guild without a specific channel - let the guild view handle channel selection
    navigate(`/guild/${guildId}`);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col w-16 bg-gray-900 h-screen py-3 space-y-2 fixed left-0 top-0 z-10">
        {/* App Logo / Home Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isActive("/me") ? "secondary" : "ghost"}
              size="icon"
              className={`w-12 h-12 mx-2 rounded-xl transition-all duration-200 ${
                isActive("/me")
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white hover:rounded-lg"
              }`}
              onClick={() => navigate("/me")}
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
            <div key={guild.id} className="relative group">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`w-12 h-12 mx-2 rounded-xl transition-all duration-200 ${
                      isGuildActive(guild.id)
                        ? "bg-primary text-primary-foreground rounded-lg"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white hover:rounded-lg"
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
                  <div className="flex items-center gap-2">
                    <span>{guild.name}</span>
                    <GuildStatusDialog
                      guildId={guild.id}
                      guildName={guild.name}
                    >
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Activity className="h-3 w-3" />
                      </Button>
                    </GuildStatusDialog>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
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
