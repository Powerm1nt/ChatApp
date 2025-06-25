import React, { useState } from 'react';
import { Settings, Trash2, Hash, Users, Shield } from 'lucide-react';
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

import { useGuildStore, Guild, Channel } from '../stores/guildStore';
import { useConfirmationDialog } from './ui/confirmation-dialog';
import { toast } from 'sonner';

interface GuildSettingsDialogProps {
  guild: Guild;
  children?: React.ReactNode;
}

export function GuildSettingsDialog({ guild, children }: GuildSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(guild.name);
  const [description, setDescription] = useState(guild.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const { updateGuild, deleteChannel, channels } = useGuildStore();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const guildChannels = channels.filter(channel => channel.guildId === guild.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateGuild(
        guild.id,
        name,
        description || undefined
      );
      if (result) {
        toast.success('Workspace updated successfully');
      }
    } catch (error) {
      console.error('Failed to update guild:', error);
      toast.error('Failed to update workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChannel = (channel: Channel) => {
    showConfirmation({
      title: "Delete Channel",
      description: `Are you sure you want to delete "${channel.name}"? This action cannot be undone.`,
      confirmText: "Delete Channel",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const success = await deleteChannel(guild.id, channel.id);
          if (success) {
            toast.success(`Channel "${channel.name}" deleted successfully`);
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

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when dialog closes
      setName(guild.name);
      setDescription(guild.description || '');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
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
                <DialogTitle className="text-lg font-semibold">
                  {guild.name} Settings
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
                  value="channels" 
                  className="w-full justify-start px-3 py-2 text-left data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                >
                  <Hash className="w-4 h-4 mr-2" />
                  Channels
                </TabsTrigger>
                <TabsTrigger 
                  value="members" 
                  className="w-full justify-start px-3 py-2 text-left data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Members
                </TabsTrigger>
                <TabsTrigger 
                  value="permissions" 
                  className="w-full justify-start px-3 py-2 text-left data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Permissions
                </TabsTrigger>
              </TabsList>

              {/* Delete Workspace Button at bottom of sidebar */}
              <div className="mt-auto p-4 border-t">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Danger Zone
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    // For now, we'll show a message that this deletes the workspace
                    // In a real app, you might want to delete the entire guild
                    showConfirmation({
                      title: "Delete Workspace",
                      description: `Are you sure you want to delete "${guild.name}"? This action cannot be undone and will delete all channels and messages.`,
                      confirmText: "Delete Workspace",
                      variant: "destructive",
                      onConfirm: () => {
                        toast.error('Workspace deletion not implemented yet');
                      },
                    });
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Workspace
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <TabsContent value="general" className="h-full m-0 p-6 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">General Settings</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Workspace Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter workspace name"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Enter workspace description (optional)"
                          rows={3}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={!name.trim() || isLoading}>
                          {isLoading ? 'Updating...' : 'Save Changes'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setName(guild.name);
                            setDescription(guild.description || '');
                          }}
                          disabled={isLoading}
                        >
                          Reset
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="channels" className="h-full m-0 p-6 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Channel Management</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Manage channels in this workspace. You can delete channels that are no longer needed.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {guildChannels.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Hash className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No channels found in this workspace.</p>
                      </div>
                    ) : (
                      guildChannels.map((channel) => (
                        <div
                          key={channel.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Hash className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="font-medium">{channel.name}</div>
                              {channel.description && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {channel.description}
                                </div>
                              )}
                              <div className="text-xs text-gray-400 mt-1">
                                {channel.stats.userCount} members • {channel.stats.messageCount} messages
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteChannel(channel)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="members" className="h-full m-0 p-6 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Member Management</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Manage members and their permissions in this workspace.
                    </p>
                  </div>
                  
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Member management coming soon.</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="h-full m-0 p-6 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Permission Settings</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Configure roles and permissions for workspace members.
                    </p>
                  </div>
                  
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Permission management coming soon.</p>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog />
    </>
  );
}