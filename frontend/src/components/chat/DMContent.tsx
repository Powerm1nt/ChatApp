import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { useFriendsStore } from "../../stores/friendsStore";
import { MessageCircle, Users, UserPlus, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import AddFriendDialog from "../AddFriendDialog";
import { toast } from "sonner";

export default function DMContent() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const {
    friends,
    receivedRequests,
    isLoading,
    fetchFriends,
    fetchReceivedRequests,
    acceptFriendRequest,
    declineFriendRequest,
  } = useFriendsStore();

  // Fetch friend requests and friends on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchFriends(), fetchReceivedRequests()]);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load friend data");
      }
    };

    fetchData();
  }, [fetchFriends, fetchReceivedRequests]);

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const result = await acceptFriendRequest(requestId);
      if (!result.error) {
        toast.success("Friend request accepted");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const result = await declineFriendRequest(requestId);
      if (!result.error) {
        toast.success("Friend request declined");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error declining friend request:", error);
      toast.error("Failed to decline friend request");
    }
  };

  const handleFriendRequestSent = async (username: string) => {
    try {
      const result = await useFriendsStore
        .getState()
        .sendFriendRequest(username);
      if (!result.error) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <AddFriendDialog onFriendRequestSent={handleFriendRequestSent} />
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
              <CardDescription>Pending friend requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading.receivedRequests ? (
                <p className="text-muted-foreground text-center py-4">
                  Loading friend requests...
                </p>
              ) : receivedRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No pending friend requests
                </p>
              ) : (
                receivedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {request.sender.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{request.sender.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Sent you a friend request
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleAcceptRequest(request.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineRequest(request.id)}
                      >
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
              <CardDescription>Your friends list</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading.friends ? (
                <p className="text-muted-foreground text-center py-4">
                  Loading friends...
                </p>
              ) : friends.length === 0 ? (
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
                      <div
                        className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${getStatusColor(
                          friend.status
                        )}`}
                      />
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
