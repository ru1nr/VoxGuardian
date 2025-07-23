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
 
