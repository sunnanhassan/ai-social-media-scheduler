"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export type ConnectSocialOptions =
  | string
  | {
      platform?: string;
      channelTypeId?: string;
      redirectTo?: string;
    };

export interface UseSocialConnectReturn {
  isConnecting: boolean;
  connectingPlatform: string | null;
  connectSocial: (options: ConnectSocialOptions, redirectTo?: string) => Promise<void>;
}

const ERROR_MESSAGES: Record<string, string> = {
  cancelled: "Account authorization was cancelled.",
  access_denied: "Permission was denied by the social provider.",
  missing_state: "Security verification failed (missing state).",
  invalid_state: "Security verification failed (invalid signature).",
  state_expired: "Connection session timed out. Please try again.",
  user_mismatch: "User account mismatch detected.",
  missing_pkce_verifier: "Security verifier missing. Please try again.",
  failed_to_save_channel: "Database error while saving account details.",
  oauth_callback_failed: "Failed to complete social account connection.",
};

export function useSocialConnect(): UseSocialConnectReturn {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Handle callback notifications from query parameters
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const platform = params.get("platform");
    const handle = params.get("handle");
    const error = params.get("error");

    if (connected === "true") {
      const platformName = platform ? platform.charAt(0) + platform.slice(1).toLowerCase() : "Account";
      const handleText = handle ? ` (@${handle.replace(/^@/, "")})` : "";
      toast.success(`${platformName}${handleText} connected successfully!`);

      // Invalidate queries so channels and UI reflect live state
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      queryClient.invalidateQueries({ queryKey: ["social-channels"] });

      // Clean up search parameters without full reload
      params.delete("connected");
      params.delete("platform");
      params.delete("handle");
      const cleanSearch = params.toString();
      const newUrl = cleanSearch ? `${window.location.pathname}?${cleanSearch}` : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    } else if (connected === "false" || error) {
      const friendlyMsg = (error && ERROR_MESSAGES[error]) || error || "Failed to connect social account.";
      toast.error(friendlyMsg);

      params.delete("connected");
      params.delete("error");
      params.delete("description");
      const cleanSearch = params.toString();
      const newUrl = cleanSearch ? `${window.location.pathname}?${cleanSearch}` : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [queryClient, router]);

  const connectSocial = useCallback(
    async (options: ConnectSocialOptions, customRedirect?: string) => {
      try {
        let platform: string | undefined;
        let channelTypeId: string | undefined;
        let redirectTo = customRedirect;

        if (typeof options === "string") {
          const isUuidOrId = /^[0-9a-fA-F-]+$/.test(options) && options.includes("-");
          if (isUuidOrId) {
            channelTypeId = options;
          } else {
            platform = options.toUpperCase();
          }
        } else {
          platform = options.platform?.toUpperCase();
          channelTypeId = options.channelTypeId;
          redirectTo = options.redirectTo || customRedirect;
        }

        const identifier = platform || channelTypeId || "social";
        setIsConnecting(true);
        setConnectingPlatform(identifier);

        const res = await fetch("/api/social/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform,
            channelTypeId,
            redirectTo: redirectTo || (typeof window !== "undefined" ? window.location.href : undefined),
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.url) {
          throw new Error(data.error || `Failed to initiate ${identifier} connection`);
        }

        // Navigate to provider OAuth consent page
        window.location.href = data.url;
      } catch (err: any) {
        console.error("Social connect error:", err);
        toast.error(err.message || "Failed to initiate social login.");
        setIsConnecting(false);
        setConnectingPlatform(null);
      }
    },
    []
  );


  return {
    isConnecting,
    connectingPlatform,
    connectSocial,
  };
}
