import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSocketStore, ChatMessage, User } from '../stores/socketStore';
import { Send, Users, LogOut, MessageCircle, Wifi, WifiOff } from 'lucide-react';

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

  // Auto-scroll to bottom when new messages arrive
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessage(messageInput);
      setMessageInput('');
      handleStopTyping();
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-primary-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Join Chat Room</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your details to start chatting
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="room" className="block text-sm font-medium text-gray-700">
                Room
              </label>
              <select
                id="room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="general">General</option>
                <option value="random">Random</option>
                <option value="tech">Tech Talk</option>
                <option value="gaming">Gaming</option>
              </select>
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={!username.trim() || !room.trim()}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Users className="h-4 w-4 mr-2" />
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                #{currentRoom}
              </h1>
            </div>
            <span className="text-sm text-gray-500">
              {roomUsers.length} user{roomUsers.length !== 1 ? 's' : ''} online
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {username}
            </span>
            <button
              onClick={signOut}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Online Users</h3>
          <div className="space-y-2">
            {roomUsers.map((roomUser: User) => (
              <div key={roomUser.id} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-700">{roomUser.username}</span>
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
                      ? 'bg-primary-500 text-white'
                      : message.username === 'System'
                      ? 'bg-gray-100 text-gray-600 italic'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  }`}
                >
                  {message.username !== username && message.username !== 'System' && (
                    <div className="text-xs font-medium mb-1 text-gray-500">
                      {message.username}
                    </div>
                  )}
                  <div className="break-words">{message.message}</div>
                  <div className={`text-xs mt-1 ${
                    message.username === username ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="text-sm text-gray-500 italic">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <input
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                onBlur={handleStopTyping}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || !isConnected}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
