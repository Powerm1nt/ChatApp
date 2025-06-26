import { useState, useEffect } from "react";
import { Users, Crown, Shield, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSocketStore } from "@/stores/socketStore";
import { UserGroup } from "./UserGroup";

interface UserListPanelProps {
  chatType: "guild" | "direct" | "group" | "unknown";
  chatId: string;
  channelId?: string;
}

interface ChatUser {
  id: string;
  username: string;
  status: "online" | "away" | "offline";
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

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleRoomUsers = (roomUsers: ChatUser[]) => {
      setUsers(roomUsers);
    };

    const handleUserJoined = (user: ChatUser) => {
      setUsers((prev) => {
        const exists = prev.find((u) => u.id === user.id);
        if (exists) return prev;
        return [...prev, user];
      });
    };

    const handleUserLeft = (userId: string) => {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    };

    const handleUserStatusUpdate = (data: {
      userId: string;
      status: string;
    }) => {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === data.userId
            ? { ...user, status: data.status as "online" | "away" | "offline" }
            : user
        )
      );
    };

    socket.on("room-users", handleRoomUsers);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);

    socket.on("user-status-update", handleUserStatusUpdate);
    const roomId = chatType === "guild" ? channelId : chatId;
    socket.emit("get-room-users", { roomId, chatType });

    return () => {
      socket.off("room-users", handleRoomUsers);
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("user-status-update", handleUserStatusUpdate);
    };
  }, [socket, isConnected, chatId, channelId, chatType]);

  const onlineUsers = users.filter((user) => user.status === "online");
  const awayUsers = users.filter((user) => user.status === "away");
  const offlineUsers = users.filter((user) => user.status === "offline");

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
            <p className="text-muted-foreground text-sm">No users online</p>
          </div>
        ) : (
          <>
            {onlineUsers.length > 0 && (
              <UserGroup
                title="Online"
                users={onlineUsers}
                count={onlineUsers.length}
                getStatusColor={getStatusColor}
                getRoleIcon={getRoleIcon}
                chatType={chatType}
              />
            )}
            {awayUsers.length > 0 && (
              <UserGroup
                title="Away"
                users={awayUsers}
                count={awayUsers.length}
                getStatusColor={getStatusColor}
                getRoleIcon={getRoleIcon}
                chatType={chatType}
              />
            )}
            {offlineUsers.length > 0 && (
              <UserGroup
                title="Offline"
                users={offlineUsers}
                count={offlineUsers.length}
                getStatusColor={getStatusColor}
                getRoleIcon={getRoleIcon}
                chatType={chatType}
              />
            )}
          </>
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
