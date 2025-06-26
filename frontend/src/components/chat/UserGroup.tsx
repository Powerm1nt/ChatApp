import { Crown, Shield, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfileCard } from "../UserProfileCard";
import { UserStatus } from "../UserStatusIndicator";

interface UserGroupProps {
  title: string;
  users: {
    id: string;
    username: string;
    status: UserStatus;
    role?: "owner" | "admin" | "member";
  }[];
  count: number;
}

export const UserGroup = ({ title, users, count }: UserGroupProps) => {
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

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      </div>
      <div className="space-y-1">
        {users.map((user) => (
          <DropdownMenu key={user.id}>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs select-none">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(
                      user.status
                    )}`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium truncate select-none">
                      {user.username}
                    </span>
                    {user.role && (
                      <div className="flex-shrink-0">
                        {getRoleIcon(user.role)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-0">
              <UserProfileCard
                user={{
                  id: user.id,
                  username: user.username,
                  email: `${user.username.toLowerCase()}@example.com`,
                  avatar: "",
                  createdAt: new Date().toISOString(),
                  isAnonymous: false,
                }}
                status={user.status}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>
    </div>
  );
};
