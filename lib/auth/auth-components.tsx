"use client";

import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, Sparkles, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppUser } from "./auth-context";

export function AppUserButton({
  showName,
  appearance,
}: {
  showName?: boolean;
  appearance?: any;
} = {}) {
  const { user } = useAppUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex items-center gap-2 rounded-full ring-2 ring-border hover:ring-primary focus:outline-none transition-all p-0.5"
        >
          <Avatar className="size-8">
            <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {user?.firstName?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          {showName && user && (
            <span className="text-sm font-medium pr-2 text-foreground">
              {user.fullName}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-lg">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground leading-none">
              {user?.primaryEmailAddress.emailAddress}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/billing" className="cursor-pointer">
            <Sparkles className="mr-2 h-4 w-4" />
            <span>Manage Plan</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={() => console.log("Demo sign out")}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppUserProfile({ appearance }: { appearance?: any } = {}) {
  const { user } = useAppUser();

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs max-w-xl">
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="size-16">
          <AvatarImage src={user?.imageUrl} />
          <AvatarFallback className="text-lg bg-primary/10 text-primary">
            {user?.firstName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{user?.fullName}</h3>
          <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress.emailAddress}</p>
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <div className="flex justify-between py-2 border-b border-border/60">
          <span className="text-muted-foreground">User ID</span>
          <span className="font-mono text-xs text-foreground">{user?.id}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-border/60">
          <span className="text-muted-foreground">Account Status</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Active (Demo Mode)</span>
        </div>
        <div className="pt-2 flex justify-end gap-2">
          <Button variant="outline" size="sm">Edit Profile</Button>
          <Button size="sm">Save Changes</Button>
        </div>
      </div>
    </div>
  );
}

export function AppSignIn({ path = "/sign-in", signUpUrl = "/sign-up" }: { path?: string; signUpUrl?: string; forceRedirectUrl?: string }) {
  return (
    <Card className="w-full max-w-md border-border bg-card shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold">Welcome Back</CardTitle>
        <CardDescription>Sign in to your AI Social Media Scheduler account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs text-primary text-center">
          Demo mode active: Instant 1-click access without external API keys
        </div>
        <Button className="w-full" size="lg" asChild>
          <Link href="/schedule">
            Continue as Sunnan Hassan <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
      <CardFooter className="justify-center border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href={signUpUrl} className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export function AppSignUp({ path = "/sign-up", signInUrl = "/sign-in" }: { path?: string; signInUrl?: string; forceRedirectUrl?: string }) {
  return (
    <Card className="w-full max-w-md border-border bg-card shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold">Create Account</CardTitle>
        <CardDescription>Start planning and automating your social posts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs text-primary text-center">
          Demo mode active: Instant 1-click access without external API keys
        </div>
        <Button className="w-full" size="lg" asChild>
          <Link href="/schedule">
            Start Free in Demo Mode <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
      <CardFooter className="justify-center border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href={signInUrl} className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export function AppPricingTable({ for: target = "user" }: { for?: string; newSubscriptionRedirectUrl?: string }) {
  const tiers = [
    {
      name: "Starter",
      price: "$19",
      desc: "For creators starting their social media consistency journey",
      features: ["3 Social Channels", "30 Scheduled Posts/mo", "Basic AI Copywriter", "Community Support"],
      cta: "Current Plan",
      current: false,
    },
    {
      name: "Pro",
      price: "$49",
      desc: "For serious creators and growing brands scaling across all platforms",
      features: ["All 8 Social Channels", "Unlimited Scheduled Posts", "Advanced AI Idea & Post Generator", "Priority Publishing Queue", "Analytics Overview"],
      cta: "Active Plan",
      current: true,
    },
    {
      name: "Agency",
      price: "$99",
      desc: "For agencies and multi-brand managers needing team collaboration",
      features: ["Unlimited Channels", "Unlimited Team Seats", "Custom Post Timing Schedules", "Dedicated Account Manager"],
      cta: "Upgrade to Agency",
      current: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
      {tiers.map((tier) => (
        <Card
          key={tier.name}
          className={`flex flex-col border transition-all ${
            tier.current
              ? "border-primary shadow-md ring-2 ring-primary/20 bg-card"
              : "border-border bg-card/60 hover:border-border/80"
          }`}
        >
          <CardHeader>
            <div className="flex justify-between items-center mb-1">
              <CardTitle className="text-lg font-semibold">{tier.name}</CardTitle>
              {tier.current && <Badge className="bg-primary text-primary-foreground text-xs">Active</Badge>}
            </div>
            <div className="flex items-baseline gap-1 my-2">
              <span className="text-3xl font-bold text-foreground">{tier.price}</span>
              <span className="text-xs text-muted-foreground">/month</span>
            </div>
            <CardDescription className="text-xs leading-relaxed">{tier.desc}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-2.5 text-xs">
            {tier.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-foreground/90">
                <Check className="size-3.5 text-primary shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </CardContent>
          <CardFooter className="pt-4 border-t border-border/50">
            <Button
              className="w-full"
              variant={tier.current ? "default" : "outline"}
              size="sm"
            >
              {tier.cta}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export function AppClerkLoaded({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function AppClerkLoading({ children }: { children: React.ReactNode }) {
  return null;
}

export {
  AppUserButton as UserButton,
  AppUserProfile as UserProfile,
  AppSignIn as SignIn,
  AppSignUp as SignUp,
  AppPricingTable as PricingTable,
  AppClerkLoaded as ClerkLoaded,
  AppClerkLoading as ClerkLoading,
};
