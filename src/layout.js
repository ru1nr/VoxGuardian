// src/Layout.js
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, Activity, History, Settings, AlertTriangle } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Activity,
  },
  {
    title: "Call History",
    url: "/history",
    icon: History,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-950">
        <style>
          {`
            :root {
              --sidebar-background: #0f172a;
              --sidebar-foreground: #cbd5e1;
              --sidebar-primary: #06b6d4;
              --sidebar-primary-foreground: #f8fafc;
              --sidebar-accent: #1e293b;
              --sidebar-accent-foreground: #e2e8f0;
              --sidebar-border: #334155;
            }
          `}
        </style>

        <Sidebar className="h-screen">
          <SidebarHeader>
            <div className="flex items-center space-x-2 font-bold text-lg">
              <Shield className="h-5 w-5 text-cyan-400" />
              <span>VoxGuardian</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title} active={location.pathname === item.url}>
                  <SidebarMenuButton as={Link} to={item.url} icon={item.icon}>
                    {item.title}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter>
            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton as={Link} to="/settings" icon={Settings}>
                      Preferences
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 p-4 text-slate-100 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
