import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import {
  Hash,
  Plus,
  Trash2,
  MessageSquare,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { CreateChannelDialog } from "../CreateChannelDialog";
import { EditChannelDialog } from "../EditChannelDialog";
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

  const { guilds, fetchChannels, deleteChannel, isLoadingChannels } =
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
    return <ChannelPlaceholder />;
  }

  const guildChannels = currentGuild?.channels || [];

  const handleChannelClick = (channelId: string) => {
    navigate(`/guild/${guildId}/${channelId}`);
  };

  const isChannelActive = (channelId: string) => {
    return params.channel_id === channelId;
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (window.confirm("Are you sure you want to delete this channel?")) {
      await deleteChannel(guildId, channelId);
    }
  };

  return (
    <div className="w-60 bg-gray-800 flex flex-col h-screen">
      {/* Guild Header */}
      <div className="p-4 border-b border-gray-700 sticky top-0 z-10 bg-gray-800">
        <h2 className="text-white font-semibold text-lg truncate">
          {currentGuild?.name ?? "Loading..."}
        </h2>
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
                  <ContextMenu key={channel.id}>
                    <ContextMenuTrigger asChild>
                      <div
                        className={`group flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-700 cursor-pointer ${
                          isChannelActive(channel.id) ? "bg-gray-600" : ""
                        }`}
                      >
                        <Button
                          variant="none"
                          className={`flex-1 justify-start px-0 py-0 h-auto text-left ${
                            isChannelActive(channel.id)
                              ? "text-white"
                              : "text-gray-300 hover:text-white"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChannelClick(channel.id);
                          }}
                        >
                          <Hash className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{channel.name}</span>
                        </Button>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <CreateChannelDialog guildId={guildId}>
                        <ContextMenuItem
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Channel
                        </ContextMenuItem>
                      </CreateChannelDialog>
                      <EditChannelDialog guildId={guildId} channel={channel}>
                        <ContextMenuItem
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Channel
                        </ContextMenuItem>
                      </EditChannelDialog>
                      <ContextMenuItem
                        onClick={() => handleDeleteChannel(channel.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Channel
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
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
