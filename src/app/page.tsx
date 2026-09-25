"use client";

import Logo from "@/components/logo";
import { ModeToggle } from "@/components/dark-mode-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  CalendarIcon, 
  SparklesIcon, 
  ClockIcon, 
  Share2Icon, 
  LayersIcon, 
  BarChart3Icon,
  CheckCircle2Icon
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Logo name="AI Social Scheduler" />
        
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="hidden sm:inline-flex items-center gap-1.5 font-medium px-3 py-1">
            <SparklesIcon className="w-3.5 h-3.5 text-primary" />
            shadcn/ui + Tailwind v4 Active
          </Badge>
          <ModeToggle />
          <Button 
            size="sm" 
            onClick={() => toast.success("Connected to AI Social Media Scheduler!", {
              description: "shadcn/ui Sonner toaster is working perfectly."
            })}
          >
            Test Sonner Toast
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col gap-10">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <CheckCircle2Icon className="w-3.5 h-3.5" />
            32+ shadcn UI Primitives Installed
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            AI Social Media Scheduling
            <span className="block text-primary mt-1">Unified Multi-Platform Platform</span>
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl">
            Bootstrap ideas, schedule automated social campaigns across all channels, and track engagement with AI-guided scheduling workflows.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" className="gap-2">
              <CalendarIcon className="w-4 h-4" />
              Open Scheduler
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <SparklesIcon className="w-4 h-4" />
              Generate Post with AI
            </Button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-primary/50 transition-all hover:shadow-md">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                <ClockIcon className="w-5 h-5" />
              </div>
              <CardTitle>Smart Auto-Scheduling</CardTitle>
              <CardDescription>
                AI detects peak engagement hours for LinkedIn, Twitter, Instagram, and Facebook.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Badge variant="outline">Inngest Queue</Badge>
                <span>Automated background pipelines</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-all hover:shadow-md">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                <Share2Icon className="w-5 h-5" />
              </div>
              <CardTitle>Multi-Platform Publishing</CardTitle>
              <CardDescription>
                Compose once, customize per network, and dispatch content simultaneously.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Badge variant="outline">OAuth 2.0</Badge>
                <span>Encrypted channel tokens</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-all hover:shadow-md">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                <BarChart3Icon className="w-5 h-5" />
              </div>
              <CardTitle>Engagement Analytics</CardTitle>
              <CardDescription>
                Deep insights and sentiment scoring on publishing performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Badge variant="outline">Real-Time</Badge>
                <span>Sync with TanStack Query</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* UI Primitives Showcase */}
        <Card className="border border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LayersIcon className="w-5 h-5 text-primary" />
                  Installed Component Modules
                </CardTitle>
                <CardDescription>
                  Imported directly from the Lemon AI SaaS repository with full Tailwind CSS v4 styling.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ui" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md mb-4">
                <TabsTrigger value="ui">UI Components (32)</TabsTrigger>
                <TabsTrigger value="schedule">Schedule Modules</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="ui" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The following Radix-based shadcn components are available in <code>@/components/ui/</code>:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Accordion", "Avatar", "Badge", "Button", "Calendar", "Card",
                    "Carousel", "Checkbox", "Combobox", "Command", "Dialog", "DropdownMenu",
                    "Empty", "Input", "Label", "Popover", "ScrollArea", "Select",
                    "Separator", "Sheet", "Sidebar", "Skeleton", "Sonner", "Spinner",
                    "Switch", "Tabs", "Textarea", "Toggle", "Tooltip"
                  ].map((name) => (
                    <Badge key={name} variant="secondary" className="text-xs py-1 px-2.5">
                      {name}
                    </Badge>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Pre-configured schedule and post preview components in <code>@/components/schedule/</code>:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "calendar-view.tsx", "channel-select-dialog.tsx", "edit-post-dialog.tsx",
                    "ideas-list.tsx", "list-view.tsx", "post-calendar", "preview",
                    "schedule-date-picker.tsx", "schedule-toolbar.tsx"
                  ].map((item) => (
                    <Badge key={item} variant="outline" className="font-mono text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="integrations" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Utilities and libraries configured in <code>@/lib/</code> and <code>@/inngest/</code>:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Inngest background jobs", "Social OAuth helpers", "AES-256 encryption",
                    "Insforge client", "React Big Calendar", "ferrucc-io emoji picker"
                  ].map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 text-center text-sm text-muted-foreground">
        AI Social Media Scheduler &bull; Built with Next.js 16, React 19, Tailwind CSS v4 &amp; shadcn/ui
      </footer>
    </div>
  );
}
