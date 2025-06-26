import { Circle } from "lucide-react";

export type UserStatus = "online" | "do not disturb" | "inactive" | "offline";

interface UserStatusIndicatorProps {
  status: UserStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function UserStatusIndicator({ 
  status, 
  size = "sm", 
  showLabel = false 
}: UserStatusIndicatorProps) {
  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case "online":
        return "text-green-500";
      case "do not disturb":
        return "text-red-500";
      case "inactive":
        return "text-yellow-500";
      case "offline":
        return "text-gray-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusLabel = (status: UserStatus) => {
    switch (status) {
      case "online":
        return "Online";
      case "do not disturb":
        return "Do Not Disturb";
      case "inactive":
        return "Inactive";
      case "offline":
        return "Offline";
      default:
        return "Unknown";
    }
  };

  const getSizeClass = (size: "sm" | "md" | "lg") => {
    switch (size) {
      case "sm":
        return "h-2 w-2";
      case "md":
        return "h-3 w-3";
      case "lg":
        return "h-4 w-4";
      default:
        return "h-2 w-2";
    }
  };

  return (
    <div className="flex items-center space-x-1">
      <Circle 
        className={`${getSizeClass(size)} ${getStatusColor(status)} fill-current`}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {getStatusLabel(status)}
        </span>
      )}
    </div>
  );
}