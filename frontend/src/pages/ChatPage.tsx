import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSocketStore, ChatMessage, User } from '../stores/socketStore';
import { Send, Users, LogOut, MessageCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ChatPage() {
  const { user, signOut } = useAuthStore();
  const { 
    isConnected, 
    messages,
    roomUsers, 
    currentRoom, 
    typingUsers,
    joinRoom, 
    sendMessage, 
    startTyping, 
    stopTyping,
    initializeSocket
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
        {/* Sidebar */}
        <div className="w-64 bg-card border-r p-4">
          <h3 className="text-sm font-medium mb-3">Online Users</h3>
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

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message: ChatMessage) => (
              <div
                key={message.id}
                className={`flex ${message.username === username ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.username === username
                      ? 'bg-primary text-primary-foreground'
                      : message.username === 'System'
                      ? 'bg-muted text-muted-foreground italic'
                      : 'bg-card text-card-foreground shadow-sm border'
                  }`}
                >
                  {message.username !== username && message.username !== 'System' && (
                    <div className="text-xs font-medium mb-1 text-muted-foreground">
                      {message.username}
                    </div>
                  )}
                  <div className="break-words">{message.message}</div>
                  <div className={`text-xs mt-1 ${
                    message.username === username ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
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
      </div>
    </div>
  );
}
