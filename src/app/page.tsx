"use client";

import React, { useState } from "react";
import Logo from "@/components/logo";
import { ModeToggle } from "@/components/dark-mode-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  Clock, 
  Share2, 
  Layers, 
  TrendingUp,
  Search,
  Plus,
  ArrowUpRight,
  Filter,
  BarChart3,
  Users,
  Send,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  LayoutDashboard,
  CalendarDays,
  Lightbulb,
  Settings,
  Bell
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"overview" | "schedule" | "channels">("overview");

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">
      {/* Left Navigation Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar hidden md:flex flex-col justify-between p-5">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2">
            <Logo name="Lemon.ai" />
            <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30 bg-primary/5">
              Pro Plan
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">Main Menu</p>
            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "overview" 
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" 
                    : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab("schedule")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "schedule" 
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" 
                    : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Schedule
              </button>
              <button 
                onClick={() => setActiveTab("channels")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "channels" 
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" 
                    : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Share2 className="w-4 h-4" />
                Channels
              </button>
              <button 
                onClick={() => toast.info("Idea generation workspace ready!")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-all"
              >
                <Lightbulb className="w-4 h-4" />
                AI Ideas
              </button>
            </nav>
          </div>

          <div className="space-y-1 pt-2">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">Analytics &amp; Config</p>
            <nav className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-all">
                <BarChart3 className="w-4 h-4" />
                Performance
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-all">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </nav>
          </div>
        </div>

        {/* User Card */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center border border-primary/30">
              SH
            </div>
            <div>
              <p className="text-xs font-semibold leading-none">Sunnan Hassan</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Admin Workspace</p>
            </div>
          </div>
          <ModeToggle />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search campaigns, scheduled posts, ideas..." 
                className="pl-9 bg-card border-border h-9 text-xs focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Color Scheme Palette Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-primary text-xs font-medium border border-primary/20">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f87941]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#f9b095]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#b1b1b1]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#2f3035]"></span>
              <span className="ml-1 text-[11px] font-semibold">SaaS Palette Active</span>
            </div>

            <Button variant="outline" size="sm" className="gap-2 border-border">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              Filters
            </Button>

            <Button 
              size="sm" 
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/25"
              onClick={() => toast.success("Draft created!", { description: "Ready to schedule across channels." })}
            >
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          </div>
        </header>

        {/* Dashboard View */}
        <main className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Social Media Analytics</h1>
              <p className="text-sm text-muted-foreground mt-1">Track cross-channel performance and AI publishing schedules</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1 font-medium bg-card">
                <Clock className="w-3 h-3 mr-1 text-primary" />
                Updated 5m ago
              </Badge>
              <Button variant="outline" size="sm" className="border-border">
                Export Report
              </Button>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Metric 1 */}
            <Card className="border border-border bg-card shadow-sm hover:border-primary/40 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardDescription className="text-xs font-semibold text-muted-foreground">Total Impressions</CardDescription>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">288,822</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs">
                  <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +14.2%
                  </span>
                  <span className="text-muted-foreground">vs last month</span>
                </div>
              </CardContent>
            </Card>

            {/* Metric 2 */}
            <Card className="border border-border bg-card shadow-sm hover:border-primary/40 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardDescription className="text-xs font-semibold text-muted-foreground">Audience Growth</CardDescription>
                <div className="w-8 h-8 rounded-lg bg-[#f9b095]/20 flex items-center justify-center text-primary">
                  <Users className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">27,064</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs">
                  <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +9.1%
                  </span>
                  <span className="text-muted-foreground">new followers</span>
                </div>
              </CardContent>
            </Card>

            {/* Metric 3 */}
            <Card className="border border-border bg-card shadow-sm hover:border-primary/40 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardDescription className="text-xs font-semibold text-muted-foreground">Scheduled Posts</CardDescription>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <CalendarIcon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">48 Posts</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                  <span>12 queued for today</span>
                </div>
              </CardContent>
            </Card>

            {/* Metric 4 */}
            <Card className="border border-border bg-card shadow-sm hover:border-primary/40 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardDescription className="text-xs font-semibold text-muted-foreground">Avg. Engagement Rate</CardDescription>
                <div className="w-8 h-8 rounded-lg bg-[#f9b095]/20 flex items-center justify-center text-primary">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-primary">4.82%</div>
                <div className="flex items-center gap-1.5 mt-2 text-xs">
                  <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +0.73%
                  </span>
                  <span className="text-muted-foreground">above industry avg</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Chart and Donut Performance Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Analytics Chart Card */}
            <Card className="lg:col-span-2 border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-bold">Engagement Dynamics</CardTitle>
                  <CardDescription className="text-xs">Post interactions &amp; reach over time</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">This year</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {/* SVG Area Visualization styled with #f87941 & #f9b095 */}
                <div className="w-full h-56 relative flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="persimmonGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f87941" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#f87941" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="peachBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f87941" />
                        <stop offset="100%" stopColor="#f9b095" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="40" x2="600" y2="40" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />
                    <line x1="0" y1="90" x2="600" y2="90" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />
                    <line x1="0" y1="140" x2="600" y2="140" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />

                    {/* Area under curve */}
                    <path
                      d="M 0,160 Q 60,110 120,130 T 240,70 T 360,95 T 480,45 T 600,60 L 600,200 L 0,200 Z"
                      fill="url(#persimmonGradient)"
                    />

                    {/* Trend Line */}
                    <path
                      d="M 0,160 Q 60,110 120,130 T 240,70 T 360,95 T 480,45 T 600,60"
                      fill="none"
                      stroke="#f87941"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Peak Dot */}
                    <circle cx="480" cy="45" r="5" fill="#f87941" stroke="#ffffff" strokeWidth="2.5" />
                  </svg>
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/60">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                </div>
              </CardContent>
            </Card>

            {/* Performance Donut Gauge Card */}
            <Card className="border border-border bg-card shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Campaign Performance</CardTitle>
                <CardDescription className="text-xs">Overall conversion &amp; target rate</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="currentColor"
                      strokeOpacity="0.12"
                      strokeWidth="9"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#f87941"
                      strokeWidth="9"
                      strokeDasharray="251.2"
                      strokeDashoffset="65"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center text-center">
                    <span className="text-3xl font-extrabold text-foreground">74.2%</span>
                    <span className="text-[11px] font-medium text-muted-foreground">Target Reach</span>
                  </div>
                </div>

                <div className="w-full space-y-2 mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f87941]"></span>
                      Completed Schedules
                    </span>
                    <span className="font-semibold text-foreground">84%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f9b095]"></span>
                      Pending Inngest Jobs
                    </span>
                    <span className="font-semibold text-foreground">16%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Social Channels Overview & Scheduled Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Channels */}
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold">Connected Channels</CardTitle>
                <CardDescription className="text-xs">Active publishing endpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                {[
                  { name: "LinkedIn", handle: "@sunnanhassan", status: "Active", posts: "24 scheduled", color: "bg-blue-600" },
                  { name: "Twitter / X", handle: "@sunnan_dev", status: "Active", posts: "18 scheduled", color: "bg-slate-900 dark:bg-white dark:text-black" },
                  { name: "Instagram", handle: "@sunnan.designs", status: "Active", posts: "6 scheduled", color: "bg-pink-600" },
                  { name: "Facebook", handle: "AI Social Page", status: "Pending", posts: "0 scheduled", color: "bg-blue-700" }
                ].map((channel) => (
                  <div key={channel.name} className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 hover:bg-accent/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${channel.color} text-white flex items-center justify-center font-bold text-xs`}>
                        {channel.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold leading-tight">{channel.name}</p>
                        <p className="text-[11px] text-muted-foreground">{channel.handle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={channel.status === "Active" ? "secondary" : "outline"} className="text-[10px] px-2 py-0.5">
                        {channel.status}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{channel.posts}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Queue */}
            <Card className="lg:col-span-2 border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-bold">Upcoming Publishing Queue</CardTitle>
                  <CardDescription className="text-xs">Posts automated via Inngest background worker</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
                  View Full Queue <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {[
                  {
                    title: "Top 5 Strategies for Scaling Next.js Apps with Server Components",
                    channels: ["LinkedIn", "Twitter"],
                    time: "Today at 03:00 PM",
                    status: "Ready"
                  },
                  {
                    title: "Announcing AI-Powered Social Media Scheduling Workflow",
                    channels: ["Twitter", "Instagram", "Facebook"],
                    time: "Tomorrow at 10:30 AM",
                    status: "AI Reviewed"
                  },
                  {
                    title: "Why Color Palettes Matter: SaaS UI Design Deep-Dive",
                    channels: ["LinkedIn"],
                    time: "Sep 28, 2026 at 06:00 PM",
                    status: "Draft"
                  }
                ].map((post, i) => (
                  <div key={i} className="p-3.5 rounded-lg border border-border bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-colors">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{post.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{post.time}</span>
                        <span>&bull;</span>
                        <span>{post.channels.join(", ")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs font-medium text-primary border-primary/30 bg-primary/5">
                        {post.status}
                      </Badge>
                      <Button size="sm" variant="ghost" className="h-8 px-2 text-xs">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
