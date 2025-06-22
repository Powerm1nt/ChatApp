import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSocketStore, ChatMessage, User, Channel } from '../stores/socketStore';
import { Send, Users, LogOut, MessageCircle, Wifi, WifiOff, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MessageChatBubbleProps {
  message: ChatMessage;
  username: string;
  showAvatar: boolean;
  showDate: boolean;
  isDest: boolean;
  formatTime: (timestamp: Date) => string;
}

function MessageChatBubble({ 
  message, 
  username, 
  showAvatar, 
  showDate, 
  isDest, 
  formatTime 
}: MessageChatBubbleProps) {
  return (
    <div className={`flex ${isDest ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
        {/* Avatar - only show for non-dest messages when showAvatar is true */}
        {!isDest && showAvatar && (
          <Avatar className="h-8 w-8 mb-1">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {message.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Spacer when avatar should be hidden but message is not from dest */}
        {!isDest && !showAvatar && (
          <div className="w-8" />
        )}

        <div className="flex flex-col">
          {/* Username - only show for non-dest messages when showAvatar is true */}
          {!isDest && showAvatar && message.username !== 'System' && (
            <div className="text-xs font-medium mb-1 text-muted-foreground ml-1">
              {message.username}
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`px-4 py-2 rounded-lg ${
              isDest
                ? 'bg-primary text-primary-foreground'
                : message.username === 'System'
                ? 'bg-muted text-muted-foreground italic'
                : 'bg-card text-card-foreground shadow-sm border'
            }`}
          >
            <div className="break-words">{message.message}</div>
          </div>

          {/* Timestamp - only show when showDate is true */}
          {showDate && (
            <div className={`text-xs mt-1 ${
              isDest ? 'text-right text-muted-foreground' : 'text-left text-muted-foreground'
            }`}>
              {formatTime(message.timestamp)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { 
    isConnected, 
    messages,
    roomUsers, 
    channels,
    currentRoom, 
    typingUsers,
    joinRoom, 
    sendMessage, 
    startTyping, 
    stopTyping,
    initializeSocket,
    fetchChannels
  } = useSocketStore();

  const [messageInput, setMessageInput] = useState('');
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('general');
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number>();

  // Initialize socket when component mounts
  useEffect(() => {
    initializeSocket();
  }, [initializeSocket]);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set default username from user data
  useEffect(() => {
    if (user && !username) {
      setUsername(user.username || user.email || 'Anonymous');
    }
  }, [user, username]);

  // Fetch channels when component mounts and user is authenticated
  useEffect(() => {
    if (user && hasJoinedRoom) {
      fetchChannels();
    }
  }, [user, hasJoinedRoom, fetchChannels]);

  const handleChannelSelect = (channelId: string) => {
    if (username.trim()) {
      joinRoom(username.trim(), channelId);
    }
  };

  const handleJoinRoom = () => {
    if (username.trim() && room.trim()) {
      joinRoom(username.trim(), room.trim());
      setHasJoinedRoom(true);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      try {
        await sendMessage(messageInput);
        setMessageInput('');
        handleStopTyping();
      } catch (error) {
        console.error('Failed to send message:', error);
        // You could add error handling UI here
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      startTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      stopTyping();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!hasJoinedRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl">Join Chat Room</CardTitle>
            <CardDescription>
              Enter your details to start chatting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="room" className="text-sm font-medium">
                Room
              </label>
              <Select value={room} onValueChange={setRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="tech">Tech Talk</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleJoinRoom}
              disabled={!username.trim() || !room.trim()}
              className="w-full"
            >
              <Users className="h-4 w-4 mr-2" />
              Join Room
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center space-x-1">
                {isConnected ? (
                  <Wifi className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </Badge>
              <h1 className="text-xl font-semibold">
                #{currentRoom}
              </h1>
            </div>
            <Badge variant="secondary">
              {roomUsers.length} user{roomUsers.length !== 1 ? 's' : ''} online
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {username}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="flex items-center space-x-1"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Channels Sidebar - Left */}
        <div className="w-64 bg-card border-r p-4">
          <h3 className="text-sm font-medium mb-3 flex items-center">
            <Hash className="h-4 w-4 mr-2" />
            Channels
          </h3>
          <Separator className="mb-3" />
          <div className="space-y-1">
            {channels.map((channel: Channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelSelect(channel.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  currentRoom === channel.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Hash className="h-3 w-3 mr-1" />
                    {channel.name}
                  </span>
                  {channel.stats.userCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {channel.stats.userCount}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.map((message: ChatMessage, index: number) => (
              <div key={message.id}>
                {/* Add padding between message groups when username changes */}
                {index > 0 && messages[index - 1].username !== message.username && (
                  <div style={{ paddingBlock: '2em' }} />
                )}

                <MessageChatBubble
                  message={message}
                  username={username}
                  showAvatar={
                    index === 0 || messages[index - 1].username !== message.username
                  }
                  showDate={
                    index === messages.length - 1 ||
                    messages[index + 1].username !== message.username
                  }
                  isDest={message.username === username}
                  formatTime={formatTime}
                />
              </div>
            ))}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="text-sm text-muted-foreground italic">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t p-4 bg-card">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                onBlur={handleStopTyping}
                placeholder="Type your message..."
                disabled={!isConnected}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!messageInput.trim() || !isConnected}
                size="sm"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Users Sidebar - Right */}
        <div className="w-64 bg-card border-l p-4">
          <h3 className="text-sm font-medium mb-3 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Online Users
          </h3>
          <Separator className="mb-3" />
          <div className="space-y-3">
            {roomUsers.map((roomUser: User) => (
              <div key={roomUser.id} className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {roomUser.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{roomUser.username}</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
