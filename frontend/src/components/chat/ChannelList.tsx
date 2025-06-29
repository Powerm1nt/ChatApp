import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Hash,
  Plus,
  MessageSquare,
  ChevronDown,
  Activity,
  Settings,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateChannelDialog } from "../CreateChannelDialog";
import { ChannelSettings } from "../ChannelSettings";
import { GuildSettingsDialog } from "../GuildSettingsDialog";
import { DeleteGuildDialog } from "../DeleteGuildDialog";
import { GuildStatusDialog } from "../status/GuildStatusDialog";
import { useGuildStoreWithAutoFetch } from "../../stores/guildStore";

interface ChannelListProps {
  guildId: string;
}

function ChannelPlaceholder() {
  return (
    <div className="space-y-2">
      {[...Array(10)].map((_, index) => (
        <div key={index} className="flex items-center px-2 py-1.5">
          <Skeleton className="w-4 h-4 mr-2 bg-gray-600" />
          <Skeleton className="h-4 flex-1 bg-gray-600" />
        </div>
      ))}
    </div>
  );
}

export function ChannelList({ guildId }: Readonly<ChannelListProps>) {
  const navigate = useNavigate();
  const params = useParams();
  const [isGuildDropdownOpen, setIsGuildDropdownOpen] = useState(false);

  const { guilds, fetchChannels, isLoadingChannels } =
    useGuildStoreWithAutoFetch();

  const currentGuild = guilds.find((g) => g.id === guildId);

  // Fetch channels for this guild when component mounts or guildId changes
  useEffect(() => {
    if (guildId && currentGuild) {
      console.log(`Fetching channels for guild: ${guildId}`);
      fetchChannels(guildId).catch(console.error);
    }
  }, [guildId, currentGuild?.id]);

  if (!currentGuild) {
    return null;
  }

  const guildChannels = currentGuild?.channels || [];

  const handleChannelClick = (channelId: string) => {
    navigate(`/guild/${guildId}/${channelId}`);
  };

  const isChannelActive = (channelId: string) => {
    return params.channel_id === channelId;
  };

  return (
    <div className="w-60 bg-gray-800 flex flex-col h-full">
      {/* Guild Header */}
      <div className="p-4 border-b border-gray-700 sticky top-0 z-10 bg-gray-800">
        <DropdownMenu
          open={isGuildDropdownOpen}
          onOpenChange={setIsGuildDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-gray-700 rounded px-2 py-1 -mx-2 -my-1 transition-colors">
              <h2 className="text-white font-semibold text-lg truncate">
                {currentGuild?.name ?? "Loading..."}
              </h2>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isGuildDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {currentGuild && (
              <>
                <GuildSettingsDialog guild={currentGuild}>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Server Settings
                  </DropdownMenuItem>
                </GuildSettingsDialog>
                <GuildStatusDialog
                  guildId={currentGuild.id}
                  guildName={currentGuild.name}
                >
                  <DropdownMenuItem>
                    <Activity className="mr-2 h-4 w-4" />
                    Server Status
                  </DropdownMenuItem>
                </GuildStatusDialog>
                <DeleteGuildDialog guild={currentGuild}>
                  <DropdownMenuItem>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Server
                  </DropdownMenuItem>
                </DeleteGuildDialog>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Channels Section */}
      <div className="flex-1 p-2 overflow-y-auto">
        <div className="mb-4">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
              Channels
            </span>
            <CreateChannelDialog guildId={guildId}>
              <Button
                variant="none"
                size="icon"
                className="w-4 h-4 text-gray-400 hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </CreateChannelDialog>
          </div>

          <div className="space-y-1">
            {(() => {
              if (isLoadingChannels) {
                // Loading skeleton
                return <ChannelPlaceholder />;
              }
              if (guildChannels.length > 0) {
                return guildChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`flex items-center px-2 py-1.5 rounded hover:bg-gray-700 group ${
                      isChannelActive(channel.id) ? "bg-gray-600" : ""
                    }`}
                  >
                    <div
                      className="flex items-center flex-1 cursor-pointer"
                      onClick={() => handleChannelClick(channel.id)}
                    >
                      <Hash className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span
                        className={`truncate ${
                          isChannelActive(channel.id)
                            ? "text-white"
                            : "text-gray-300"
                        }`}
                      >
                        {channel.name}
                      </span>
                    </div>
                    <ChannelSettings guildId={guildId} channel={channel}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-4 h-4 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </ChannelSettings>
                  </div>
                ));
              }
              return (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-500 text-sm mb-2">No channels yet</p>
                  <p className="text-gray-600 text-xs mb-4">
                    Create your first channel to get started
                  </p>
                  <CreateChannelDialog guildId={guildId}>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Channel
                    </Button>
                  </CreateChannelDialog>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
