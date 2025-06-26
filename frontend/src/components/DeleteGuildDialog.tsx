import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGuildStore, Guild } from '../stores/guildStore';
import { useNavigate } from 'react-router-dom';

interface DeleteGuildDialogProps {
  guild: Guild;
  children?: React.ReactNode;
}

export function DeleteGuildDialog({ guild, children }: DeleteGuildDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { deleteGuild } = useGuildStore();
  const navigate = useNavigate();

  const isConfirmationValid = confirmationText === guild.name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConfirmationValid) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await deleteGuild(guild.id);
      if (result) {
        // Close dialog on success
        setOpen(false);
        // Navigate to home if we were viewing this guild
        navigate('/me');
      }
    } catch (error) {
      console.error('Failed to delete guild:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when dialog closes
      setConfirmationText('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ? (
          React.cloneElement(children as React.ReactElement, {
            onClick: (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }
          })
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="w-4 h-4 text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete Server</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the server{' '}
            <span className="font-semibold">"{guild.name}"</span> and all of its channels and messages.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="confirmation" className="text-sm font-medium">
                To confirm deletion, type the server name:{' '}
                <span className="font-semibold text-foreground">{guild.name}</span>
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Enter server name"
                disabled={isLoading}
                className="border-red-200 focus:border-red-400 focus:ring-red-400"
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
            <Button 
              type="submit" 
              variant="destructive"
              disabled={!isConfirmationValid || isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Server'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}