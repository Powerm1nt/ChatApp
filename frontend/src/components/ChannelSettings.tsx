import React, { useState } from 'react';
import { Settings, Trash2, Hash, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useGuildStore, Channel } from '../stores/guildStore';
import { useConfirmationDialog } from './ui/confirmation-dialog';
import { toast } from 'sonner';

interface ChannelSettingsProps {
  guildId: string;
  channel: Channel;
  children?: React.ReactNode;
}

function GeneralSettings({ channel, guildId }: { channel: Channel; guildId: string }) {
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description || '');
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
        toast.success(`Channel "${name}" updated successfully`);
      }
    } catch (error) {
      console.error('Failed to update channel:', error);
      toast.error('Failed to update channel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">General Settings</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channel-name">
              Channel Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="channel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter channel name"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="channel-description">Description</Label>
            <Textarea
              id="channel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter channel description (optional)"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Channel Statistics</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-500">Members</div>
                <div className="text-lg font-semibold">{channel.stats.userCount}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-500">Messages</div>
                <div className="text-lg font-semibold">{channel.stats.messageCount}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? 'Updating...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setName(channel.name);
                setDescription(channel.description || '');
              }}
              disabled={isLoading}
            >
              Reset
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PermissionsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Channel Permissions</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Configure who can access and interact with this channel.
        </p>
      </div>
      
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Permission management coming soon.</p>
      </div>
    </div>
  );
}

export function ChannelSettings({ guildId, channel, children }: ChannelSettingsProps) {
  const [open, setOpen] = useState(false);
  const { deleteChannel } = useGuildStore();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const handleDeleteChannel = () => {
    showConfirmation({
      title: "Delete Channel",
      description: `Are you sure you want to delete "${channel.name}"? This action cannot be undone.`,
      confirmText: "Delete Channel",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const success = await deleteChannel(guildId, channel.id);
          if (success) {
            toast.success(`Channel "${channel.name}" deleted successfully`);
            setOpen(false);
          } else {
            toast.error('Failed to delete channel. Please try again.');
          }
        } catch (error) {
          console.error('Failed to delete channel:', error);
          toast.error('Failed to delete channel. Please try again.');
        }
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children || (
            <Button
              variant="ghost"
              size="icon"
              className="w-4 h-4 text-gray-400 hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <Tabs defaultValue="general" orientation="vertical" className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r flex flex-col">
              <DialogHeader className="p-6 pb-4">
                <DialogTitle className="text-lg font-semibold flex items-center space-x-3">
                  <Hash className="w-6 h-6 text-gray-400" />
                  <div>
                    <div>{channel.name}</div>
                    <div className="text-sm text-gray-500 font-normal">Channel Settings</div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <TabsList className="flex-col h-auto bg-transparent p-2 space-y-1">
                <TabsTrigger 
                  value="general" 
                  className="w-full justify-start px-3 py-2 text-left data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger 
                  value="permissions" 
                  className="w-full justify-start px-3 py-2 text-left data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Permissions
                </TabsTrigger>
              </TabsList>

              {/* Delete Channel Button at bottom of sidebar */}
              <div className="mt-auto p-4 border-t">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Danger Zone
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleDeleteChannel}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Channel
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <TabsContent value="general" className="h-full m-0 p-6 overflow-y-auto">
                <GeneralSettings channel={channel} guildId={guildId} />
              </TabsContent>

              <TabsContent value="permissions" className="h-full m-0 p-6 overflow-y-auto">
                <PermissionsSettings />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog />
    </>
  );
}