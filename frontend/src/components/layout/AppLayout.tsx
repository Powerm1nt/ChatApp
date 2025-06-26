import React from 'react';
import { GuildSidebar } from './GuildSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <GuildSidebar />
      <div className="flex-1 flex flex-col ml-16 h-full">
        {children}
      </div>
    </div>
  );
}