import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';
import { useGuildStore } from '@/stores/guildStore';

interface MessagePanelProps {
  chatType: 'guild' | 'direct' | 'group' | 'unknown';
  chatId: string;
  channelId?: string;
}

interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
  };
  timestamp: Date;
}

export default function MessagePanel({ chatType, chatId, channelId }: MessagePanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { socket, isConnected, sendMessage } = useSocketStore();
  const { getChannelById } = useGuildStore();

  // Get chat title based on type
  const getChatTitle = () => {
    switch (chatType) {
      case 'guild':
        if (channelId) {
          const channel = getChannelById(channelId);
          return `# ${channel?.name || 'general'}`;
        }
        return '# general';
      case 'direct':
        return `Direct Message`;
      case 'group':
        return `Group Chat`;
      default:
        return 'Chat';
    }
  };

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear messages when channel/chat changes
  useEffect(() => {
    // Clear messages immediately when switching channels/chats
    setMessages([]);
    setIsTyping(false);
  }, [chatId, channelId, chatType]);

  // Socket event handlers and message restoration
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleRoomMessages = (roomMessages: Message[]) => {
      setMessages(roomMessages);
    };

    const handleUserTyping = (data: { userId: string; username: string }) => {
      if (data.userId !== user?.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('room-messages', handleRoomMessages);
    socket.on('user-typing', handleUserTyping);

    // Join the appropriate room and restore messages
    const roomId = chatType === 'guild' ? channelId : chatId;
    const guildId = chatType === 'guild' ? chatId : undefined;
    
    // Only proceed if we have a valid roomId
    if (!roomId) {
      console.warn('No roomId available for joining room');
      return;
    }
    
    // Join room via socket for real-time events
    socket.emit('join-room', { 
      username: user.username, 
      room: roomId, 
      guildId 
    });

    // Restore messages using the socketStore's fetchMessages function
    const restoreMessages = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const { token } = useAuthStore.getState();
        
        let url: string;
        if (chatType === 'guild' && guildId && channelId) {
          url = `${API_BASE_URL}/api/guilds/${guildId}/channels/${channelId}/messages`;
        } else {
          // For direct messages or other chat types
          url = `${API_BASE_URL}/api/chats/${roomId}/messages`;
        }
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.messages) {
            setMessages(data.messages);
          }
        } else {
          console.error('Failed to fetch messages:', response.statusText);
          // Set empty messages on error to avoid showing stale data
          setMessages([]);
        }
      } catch (error) {
        console.error('Failed to restore messages:', error);
        // Set empty messages on error to avoid showing stale data
        setMessages([]);
      }
    };

    restoreMessages();

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('room-messages', handleRoomMessages);
      socket.off('user-typing', handleUserTyping);
    };
  }, [socket, isConnected, chatId, channelId, chatType, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected || !user) return;

    try {
      const roomId = chatType === 'guild' ? channelId : chatId;
      const guildId = chatType === 'guild' ? chatId : undefined;
      
      await sendMessage(newMessage.trim(), guildId, roomId);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = () => {
    if (!socket || !isConnected) return;
    
    const roomId = chatType === 'guild' ? channelId : chatId;
    socket.emit('typing', { roomId });
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <h2 className="text-lg font-semibold">{getChatTitle()}</h2>
        {chatType === 'direct' && (
          <p className="text-sm text-muted-foreground">Direct message</p>
        )}
        {chatType === 'group' && (
          <p className="text-sm text-muted-foreground">Private group</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex space-x-3">                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {message.author.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{message.author.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm mt-1">{message.content}</p>
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="flex space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>...</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground italic">Someone is typing...</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t bg-card p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleTyping}
              placeholder={`Message ${getChatTitle()}`}
              className="pr-10"
              disabled={!isConnected}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || !isConnected}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {!isConnected && (
          <p className="text-xs text-muted-foreground mt-2">
            Connecting to chat...
          </p>
        )}
      </div>
    </div>
  );
}