import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Users, Copy, Link, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFriendsStore } from "@/stores/friendsStore";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useGuildStore } from "@/stores/guildStore";
import axios from "axios";

interface GuildInvitationDialogProps {
  guildId: string;
  guildName: string;
  initialOpen?: boolean;
}

export interface GuildInvitationDialogRef {
  open: () => void;
}

const GuildInvitationDialog = forwardRef<GuildInvitationDialogRef, GuildInvitationDialogProps>(
  ({ guildId, guildName, initialOpen = false }, ref) => {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { friends, fetchFriends } = useFriendsStore();

    useImperativeHandle(ref, () => ({
      open: () => setIsOpen(true),
    }));

    useEffect(() => {
      if (isOpen) {
        fetchFriends();
      }
    }, [isOpen, fetchFriends]);

    const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        setSelectedFriends([]);
      }
    };

    const toggleFriendSelection = (friendId: string) => {
      setSelectedFriends(prev => 
        prev.includes(friendId)
          ? prev.filter(id => id !== friendId)
          : [...prev, friendId]
      );
    };

    const handleSendInvitations = async () => {
      if (selectedFriends.length === 0) {
        toast.error("Please select at least one friend");
        return;
      }
      setIsSending(true);
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
        const { token } = JSON.parse(localStorage.getItem("zustand-store") || '{}').state?.authStore || {};
        for (const friendId of selectedFriends) {
          const response = await axios.post(
            `${API_BASE_URL}/api/guilds/${guildId}/invitations`,
            { inviteeId: friendId },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (response.data && response.data.code) {
            toast.success(`Invitation sent to friend!`);
          }
        }
        setSelectedFriends([]);
        setTimeout(() => {
          setIsOpen(false);
        }, 500);
      } catch (err) {
        toast.error("Failed to send invitations");
        console.error(err);
      } finally {
        setIsSending(false);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Invite Friends to {guildName}</span>
            </DialogTitle>
            <DialogDescription>
              Select friends to invite to your guild or share the invitation link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {friends && friends.length > 0 ? (
              <ScrollArea className="h-[200px] rounded-md border p-2">
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center space-x-3 p-2 hover:bg-accent rounded-md">
                      <input
                        type="checkbox"
                        id={`friend-${friend.id}`}
                        checked={selectedFriends.includes(friend.id)}
                        onChange={() => toggleFriendSelection(friend.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{friend.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <Label 
                        htmlFor={`friend-${friend.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        {friend.username}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {isLoading ? "Loading friends..." : "No friends found. Add some friends first!"}
              </div>
            )}
            <Button
              onClick={handleSendInvitations}
              disabled={selectedFriends.length === 0 || isSending}
              className="w-full"
            >
              {isSending ? "Sending..." : `Send Invitation${selectedFriends.length > 1 ? "s" : ""}`}
            </Button>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

GuildInvitationDialog.displayName = "GuildInvitationDialog";

export default GuildInvitationDialog;