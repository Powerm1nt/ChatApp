
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { MessageCircle, Users, UserPlus, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import AddFriendDialog from '../AddFriendDialog';

export default function DMContent() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  // Placeholder data - these would come from your backend/store
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Home</h1>
              <Badge variant="secondary">
                Welcome back, {user?.username || user?.email}!
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <AddFriendDialog onFriendRequestSent={(username) => {
                console.log(`Friend request sent to ${username}`);
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
      <div className="px-6 py-8 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
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