import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  MessageCircle,
  Users,
  Plus,
  ChevronDown,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFriendsStore, Friend } from "@/stores/friendsStore";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  isGroup: boolean;
  memberCount?: number;
}

export function DMPanel() {
  const navigate = useNavigate();
  const [isPanelDropdownOpen, setIsPanelDropdownOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [newFriendUsername, setNewFriendUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    friends,
    fetchFriends,
    isLoading,
    error,
    sendFriendRequest,
    resetErrors,
  } = useFriendsStore();

  // Fetch friends on component mount
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Convert friends to chat items format
  const chatItems: ChatItem[] = [
    // Direct messages from friends
    ...friends.map((friend) => ({
      id: friend.id,
      name: friend.username,
      lastMessage: "Click to start chatting", // Placeholder - would come from a messages store
      timestamp: new Date(),
      unread: 0, // Placeholder - would come from a messages store
      isGroup: false,
    })),
    // Groups - in a real implementation, these would come from the same store
    {
      id: "group-1",
      name: "Project Team",
      lastMessage: "Meeting at 3 PM",
      timestamp: new Date(),
      unread: 3,
      isGroup: true,
      memberCount: 5,
    },
    {
      id: "group-2",
      name: "Study Group",
      lastMessage: "Notes uploaded",
      timestamp: new Date(),
      unread: 0,
      isGroup: true,
      memberCount: 8,
    },
  ];

  // Sort by most recent message
  const sortedChatItems = [...chatItems].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleChatItemClick = (item: ChatItem) => {
    if (item.isGroup) {
      navigate(`/group/${item.id}`);
    } else {
      navigate(`/direct/${item.id}`);
    }
  };

  const handleAddFriend = async () => {
    if (!newFriendUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await sendFriendRequest(newFriendUsername);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Friend request sent successfully!");
        setNewFriendUsername("");
        // Close the dialog after successful submission
        setIsAddFriendOpen(false);
      }
    } catch (error) {
      toast.error("Failed to send friend request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isAddFriendOpen) {
      setNewFriendUsername("");
      resetErrors();
    }
  }, [isAddFriendOpen, resetErrors]);

  return (
    <div className="w-60 bg-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 sticky top-0 z-10 bg-gray-800">
        <DropdownMenu
          open={isPanelDropdownOpen}
          onOpenChange={setIsPanelDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-gray-700 rounded px-2 py-1 -mx-2 -my-1 transition-colors">
              <h2 className="text-white font-semibold text-lg">
                Conversations
              </h2>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isPanelDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => setIsAddFriendOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Friend
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              Create Group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="flex-1 p-2 overflow-y-auto">
        {/* Unified Chats Section */}
        <div className="flex items-center justify-between px-2 py-1 mb-2">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
            Recent Chats
          </span>
          <Button
            variant="none"
            size="icon"
            className="w-4 h-4 text-gray-400 hover:text-white"
            onClick={() => setIsAddFriendOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1">
          {isLoading.friends ? (
            <div className="py-4 text-center">
              <p className="text-gray-500 text-sm">Loading conversations...</p>
            </div>
          ) : sortedChatItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-500 text-sm mb-2">No conversations yet</p>
              <p className="text-gray-600 text-xs mb-4">
                Add friends to start chatting
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddFriendOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Friend
              </Button>
            </div>
          ) : (
            sortedChatItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center px-2 py-2 rounded hover:bg-gray-700 cursor-pointer group"
                onClick={() => handleChatItemClick(item)}
              >
                {item.isGroup ? (
                  <div className="h-8 w-8 mr-3 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                ) : (
                  <Avatar className="h-8 w-8 mr-3 flex-shrink-0">
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {item.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm font-medium truncate">
                      {item.name}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-xs truncate">
                      {item.lastMessage}
                    </p>
                    {item.isGroup && item.memberCount && (
                      <span className="text-gray-500 text-xs">
                        {item.memberCount} members
                      </span>
                    )}
                  </div>
                </div>
                {item.unread > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-4 w-4 p-0 flex items-center justify-center text-xs ml-2"
                  >
                    {item.unread}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Friend Dialog */}
      <Dialog open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Friend</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              Enter the username of the person you want to add as a friend.
            </p>
            <Input
              placeholder="Username"
              value={newFriendUsername}
              onChange={(e) => setNewFriendUsername(e.target.value)}
              className="mb-4"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleAddFriend}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Friend Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
