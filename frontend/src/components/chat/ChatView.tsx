import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MessagePanel from './MessagePanel';
import UserListPanel from './UserListPanel';
import { ChannelList } from './ChannelList';
import { useSocketStore } from '../../stores/socketStore';

interface ChatViewProps {
  showUserList?: boolean;
  showMessagePanel?: boolean;
  showChannelList?: boolean;
}

export default function ChatView({ 
  showUserList = true, 
  showMessagePanel = true,
  showChannelList = false
}: ChatViewProps) {
  const params = useParams();
  const navigate = useNavigate();
  const { guild_id, channel_id, user_id, group_id } = params;
  const { guilds, channels, fetchChannels } = useSocketStore();

  // Get the full UUID from the short ID
  const getFullId = (shortId: string, type: 'guild' | 'channel') => {
    if (type === 'guild') {
      const guild = guilds.find(g => g.id.startsWith(shortId));
      return guild?.id || shortId;
    } else {
      const channel = channels.find(c => c.id.startsWith(shortId));
      return channel?.id || shortId;
    }
  };

  // Determine chat type and context
  const chatType = guild_id ? 'guild' : user_id ? 'direct' : group_id ? 'group' : 'unknown';
  const fullGuildId = guild_id ? getFullId(guild_id, 'guild') : '';
  const fullChannelId = channel_id ? getFullId(channel_id, 'channel') : '';
  const chatId = fullGuildId || user_id || group_id || '';

  // Auto-navigate to first channel if we're on a guild without a channel
  useEffect(() => {
    if (guild_id && !channel_id && showChannelList) {
      fetchChannels(fullGuildId).then(() => {
        const guildChannels = channels.filter(c => c.guildId === fullGuildId);
        if (guildChannels.length > 0) {
          const firstChannel = guildChannels[0];
          const shortChannelId = firstChannel.id.split('-')[0];
          navigate(`/guild/${guild_id}/${shortChannelId}`, { replace: true });
        }
      });
    }
  }, [guild_id, channel_id, fullGuildId, channels, fetchChannels, navigate, showChannelList]);

  return (
    <div className="flex h-screen bg-background">
      {/* Channel List Panel - Left */}
      {showChannelList && guild_id && (
        <div className="flex-shrink-0">
          <ChannelList guildId={fullGuildId} />
        </div>
      )}

      {/* Message Panel - Center */}
      {showMessagePanel && (
        <div className={`flex-1 flex flex-col ${showUserList ? 'border-r' : ''}`}>
          <MessagePanel 
            chatType={chatType}
            chatId={chatId}
            channelId={fullChannelId}
          />
        </div>
      )}

      {/* User List Panel - Right */}
      {showUserList && (
        <div className="w-64 flex-shrink-0">
          <UserListPanel 
            chatType={chatType}
            chatId={chatId}
            channelId={fullChannelId}
          />
        </div>
      )}
    </div>
  );
}