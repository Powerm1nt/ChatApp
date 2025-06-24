import React from 'react';
import { GuildSidebar } from './GuildSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <GuildSidebar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}