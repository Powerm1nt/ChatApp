import { useNavigate } from "react-router-dom";
import { useState } from "react";
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


interface DirectMessage {
  id: string;
  username: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
}

interface PrivateGroup {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  memberCount: number;
}

export function DMPanel() {
  const navigate = useNavigate();
  const [isDMDropdownOpen, setIsDMDropdownOpen] = useState(false);

  // Placeholder data - these would come from your backend/store
  const directMessages: DirectMessage[] = [
    { id: '1', username: 'Alice', lastMessage: 'Hey, how are you?', timestamp: new Date(), unread: 2 },
    { id: '2', username: 'Bob', lastMessage: 'Thanks for the help!', timestamp: new Date(), unread: 0 },
    { id: '3', username: 'Charlie', lastMessage: 'See you tomorrow', timestamp: new Date(), unread: 1 },
  ];

  const privateGroups: PrivateGroup[] = [
    { id: '1', name: 'Project Team', lastMessage: 'Meeting at 3 PM', timestamp: new Date(), unread: 3, memberCount: 5 },
    { id: '2', name: 'Study Group', lastMessage: 'Notes uploaded', timestamp: new Date(), unread: 0, memberCount: 8 },
  ];

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleDMClick = (dmId: string) => {
    navigate(`/direct/${dmId}`);
  };

  const handleGroupClick = (groupId: string) => {
    navigate(`/group/${groupId}`);
  };

  return (
    <div className="w-60 bg-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 sticky top-0 z-10 bg-gray-800">
        <DropdownMenu
          open={isDMDropdownOpen}
          onOpenChange={setIsDMDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-gray-700 rounded px-2 py-1 -mx-2 -my-1 transition-colors">
              <h2 className="text-white font-semibold text-lg">
                Direct Messages
              </h2>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isDMDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Friend
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="flex-1 p-2 overflow-y-auto">
        {/* Direct Messages Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
              Direct Messages
            </span>
            <Button
              variant="none"
              size="icon"
              className="w-4 h-4 text-gray-400 hover:text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1">
            {directMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-500 text-sm mb-2">No direct messages yet</p>
                <p className="text-gray-600 text-xs mb-4">
                  Add friends to start chatting
                </p>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Friend
                </Button>
              </div>
            ) : (
              directMessages.map((dm) => (
                <div
                  key={dm.id}
                  className="flex items-center px-2 py-2 rounded hover:bg-gray-700 cursor-pointer group"
                  onClick={() => handleDMClick(dm.id)}
                >
                  <Avatar className="h-8 w-8 mr-3 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {dm.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm font-medium truncate">
                        {dm.username}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatTime(dm.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs truncate">
                      {dm.lastMessage}
                    </p>
                  </div>
                  {dm.unread > 0 && (
                    <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-xs ml-2">
                      {dm.unread}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Private Groups Section */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
              Private Groups
            </span>
            <Button
              variant="none"
              size="icon"
              className="w-4 h-4 text-gray-400 hover:text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1">
            {privateGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-500 text-sm mb-2">No private groups yet</p>
                <p className="text-gray-600 text-xs mb-4">
                  Create a group to chat with multiple friends
                </p>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </div>
            ) : (
              privateGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center px-2 py-2 rounded hover:bg-gray-700 cursor-pointer group"
                  onClick={() => handleGroupClick(group.id)}
                >
                  <div className="h-8 w-8 mr-3 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm font-medium truncate">
                        {group.name}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatTime(group.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-400 text-xs truncate">
                        {group.lastMessage}
                      </p>
                      <span className="text-gray-500 text-xs">
                        {group.memberCount} members
                      </span>
                    </div>
                  </div>
                  {group.unread > 0 && (
                    <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-xs ml-2">
                      {group.unread}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}