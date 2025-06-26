import { User, Calendar, Shield, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserStatusIndicator, UserStatus } from "./UserStatusIndicator";
import { User as UserType } from "@/stores/authStore";

interface UserProfileCardProps {
  user: UserType;
  status?: UserStatus;
  showDetails?: boolean;
  className?: string;
}

export function UserProfileCard({ 
  user, 
  status = "online", 
  showDetails = true,
  className 
}: UserProfileCardProps) {
  const getUserInitials = (username?: string, email?: string) => {
    if (username) {
      return username
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    if (user.username) return user.username;
    if (user.isAnonymous) return "Anonymous User";
    return user.email;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar} alt={getDisplayName()} />
              <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
                {getUserInitials(user.username, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1">
              <UserStatusIndicator status={status} size="md" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold truncate">{getDisplayName()}</h3>
              {user.isAnonymous && (
                <Badge variant="secondary" className="text-xs">
                  Guest
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <UserStatusIndicator status={status} size="sm" showLabel />
            </div>
          </div>
        </div>
      </CardHeader>
      
      {showDetails && (
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{user.email}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Joined {formatDate(user.createdAt)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>ID: {user.id.slice(0, 8)}...</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>{user.isAnonymous ? "Guest Account" : "Registered User"}</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}