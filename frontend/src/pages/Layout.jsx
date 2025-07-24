
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
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
    url: createPageUrl("Dashboard"),
    icon: Activity,
  },
  {
    title: "Call History",
    url: createPageUrl("History"),
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
        
        <Sidebar className="border-r border-slate-800 bg-slate-900">
          <SidebarHeader className="border-b border-slate-800 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white">VoxGuardian</h2>
                <p className="text-sm text-slate-400">AI Call Detection</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-slate-800 hover:text-cyan-400 transition-all duration-200 rounded-lg ${
                          location.pathname === item.url ? 'bg-cyan-500/20 text-cyan-400 border-l-4 border-cyan-500' : 'text-slate-300'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-8">
              <SidebarGroupLabel className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
                Status
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-slate-300">System Online</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                    <span className="text-slate-300">AI Models Active</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-slate-300">3 Alerts Today</span>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">Operator</p>
                <p className="text-xs text-slate-400">Emergency Services</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-800 p-2 rounded-lg transition-colors duration-200 text-slate-300" />
              <h1 className="text-xl font-bold text-white">VoxGuardian</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-slate-950">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
