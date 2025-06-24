import React, { useState, useEffect } from 'react';
import { Users, Crown, Shield, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSocketStore } from '@/stores/socketStore';

interface UserListPanelProps {
  chatType: 'guild' | 'direct' | 'group' | 'unknown';
  chatId: string;
  channelId?: string;
}

interface ChatUser {
  id: string;
  username: string;
  status: 'online' | 'away' | 'offline';
  role?: 'owner' | 'admin' | 'member';
  room?: string;
  guildId?: string;
  joinedAt?: Date;
}

export default function UserListPanel({ chatType, chatId, channelId }: UserListPanelProps) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const { socket, isConnected } = useSocketStore();

  // Get panel title based on chat type
  const getPanelTitle = () => {
    switch (chatType) {
      case 'guild':
        return 'Members';
      case 'direct':
        return 'Participants';
      case 'group':
        return 'Group Members';
      default:
        return 'Users';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  // Get role icon
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-3 w-3 text-blue-500" />;
      default:
        return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleRoomUsers = (roomUsers: ChatUser[]) => {
      setUsers(roomUsers);
    };

    const handleUserJoined = (user: ChatUser) => {
      setUsers(prev => {
        const exists = prev.find(u => u.id === user.id);
        if (exists) return prev;
        return [...prev, user];
      });
    };

    const handleUserLeft = (userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
    };

    const handleUserStatusUpdate = (data: { userId: string; status: string }) => {
      setUsers(prev => prev.map(user => 
        user.id === data.userId 
          ? { ...user, status: data.status as 'online' | 'away' | 'offline' }
          : user
      ));
    };

    socket.on('room-users', handleRoomUsers);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('user-status-update', handleUserStatusUpdate);      // Request users for the current room
      const roomId = chatType === 'guild' ? channelId : chatId;
      socket.emit('get-room-users', { roomId, chatType });

    return () => {
      socket.off('room-users', handleRoomUsers);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('user-status-update', handleUserStatusUpdate);
    };
  }, [socket, isConnected, chatId, channelId, chatType]);

  // Group users by status for better organization
  const onlineUsers = users.filter(user => user.status === 'online');
  const awayUsers = users.filter(user => user.status === 'away');
  const offlineUsers = users.filter(user => user.status === 'offline');

  const UserGroup = ({ title, users, count }: { title: string; users: ChatUser[]; count: number }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      </div>
      <div className="space-y-1">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
          >
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium truncate">{user.username}</span>
                {chatType === 'guild' && user.role && (
                  <div className="flex-shrink-0">
                    {getRoleIcon(user.role)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full bg-card border-l flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <h2 className="font-semibold text-sm">{getPanelTitle()}</h2>
          <Badge variant="outline" className="text-xs">
            {users.length}
          </Badge>
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-4">
        {users.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground text-sm">No users online</p>
          </div>
        ) : (
          <>
            {onlineUsers.length > 0 && (
              <UserGroup title="Online" users={onlineUsers} count={onlineUsers.length} />
            )}
            {awayUsers.length > 0 && (
              <UserGroup title="Away" users={awayUsers} count={awayUsers.length} />
            )}
            {offlineUsers.length > 0 && (
              <UserGroup title="Offline" users={offlineUsers} count={offlineUsers.length} />
            )}
          </>
        )}
      </div>

      {/* Footer Info */}
      {chatType === 'direct' && (
        <div className="border-t px-4 py-2">
          <p className="text-xs text-muted-foreground">
            Direct message conversation
          </p>
        </div>
      )}
      {chatType === 'group' && (
        <div className="border-t px-4 py-2">
          <p className="text-xs text-muted-foreground">
            Private group chat
          </p>
        </div>
      )}
    </div>
  );
}