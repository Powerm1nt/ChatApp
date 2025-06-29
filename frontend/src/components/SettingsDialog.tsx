import { useState } from "react";
import {
  User,
  Calendar,
  Shield,
  Edit2,
  Save,
  X,
  Settings,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/authStore";
import { ProfileCard } from "./ProfileCard";
import { UserProfileCard } from "./UserProfileCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Theme, useThemeStore } from "../stores/themeStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
}: Readonly<UserProfileDialogProps>) {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState(user?.username ?? "");
  const { theme, setTheme, getEffectiveTheme } = useThemeStore();

  if (!user) return null;

  const handleSaveProfile = () => {
    // TODO: Implement profile update API call
    console.log("Saving profile:", { username: editedUsername });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedUsername(user.username ?? "");
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const getThemeIcon = (themeOption: Theme) => {
    switch (themeOption) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "system":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getThemeLabel = (themeOption: Theme) => {
    switch (themeOption) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
        return `System (${getEffectiveTheme() === "dark" ? "Dark" : "Light"})`;
      default:
        return "Unknown";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <Tabs
          defaultValue="profile"
          orientation="vertical"
          className="flex h-full"
        >
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r flex flex-col">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-lg font-semibold">
                Settings
              </DialogTitle>
            </DialogHeader>

            <TabsList className="flex-col h-auto bg-transparent p-2 space-y-1">
              <TabsTrigger
                value="profile"
                className="w-full justify-start px-3 py-2 text-left data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="w-full justify-start px-3 py-2 text-left data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
              >
                <Settings className="w-4 h-4 mr-2" />
                Appearance
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="w-full justify-start px-3 py-2 text-left data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <TabsContent
              value="profile"
              className="h-full m-0 p-6 overflow-y-auto"
            >
              <div className="space-y-6">
                {/* Profile Header - Use UserProfileCard */}
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                  </div>
                  <UserProfileCard user={user} status="online" />
                </div>

                {/* Profile Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ProfileCard
                    title="Account Information"
                    icon={<User className="h-5 w-5" />}
                    items={[
                      { label: "User ID", value: user.id },
                      { label: "Email", value: user.email },
                      { label: "Username", value: user.username ?? "Not set" },
                      {
                        label: "Account Type",
                        value: user.isAnonymous ? "Guest" : "Registered",
                      },
                    ]}
                  />

                  <ProfileCard
                    title="Account Details"
                    icon={<Calendar className="h-5 w-5" />}
                    items={[
                      { label: "Created", value: formatDate(user.createdAt) },
                      { label: "Status", value: "Online" },
                      { label: "Last Active", value: "Now" },
                    ]}
                  />
                </div>

                {/* Edit Profile Form */}
                {isEditing && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Edit2 className="h-5 w-5" />
                        <span>Edit Profile</span>
                      </CardTitle>
                      <CardDescription>
                        Update your profile information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={editedUsername}
                          onChange={(e) => setEditedUsername(e.target.value)}
                          placeholder="Enter your username"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleSaveProfile} className="flex-1">
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="appearance"
              className="h-full m-0 p-6 overflow-y-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Monitor className="h-5 w-5" />
                    <span>Appearance</span>
                  </CardTitle>
                  <CardDescription>
                    Customize how the chat app looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="theme" className="text-sm font-medium">
                      Theme
                    </label>
                    <Select value={theme} onValueChange={handleThemeChange}>
                      <SelectTrigger>
                        <SelectValue>
                          <div className="flex items-center space-x-2">
                            {getThemeIcon(theme)}
                            <span>{getThemeLabel(theme)}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center space-x-2">
                            <Sun className="h-4 w-4" />
                            <span>Light</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center space-x-2">
                            <Moon className="h-4 w-4" />
                            <span>Dark</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center space-x-2">
                            <Monitor className="h-4 w-4" />
                            <span>System (Auto)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Choose your preferred theme. System will automatically
                      match your device's theme.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Theme Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>See how your theme looks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Sample chat messages */}
                    <div className="space-y-2">
                      <div className="flex justify-start">
                        <div className="bg-card text-card-foreground shadow-sm border px-4 py-2 rounded-lg max-w-xs">
                          <div className="break-words">
                            Hello! How are you doing?
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg max-w-xs">
                          <div className="break-words">
                            I'm doing great, thanks for asking!
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-muted text-muted-foreground italic px-4 py-2 rounded-lg max-w-xs">
                          <div className="break-words">
                            System: User joined the chat
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="settings"
              className="h-full m-0 p-6 overflow-y-auto"
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Account Settings</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Manage your account preferences and security.
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Security & Privacy</span>
                    </CardTitle>
                    <CardDescription>
                      Configure your account security and privacy settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Email notification settings will be available soon.
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Privacy Settings</Label>
                      <div className="text-sm text-muted-foreground">
                        Privacy controls will be available soon.
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Security</Label>
                      <div className="text-sm text-muted-foreground">
                        Password and security settings will be available soon.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
