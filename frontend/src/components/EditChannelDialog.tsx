import React, { useState } from "react";
import { Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGuildStore, Channel } from "../stores/guildStore";
import { toast } from "@/lib/toast";

interface EditChannelDialogProps {
  guildId: string;
  channel: Channel;
  children?: React.ReactNode;
}

export function EditChannelDialog({
  guildId,
  channel,
  children,
}: EditChannelDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description || "");
  const [isLoading, setIsLoading] = useState(false);
  const { updateChannel } = useGuildStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateChannel(
        guildId,
        channel.id,
        name,
        description || undefined
      );
      if (result) {
        // Close dialog on success
        setOpen(false);
        toast.success(`Channel "${name}" updated successfully`);
      }
    } catch (error) {
      console.error("Failed to update channel:", error);
      toast.error("Failed to update channel. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when dialog closes
      setName(channel.name);
      setDescription(channel.description ?? "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="icon"
            className="w-4 h-4 text-gray-400 hover:text-white"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Channel</DialogTitle>
          <DialogDescription>
            Update the channel name and description.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Channel Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter channel name"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter channel description (optional)"
                disabled={isLoading}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? "Updating..." : "Update Channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
