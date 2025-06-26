import { useState } from "react";
import { Settings, LogOut, User, Edit, Circle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import { UserProfileDialog } from "./UserProfileDialog";
import { UserStatusIndicator, UserStatus } from "./UserStatusIndicator";
import { toast } from "@/lib/toast";

export function ProfileControl() {
  const { user, signOut, updateUserStatus } = useAuthStore();
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  // Get user status from user object, default to "online"
  const userStatus: UserStatus = user?.status || "online";

  if (!user) return null;

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

  const handleSignOut = async () => {
    await signOut();
  };

  const handleStatusChange = async (newStatus: UserStatus) => {
    const result = await updateUserStatus(newStatus);
    if (result.error) {
      console.error("Failed to update status:", result.error);
      toast.error("Failed to update status", result.error);
    }
  };

  const statusOptions: { value: UserStatus; label: string; color: string }[] = [
    { value: "online", label: "Online", color: "text-green-500" },
    { value: "dnd", label: "Do Not Disturb", color: "text-red-500" },
    { value: "inactive", label: "Inactive", color: "text-yellow-500" },
    { value: "offline", label: "Offline", color: "text-gray-500" },
  ];

  return (
    <TooltipProvider>
      <div className="p-2 bg-gray-800 border-t border-gray-700 w-[19em]">
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors flex-1">
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar} alt={getDisplayName()} />
                    <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                      {getUserInitials(user.username, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <UserStatusIndicator status={userStatus} size="sm" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {getDisplayName()}
                  </div>
                  <div className="text-xs text-gray-400 truncate flex items-center space-x-1">
                    <UserStatusIndicator
                      status={userStatus}
                      size="sm"
                      showLabel
                    />
                  </div>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-80 p-0">
              {/* Profile Card Header */}
              <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-16 h-16 border-2 border-white/20">
                      <AvatarImage src={user.avatar} alt={getDisplayName()} />
                      <AvatarFallback className="text-lg font-bold bg-white/20 text-white">
                        {getUserInitials(user.username, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1">
                      <UserStatusIndicator status={userStatus} size="md" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">
                      {getDisplayName()}
                    </h3>
                    <div className="flex items-center space-x-1 text-sm opacity-90">
                      <UserStatusIndicator
                        status={userStatus}
                        size="sm"
                        showLabel
                      />
                    </div>
                    {user.email && (
                      <div className="text-xs opacity-75 truncate mt-1">
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-1">
                {/* Status Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Circle
                      className={`mr-2 h-4 w-4 ${
                        statusOptions.find((s) => s.value === userStatus)
                          ?.color || "text-gray-500"
                      } fill-current`}
                    />
                    Set Status
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {statusOptions.map((status) => (
                      <DropdownMenuItem
                        key={status.value}
                        onClick={() => handleStatusChange(status.value)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <Circle
                            className={`mr-2 h-3 w-3 ${status.color} fill-current`}
                          />
                          <span>{status.label}</span>
                        </div>
                        {userStatus === status.value && (
                          <Check className="h-4 w-4" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-600"
                onClick={() => setShowProfileDialog(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>User Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <UserProfileDialog
          open={showProfileDialog}
          onOpenChange={setShowProfileDialog}
        />
      </div>
    </TooltipProvider>
  );
}
