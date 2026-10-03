"use client";

import React from "react";
import { PostType } from "@/types/post.type";
import { IPhoneFrame } from "./preview/iphone-frame";
import { TwitterPreview } from "./preview/twitter-preview";
import { LinkedinPreview } from "./preview/linkedin-preview";
import { InstagramPreview } from "./preview/instagram-preview";
import { FacebookPreview } from "./preview/facebook-preview";
import { Button } from "@/components/ui/button";
import { Edit3, Send, Sparkles, Smartphone, Calendar, Eye } from "lucide-react";
import { ChannelTypeEnum } from "@/constants/channels";

interface LiveMobilePreviewProps {
  post: PostType | null;
  onEditPost?: (post: PostType) => void;
  onPublishNow?: (post: PostType) => void;
  onAIPolish?: (post: PostType) => void;
  className?: string;
}

export function LiveMobilePreview({
  post,
  onEditPost,
  onPublishNow,
  onAIPolish,
  className = "",
}: LiveMobilePreviewProps) {
  const channelType = post?.user_channels?.channel_types?.type?.toLowerCase() || ChannelTypeEnum.TWITTER;
  const channelName = post?.user_channels?.channel_types?.name || "Social Preview";
  const handle = post?.user_channels?.handle || "creator";
  const profileImage = post?.user_channels?.profile_image || "";
  const imageUrls = post?.images?.map((img) => img.url) || [];

  const renderSocialFeed = () => {
    if (!post) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[380px] text-center p-6 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
            <Smartphone className="size-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold tracking-tight text-foreground">
              Live Mobile Preview
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Click any post in your pipeline to see exactly how it appears to your mobile audience.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 text-[11px] font-mono text-muted-foreground border border-border/50">
            <Eye className="size-3 text-primary" />
            <span>Interactive Device Simulator</span>
          </div>
        </div>
      );
    }

    switch (channelType) {
      case ChannelTypeEnum.TWITTER:
        return (
          <TwitterPreview
            text={post.content}
            images={imageUrls}
            handle={handle}
            profileImage={profileImage}
          />
        );
      case ChannelTypeEnum.LINKEDIN:
        return (
          <LinkedinPreview
            text={post.content}
            images={imageUrls}
            handle={handle}
            profileImage={profileImage}
          />
        );
      case ChannelTypeEnum.INSTAGRAM:
        return <InstagramPreview text={post.content} images={imageUrls} />;
      case ChannelTypeEnum.FACEBOOK:
        return <FacebookPreview text={post.content} images={imageUrls} />;
      default:
        return (
          <TwitterPreview
            text={post.content}
            images={imageUrls}
            handle={handle}
            profileImage={profileImage}
          />
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-start space-y-3.5 select-none ${className}`}>
      {/* Device Frame */}
      <IPhoneFrame platformName={post ? channelName : "OmniPost Simulator"}>
        {renderSocialFeed()}
      </IPhoneFrame>

      {/* Floating Action Controls */}
      {post && (
        <div className="w-[340px] bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl p-2.5 shadow-xl flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditPost?.(post)}
            className="flex-1 text-xs gap-1.5 h-8 border-border/60 hover:bg-accent/40"
          >
            <Edit3 className="size-3.5 text-muted-foreground" />
            Edit
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onAIPolish?.(post)}
            className="flex-1 text-xs gap-1.5 h-8 border-border/60 hover:border-primary/50 text-foreground"
          >
            <Sparkles className="size-3.5 text-primary" />
            AI Polish
          </Button>

          {post.status !== "published" && (
            <Button
              size="sm"
              onClick={() => onPublishNow?.(post)}
              className="flex-1 text-xs gap-1.5 h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
            >
              <Send className="size-3.5" />
              Publish
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
