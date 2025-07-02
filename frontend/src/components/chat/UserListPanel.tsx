import { useState, useEffect } from "react";
import { Users, Crown, Shield, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSocketStore } from "@/stores/socketStore";
import { UserGroup } from "./UserGroup";
import { useAuthStore } from "@/stores/authStore";
import type { UserStatus } from "../UserStatusIndicator";

interface UserListPanelProps {
  chatType: "guild" | "direct" | "group" | "unknown";
  chatId: string;
  channelId?: string;
}

interface ChatUser {
  id: string;
  username: string;
  status: UserStatus;
  role?: "owner" | "admin" | "member";
  room?: string;
  guildId?: string;
  joinedAt?: Date;
}

export default function UserListPanel({
  chatType,
  chatId,
  channelId,
}: Readonly<UserListPanelProps>) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const { socket, isConnected } = useSocketStore();
  const { user } = useAuthStore();

  const getPanelTitle = () => {
    switch (chatType) {
      case "guild":
        return "Members";
      case "direct":
        return "Participants";
      case "group":
        return "Group Members";
      default:
        return "Users";
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

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case "admin":
        return <Shield className="h-3 w-3 text-blue-500" />;
      default:
        return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  // Fetch all members with read access from backend
  useEffect(() => {
    let url: string | null = null;
    if (chatType === "guild" && chatId) {
      url = `/api/guilds/${chatId}/members`;
    } else if (chatType === "group" && chatId) {
      url = `/api/groups/${chatId}/members`;
    } else if (chatType === "direct" && chatId && user) {
      url = `/api/users/dm-members?userA=${user.id}&userB=${chatId}`;
    }
    if (!url) return;
    const fetchMembers = async () => {
      try {
        const { token } = useAuthStore.getState();
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data.members || []);
        } else {
          setUsers([]);
        }
      } catch (e) {
        setUsers([]);
      }
    };
    fetchMembers();
  }, [chatType, chatId, user]);

  // Update online status from socket 'room-users' event
  useEffect(() => {
    if (!socket || !isConnected) return;
    const handleRoomUsers = (roomUsers: ChatUser[]) => {
      setUsers((prev) => {
        return prev.map((member) => {
          const onlineUser = roomUsers.find((u) => u.id === member.id);
          if (onlineUser) {
            return { ...member, status: onlineUser.status };
          }
          return member;
        });
      });
    };
    socket.on("room-users", handleRoomUsers);
    const roomId = chatType === "guild" ? channelId : chatId;
    socket.emit("get-room-users", { roomId, chatType });
    return () => {
      socket.off("room-users", handleRoomUsers);
    };
  }, [socket, isConnected, chatId, channelId, chatType]);

  // Directly render all users, no filters or finds
  return (
    <div className="h-full bg-card border-l flex flex-col">
      <div className="border-b px-4 py-3 sticky top-0 z-10 bg-card">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <h2 className="font-semibold text-sm">{getPanelTitle()}</h2>
          <Badge variant="outline" className="text-xs">
            {users.length}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {users.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground text-sm">No users</p>
          </div>
        ) : (
          <UserGroup
            title="All Users"
            users={users}
            count={users.length}
          />
        )}
      </div>

      {chatType === "direct" && (
        <div className="border-t px-4 py-2">
          <p className="text-xs text-muted-foreground">
            Direct message conversation
          </p>
        </div>
      )}
      {chatType === "group" && (
        <div className="border-t px-4 py-2">
          <p className="text-xs text-muted-foreground">Private group chat</p>
        </div>
      )}
    </div>
  );
}
