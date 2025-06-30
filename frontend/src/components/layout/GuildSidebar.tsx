import { useNavigate, useLocation } from "react-router-dom";
import { Home, Plus, Activity, Trash2, Settings, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useGuildStoreWithAutoFetch } from "../../stores/guildStore";
import { CreateGuildDialog } from "../CreateGuildDialog";
import { GuildStatusDialog } from "../status/GuildStatusDialog";
import { GuildSettingsDialog } from "../GuildSettingsDialog";
import { DeleteGuildDialog } from "../DeleteGuildDialog";
import { ProfileControl } from "../ProfileControl";
import { ScrollArea } from "@/components/ui/scroll-area";
import GuildInvitationDialog, { GuildInvitationDialogRef } from "../GuildInvitationDialog";
import { useRef, useState } from "react";

export function GuildSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { guilds } = useGuildStoreWithAutoFetch();
  const invitationDialogRef = useRef<GuildInvitationDialogRef>(null);
  const [selectedGuild, setSelectedGuild] = useState<{ id: string; name: string } | null>(null);

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
    navigate(`/guild/${guildId}`);
  };

  return (
    <TooltipProvider>
      <GuildInvitationDialog
        ref={invitationDialogRef}
        guildId={selectedGuild?.id || ""}
        guildName={selectedGuild?.name || ""}
      />
      <div className="flex flex-col w-16 bg-gray-900 h-screen fixed left-0 top-0 z-10">
        {/* Fixed Top Section */}
        <div className="flex flex-col py-3 space-y-2">
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
        </div>

        {/* Scrollable Guild List */}
        <ScrollArea className="flex-1 px-2 py-1">
          <div className="flex flex-col space-y-2">
            {guilds.map((guild) => (
              <div key={guild.id} className="relative group">
                <ContextMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ContextMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`w-12 h-12 rounded-xl transition-all duration-200 ${
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
                      </ContextMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{guild.name}</p>
                    </TooltipContent>
                  </Tooltip>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => {
                        setSelectedGuild({ id: guild.id, name: guild.name });
                        setTimeout(() => invitationDialogRef.current?.open(), 0);
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Friends
                    </ContextMenuItem>
                    <GuildSettingsDialog guild={guild}>
                      <ContextMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Server Settings
                      </ContextMenuItem>
                    </GuildSettingsDialog>
                    <GuildStatusDialog
                      guildId={guild.id}
                      guildName={guild.name}
                    >
                      <ContextMenuItem>
                        <Activity className="mr-2 h-4 w-4" />
                        Server Status
                      </ContextMenuItem>
                    </GuildStatusDialog>
                    <DeleteGuildDialog guild={guild}>
                      <ContextMenuItem>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Server
                      </ContextMenuItem>
                    </DeleteGuildDialog>
                  </ContextMenuContent>
                </ContextMenu>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Fixed Bottom Section */}
        <div className="mt-auto py-3 flex flex-col space-y-2">
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

          {/* Profile Control at Bottom */}
          <ProfileControl />
        </div>
      </div>
    </TooltipProvider>
  );
}
