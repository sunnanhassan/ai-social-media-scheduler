"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/lib/auth/auth-context";
import { UserProfile } from "@/lib/auth/auth-components";
import { Layers, Palette, User, Key, ShieldCheck, Copy, Check } from "lucide-react";
import ChannelsTab from "@/components/settings/channels-tab";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

const SettingsPage = () => {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText("sk_live_sm_scheduler_9a8f27b3e10c");
    setCopiedKey(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-2">
      {/* Header Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Workspace
            </span>
            <span className="text-muted-foreground/40 font-mono text-xs">/</span>
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              Settings & Integrations
            </h1>
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Configure your workspace, social accounts, and developer credentials.
          </p>
        </div>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <div className="border-b border-border/70">
          <TabsList variant="line" className="w-fit space-x-2 h-10 bg-transparent p-0">
            <TabsTrigger
              value="channels"
              className="gap-2 text-xs font-mono data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              <Layers className="size-3.5" />
              Connected Channels
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="gap-2 text-xs font-mono data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              <User className="size-3.5" />
              Account Profile
            </TabsTrigger>
            <TabsTrigger
              value="developer"
              className="gap-2 text-xs font-mono data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              <Key className="size-3.5" />
              API & Webhooks
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="gap-2 text-xs font-mono data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              <Palette className="size-3.5" />
              Appearance
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Channels Tab */}
        <TabsContent value="channels">
          <ChannelsTab />
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold">Your Profile</CardTitle>
              <CardDescription className="text-xs">
                Manage your credentials, name, and identity settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/20 border border-border/60">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt="Profile"
                    className="h-12 w-12 rounded-full border border-border"
                    width={48}
                    height={48}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="size-6" />
                  </div>
                )}

                <div>
                  <p className="font-medium text-sm text-foreground">{user?.fullName || "User"}</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>

              <div>
                <UserProfile
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "border-0 shadow-none bg-transparent",
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Developer Tab */}
        <TabsContent value="developer">
          <div className="grid gap-4">
            <Card className="border-border/80 bg-card shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Developer API Keys</CardTitle>
                <CardDescription className="text-xs">
                  Authenticate custom integrations, external posting scripts, or mobile clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value="sk_live_sm_scheduler_9a8f27b3e10c"
                    type="password"
                    className="font-mono text-xs h-8 max-w-md bg-muted/30"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs font-mono cursor-pointer"
                    onClick={handleCopyApiKey}
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey ? "Copied" : "Copy Key"}
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Key scope: Full workspace post & channel access</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Inngest Background Worker</CardTitle>
                <CardDescription className="text-xs">
                  Event-driven background queues and cron triggers for scheduled publications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/20 border border-border/60">
                  <span className="font-mono text-muted-foreground">Endpoint:</span>
                  <span className="font-mono text-foreground">/api/inngest</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/20 border border-border/60">
                  <span className="font-mono text-muted-foreground">Worker Status:</span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Healthy & Listening
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Appearance & Theme</CardTitle>
              <CardDescription className="text-xs">
                Customize the UI theme and visual density
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/60">
                <div className="space-y-0.5">
                  <Label htmlFor="theme" className="text-xs font-medium">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Switch between High-Efficiency Light and Night Black Dark Theme
                  </p>
                </div>
                <Switch
                  id="theme"
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;