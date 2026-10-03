import type { ImageObject } from "@/types/post.type";

export interface PublishContext {
  accessToken: string;
  content: string;
  handle?: string | null;
  authorId?: string | null;
  images?: ImageObject[];
  logger?: any;
}

export interface PublishResult {
  publishedUrl: string | null;
  providerPostId?: string | null;
}
