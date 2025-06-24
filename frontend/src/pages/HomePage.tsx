import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { MessageCircle, Users, UserPlus, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AddFriendDialog from '../components/AddFriendDialog';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  // Placeholder data - these would come from your backend/store
  const directMessages = [
    { id: '1', username: 'Alice', lastMessage: 'Hey, how are you?', timestamp: new Date(), unread: 2 },
    { id: '2', username: 'Bob', lastMessage: 'Thanks for the help!', timestamp: new Date(), unread: 0 },
    { id: '3', username: 'Charlie', lastMessage: 'See you tomorrow', timestamp: new Date(), unread: 1 },
  ];

  const privateGroups = [
    { id: '1', name: 'Project Team', lastMessage: 'Meeting at 3 PM', timestamp: new Date(), unread: 3, memberCount: 5 },
    { id: '2', name: 'Study Group', lastMessage: 'Notes uploaded', timestamp: new Date(), unread: 0, memberCount: 8 },
  ];

  const friendRequests = [
    { id: '1', username: 'David', mutualFriends: 3 },
    { id: '2', username: 'Emma', mutualFriends: 1 },
  ];

  const friends = [
    { id: '1', username: 'Alice', status: 'online' },
    { id: '2', username: 'Bob', status: 'away' },
    { id: '3', username: 'Charlie', status: 'offline' },
    { id: '4', username: 'Diana', status: 'online' },
  ];

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Home</h1>
              <Badge variant="secondary">
                Welcome back, {user?.username || user?.email}!
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <AddFriendDialog onFriendRequestSent={(username) => {
                console.log(`Friend request sent to ${username}`);
                // You can add additional logic here like refreshing friend requests
              }} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Direct Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Direct Messages</span>
              </CardTitle>
              <CardDescription>
                Your private conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {directMessages.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No direct messages yet
                </p>
              ) : (
                directMessages.map((dm) => (
                  <div
                    key={dm.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate(`/direct/${dm.id}`)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {dm.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{dm.username}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(dm.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {dm.lastMessage}
                      </p>
                    </div>
                    {dm.unread > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {dm.unread}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Private Groups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Private Groups</span>
              </CardTitle>
              <CardDescription>
                Your private group conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {privateGroups.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No private groups yet
                </p>
              ) : (
                privateGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate(`/group/${group.id}`)}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{group.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(group.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {group.lastMessage}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {group.memberCount} members
                        </span>
                      </div>
                    </div>
                    {group.unread > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {group.unread}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Friend Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>Friend Requests</span>
              </CardTitle>
              <CardDescription>
                Pending friend requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {friendRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No pending friend requests
                </p>
              ) : (
                friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {request.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{request.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.mutualFriends} mutual friends
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="default">
                        Accept
                      </Button>
                      <Button size="sm" variant="outline">
                        Decline
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Friends List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Friends</span>
              </CardTitle>
              <CardDescription>
                Your friends list
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {friends.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No friends yet
                </p>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate(`/direct/${friend.id}`)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {friend.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${getStatusColor(friend.status)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{friend.username}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {friend.status}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}