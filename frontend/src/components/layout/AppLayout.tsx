import React from "react";
import { GuildSidebar } from "./GuildSidebar";
import { ProfileControl } from "../ProfileControl";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <GuildSidebar />
      <div className="flex-1 flex flex-col ml-16 h-full">{children}</div>
    </div>
  );
}
