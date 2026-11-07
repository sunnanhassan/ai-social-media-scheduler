"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  CreditCard,
  Lightbulb,
  Plus,
  PlusCircleIcon,
  Settings,
  Sparkles,
} from "lucide-react";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getChannelIcon, getChannelUrl } from "@/constants/channels";
import { ChannelType } from "@/types/channel.type";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { useUser } from "@/lib/auth/auth-context";
import { UserButton } from "@/lib/auth/auth-components";
import ChannelAvatar from "@/components/channel-avatar";
import { useState } from "react";
import CreatePostDialog from "@/components/schedule/create-post-dialog";
import { useSocialConnect } from "@/hooks/use-social-connect";
import { Spinner } from "@/components/ui/spinner";
import { CopilotChatSheet } from "@/components/copilot/copilot-chat-sheet";
import { DEFAULT_MOCK_CHANNELS } from "@/constants/mock-channels";

const mainNav = [
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

const AppSidebar = () => {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user } = useUser();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const { isConnecting, connectingPlatform, connectSocial } = useSocialConnect();

  const { data: channelsData, isLoading } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const res = await fetch("/api/channel");
      if (!res.ok) throw new Error("Failed to fetch channels");
      return res.json();
    },
    placeholderData: {
      channels: DEFAULT_MOCK_CHANNELS as any,
      totalChannels: DEFAULT_MOCK_CHANNELS.length,
      connectedCount: 0,
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const channels = (channelsData?.channels || []) as ChannelType[];
  const unconnectedChannels = channels.filter((channel: ChannelType) => !channel.connected);
  const connectedChannels = channels.filter((channel: ChannelType) => channel.connected);

  const connectedCount = channelsData?.connectedCount || 0;
  const totalChannels = channelsData?.totalChannels || DEFAULT_MOCK_CHANNELS.length;
  const limitedChannels = unconnectedChannels.slice(0, 4);

  const handleConnect = (channel: ChannelType) => {
    if (isConnecting) return;
    connectSocial({ channelTypeId: channel.id, platform: channel.type });
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className={cn("p-4", isCollapsed && "p-2")}>
          <div className="flex items-center justify-between">
            <Logo hideName={isCollapsed} />
            <SidebarTrigger className="hidden md:flex -mx-8 mb-0" />
          </div>
          <Button
            className="mt-4 w-full"
            size={isCollapsed ? "icon" : "lg"}
            onClick={() => setIsCreatePostOpen(true)}
          >
            <Plus className="size-4" />
            {!isCollapsed && <span>New Post</span>}
          </Button>
          <Button
            variant="outline"
            className="mt-2 w-full gap-2 border-primary/40 text-primary hover:bg-primary/10 shadow-2xs"
            size={isCollapsed ? "icon" : "default"}
            onClick={() => setIsCopilotOpen(true)}
            title="Open Autopilot AI Copilot"
          >
            <Sparkles className="size-4 animate-pulse text-primary shrink-0" />
            {!isCollapsed && <span className="text-xs font-semibold">Autopilot Copilot</span>}
          </Button>
        </SidebarHeader>
        <SidebarContent className={cn(!isCollapsed && "px-2")}>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNav.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.name}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Connected channels */}
          {connectedChannels.length > 0 && (
            <SidebarGroup className={cn(isCollapsed && "px-1")}>
              <SidebarGroupLabel className="text-sm">Channels</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {connectedChannels.map((channel: ChannelType) => {
                    const url = getChannelUrl(channel.type);
                    return (
                      <SidebarMenuItem key={channel.id}>
                        <SidebarMenuButton asChild>
                          <a
                            href={`${url}/${channel.handle}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full! relative block items-center gap-2"
                          >
                            <ChannelAvatar
                              size="sm"
                              className="w-full flex items-center gap-2"
                              type={channel.type}
                              color={channel.color}
                              profileImage={channel.profile_image}
                              name={!isCollapsed ? channel.handle || channel.name : ""}
                            />
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Unconnected channels */}
          <SidebarGroup className={cn(isCollapsed && "px-1")}>
            <SidebarGroupLabel className="text-sm">Connect Channels</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {channels.length === 0 && isLoading ? (
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-8 w-full bg-muted/60" />
                    <Skeleton className="h-8 w-full bg-muted/60" />
                    <Skeleton className="h-8 w-full bg-muted/60" />
                    <Skeleton className="h-8 w-full bg-muted/60" />
                  </div>
                ) : (
                  <>
                    {limitedChannels.map((channel: ChannelType) => {
                      const icon = getChannelIcon(channel.type);
                      return (
                        <SidebarMenuItem key={channel.id}>
                          <SidebarMenuButton
                            asChild
                            tooltip={`Connect ${channel.name}`}
                          >
                            <button
                              className="w-full flex items-center justify-between gap-2"
                              disabled={isConnecting}
                              onClick={() => handleConnect(channel)}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span>
                                  <div className="relative">
                                    {icon ? (
                                      <HugeiconsIcon
                                        icon={icon}
                                        color="currentColor"
                                        className="text-white! size-6! p-1 rounded-sm"
                                        style={{ background: channel.color }}
                                      />
                                    ) : null}

                                    <div className="absolute -right-1 bottom-0 p-0.5 bg-white dark:bg-background rounded-xs">
                                      <HugeiconsIcon icon={PlusSignIcon} className="size-2!" />
                                    </div>
                                  </div>
                                </span>
                                <span className="truncate">{channel.name}</span>
                              </div>
                              {isConnecting && (connectingPlatform === channel.id || connectingPlatform === channel.type) && (
                                <Spinner className="size-3 shrink-0" />
                              )}
                            </button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Button asChild variant="ghost" className="w-full justify-start mt-1">
                          <Link href="/settings" className="w-full flex items-center gap-2">
                            <PlusCircleIcon className="size-4" />
                            <span className="text-sm">More channels</span>
                          </Link>
                        </Button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="mb-3 text-xs text-muted-foreground">
            <span>
              {connectedCount}/{totalChannels} channels connected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UserButton
              showName={false}
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
            <span className="text-sm truncate max-w-[150px]">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress || "OmniPost Creator"}
            </span>
          </div>
        </SidebarFooter>
      </Sidebar>

      {isCreatePostOpen && (
        <CreatePostDialog
          open={isCreatePostOpen}
          onOpenChange={setIsCreatePostOpen}
        />
      )}
      {isCopilotOpen && (
        <CopilotChatSheet
          open={isCopilotOpen}
          onOpenChange={setIsCopilotOpen}
        />
      )}
    </>
  );
};

export default AppSidebar;
