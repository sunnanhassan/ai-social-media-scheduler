"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChannelType } from "@/types/channel.type";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { getChannelIcon } from "@/constants/channels";
import { HugeiconsIcon } from "@hugeicons/react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { useSocialConnect } from "@/hooks/use-social-connect";
import { DEFAULT_MOCK_CHANNELS, DEFAULT_PLATFORMS } from "@/constants/mock-channels";
import ChannelAvatar from "../channel-avatar";
import { Badge } from "../ui/badge";

function ChannelTabContent() {
  const queryClient = useQueryClient();
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

  const disconnectMutation = useMutation({
    mutationFn: async (userChannelId: string) => {
      const res = await fetch("/api/channel/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userChannelId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to disconnect account");
      return data;
    },
    onSuccess: () => {
      toast.success("Account disconnected successfully");
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
    onError: (error: Error) => {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect account");
    },
  });

  const handleConnect = (platformId: string, platformType: any) => {
    if (isConnecting) return;
    connectSocial({ channelTypeId: platformId, platform: platformType });
  };

  const handleDisconnect = (userChannelId: string) => {
    if (!userChannelId || disconnectMutation.isPending) return;
    disconnectMutation.mutate(userChannelId);
  };

  const platformGroups = useMemo(() => {
    return DEFAULT_PLATFORMS.map((platform) => {
      const accounts = channels.filter(
        (c) => c.connected && (c.type === platform.type || c.channel_type_id === platform.id)
      );
      return {
        ...platform,
        accounts,
      };
    });
  }, [channels]);

  return (
    <Card className="border-border shadow-xs">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Channels & Accounts</CardTitle>
        <CardDescription>
          Connect and manage multiple accounts per platform (e.g. multiple YouTube channels or TikTok profiles).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && channels.length === 0 ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-md bg-muted/60" />
                <Skeleton className="h-5 w-32 bg-muted/60" />
              </div>
              <Skeleton className="h-8 w-24 bg-muted/60" />
            </div>
          ))
        ) : (
          platformGroups.map((platform) => {
            const icon = getChannelIcon(platform.type);
            const hasAccounts = platform.accounts.length > 0;
            const isPlatformConnecting =
              isConnecting && (connectingPlatform === platform.id || connectingPlatform === platform.type);

            return (
              <div
                key={platform.id}
                className="rounded-xl border border-border/80 bg-card/60 p-4 transition-all hover:border-border"
              >
                {/* Platform Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="relative">
                      {icon && (
                        <HugeiconsIcon
                          icon={icon}
                          color="currentColor"
                          className="text-white! size-7! p-1.5 rounded-md shadow-2xs"
                          style={{ background: platform.color }}
                        />
                      )}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{platform.name}</span>
                        {hasAccounts && (
                          <Badge variant="secondary" className="text-[11px] font-mono px-1.5 py-0">
                            {platform.accounts.length} {platform.accounts.length === 1 ? "account" : "accounts"}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Limit: {platform.character_limit.toLocaleString()} chars
                      </span>
                    </div>
                  </div>

                  <Button
                    variant={hasAccounts ? "outline" : "default"}
                    size="sm"
                    className="gap-1.5"
                    disabled={isConnecting}
                    onClick={() => handleConnect(platform.id, platform.type)}
                  >
                    {isPlatformConnecting ? (
                      <Spinner className="size-3.5" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    <span>{hasAccounts ? "Add Another Account" : "Connect Account"}</span>
                  </Button>
                </div>

                {/* Connected Accounts List */}
                {hasAccounts ? (
                  <div className="pt-3 space-y-2">
                    {platform.accounts.map((acc) => {
                      const isAccDisconnecting =
                        disconnectMutation.isPending && disconnectMutation.variables === (acc.id || acc.user_channel_id);

                      return (
                        <div
                          key={acc.id}
                          className="flex items-center justify-between rounded-lg bg-background/80 border border-border/60 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ChannelAvatar
                              size="sm"
                              type={acc.type}
                              color={acc.color}
                              profileImage={acc.profile_image}
                              name={acc.handle || acc.name}
                            />
                            <div className="min-w-0">
                              <span className="font-medium text-foreground block truncate">
                                {acc.handle || acc.name || "Connected Profile"}
                              </span>
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 h-8 gap-1 px-2.5"
                            disabled={isAccDisconnecting}
                            onClick={() => handleDisconnect(acc.id || acc.user_channel_id!)}
                          >
                            {isAccDisconnecting ? (
                              <Spinner className="size-3" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                            <span className="text-xs">Disconnect</span>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="pt-2.5 text-xs text-muted-foreground flex items-center justify-between">
                    <span>No {platform.name} account connected yet.</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default function ChannelsTab() {
  return <ChannelTabContent />;
}
