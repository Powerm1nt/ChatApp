import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSocketStore } from '../../stores/socketStore';

interface ChannelListProps {
  guildId: string;
}

export function ChannelList({ guildId }: ChannelListProps) {
  const navigate = useNavigate();
  const params = useParams();
  const { channels, fetchChannels, guilds } = useSocketStore();
  
  // Get the first part of UUID (before first dash)
  const getShortId = (id: string) => {
    return id.split('-')[0];
  };

  useEffect(() => {
    if (guildId) {
      fetchChannels(guildId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const currentGuild = guilds.find(g => g.id === guildId);
  const guildChannels = channels.filter(c => c.guildId === guildId);

  const handleChannelClick = (channelId: string) => {
    const shortGuildId = getShortId(guildId);
    const shortChannelId = getShortId(channelId);
    navigate(`/guild/${shortGuildId}/${shortChannelId}`);
  };

  const isChannelActive = (channelId: string) => {
    const shortChannelId = getShortId(channelId);
    return params.channel_id === shortChannelId;
  };

  return (
    <div className="w-60 bg-gray-800 flex flex-col min-h-screen">
      {/* Guild Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-white font-semibold text-lg truncate">
          {currentGuild?.name || 'Loading...'}
        </h2>
      </div>

      {/* Channels Section */}
      <div className="flex-1 p-2">
        <div className="mb-4">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
              Text Channels
            </span>
          </div>
          
          <div className="space-y-1">
            {guildChannels.length > 0 ? (
              guildChannels.map((channel) => (
                <Button
                  key={channel.id}
                  variant="ghost"
                  className={`w-full justify-start px-2 py-1.5 h-auto text-left ${
                    isChannelActive(channel.id)
                      ? 'bg-gray-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={() => handleChannelClick(channel.id)}
                >
                  <Hash className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{channel.name}</span>
                </Button>
              ))
            ) : (
              <div className="text-gray-500 text-sm px-2 py-4 text-center">
                No channels available
              </div>
            )}
          </div>
        </div>

        {/* Voice Channels Section (placeholder) */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
              Voice Channels
            </span>
          </div>
          <div className="text-gray-500 text-sm px-2 py-2 text-center">
            No voice channels
          </div>
        </div>
      </div>
    </div>
  );
}