import { InstagramIcon, NewTwitterIcon, FacebookIcon, TiktokIcon, ThreadsIcon, YoutubeIcon, LinkedinIcon, BlueskyIcon } from '@hugeicons/core-free-icons'

export const ChannelTypeEnum = {
  TWITTER: "TWITTER",
  INSTAGRAM: "INSTAGRAM",
  THREADS: "THREADS",
  FACEBOOK: "FACEBOOK",
  LINKEDIN: "LINKEDIN",
  BLUESKY: "BLUESKY",
  YOUTUBE: "YOUTUBE",
  TIKTOK: "TIKTOK",
} as const;

export type ChannelTypeEnum = (typeof ChannelTypeEnum)[keyof typeof ChannelTypeEnum];

export const CHANNEL_TYPE_ICONS: Record<ChannelTypeEnum, any> = {
  [ChannelTypeEnum.TWITTER]: NewTwitterIcon,
  [ChannelTypeEnum.LINKEDIN]: LinkedinIcon,
  [ChannelTypeEnum.INSTAGRAM]: InstagramIcon,
  [ChannelTypeEnum.THREADS]: ThreadsIcon,
  [ChannelTypeEnum.FACEBOOK]: FacebookIcon,
  [ChannelTypeEnum.BLUESKY]: BlueskyIcon,
  [ChannelTypeEnum.YOUTUBE]: YoutubeIcon,
  [ChannelTypeEnum.TIKTOK]: TiktokIcon,
}

export const CHANNEL_TYPE_URLS: Record<ChannelTypeEnum, string> = {
  [ChannelTypeEnum.TWITTER]: "https://x.com",
  [ChannelTypeEnum.LINKEDIN]: "https://linkedin.com",
  [ChannelTypeEnum.INSTAGRAM]: "https://instagram.com",
  [ChannelTypeEnum.THREADS]: "https://threads.com",
  [ChannelTypeEnum.FACEBOOK]: "https://facebook.com",
  [ChannelTypeEnum.BLUESKY]: "https://bluesky.com",
  [ChannelTypeEnum.YOUTUBE]: "https://youtube.com",
  [ChannelTypeEnum.TIKTOK]: "https://tiktok.com",
}


export function getChannelUrl(type: ChannelTypeEnum | undefined) {
  if (!type) return ""
  return CHANNEL_TYPE_URLS[type]
}


export function getChannelIcon(type: ChannelTypeEnum | undefined) {
  if (!type) return null
  return CHANNEL_TYPE_ICONS[type]
}

export function formatChannelHandle(
  type: ChannelTypeEnum | string | undefined,
  handle: string | null | undefined
): string {
  if (!handle) return ""
  const clean = handle.trim()
  const normalizedType = type?.toString().toUpperCase()
  if (
    normalizedType === ChannelTypeEnum.FACEBOOK ||
    normalizedType === ChannelTypeEnum.LINKEDIN
  ) {
    return clean.replace(/^@+/, "")
  }
  return clean.startsWith("@") ? clean : `@${clean}`
}

export function getChannelProfileUrl(channel: {
  type?: ChannelTypeEnum | string
  handle?: string | null
  profile_url?: string | null
  user_channel_id?: string | null
  id?: string | null
}): string {
  if (channel.profile_url) {
    const rawUrl = channel.profile_url.trim()
    const isBadUrl =
      rawUrl.includes(" ") ||
      (channel.type === ChannelTypeEnum.FACEBOOK && rawUrl.includes("/@")) ||
      (channel.type === ChannelTypeEnum.LINKEDIN && rawUrl.includes("/@"))
    if (!isBadUrl && rawUrl.startsWith("http")) {
      return rawUrl
    }
  }

  const type = (channel.type?.toString().toUpperCase() || "") as ChannelTypeEnum
  const baseUrl = getChannelUrl(type)
  const cleanHandle = channel.handle?.replace(/^@+/, "").trim() || ""

  switch (type) {
    case ChannelTypeEnum.FACEBOOK: {
      const pageId = (channel.user_channel_id || channel.id || "").replace(/^uc-facebook-/, "")
      if (pageId && /^\d+$/.test(pageId)) {
        return `https://facebook.com/${pageId}`
      }
      return cleanHandle ? `https://facebook.com/${cleanHandle.replace(/\s+/g, "")}` : "https://facebook.com"
    }
    case ChannelTypeEnum.LINKEDIN: {
      return cleanHandle
        ? `https://linkedin.com/in/${cleanHandle.toLowerCase().replace(/\s+/g, "-")}`
        : "https://linkedin.com"
    }
    case ChannelTypeEnum.TWITTER: {
      return cleanHandle ? `https://x.com/${cleanHandle}` : "https://x.com"
    }
    case ChannelTypeEnum.YOUTUBE: {
      return cleanHandle ? `https://youtube.com/@${cleanHandle}` : "https://youtube.com"
    }
    case ChannelTypeEnum.TIKTOK: {
      return cleanHandle ? `https://tiktok.com/@${cleanHandle}` : "https://tiktok.com"
    }
    case ChannelTypeEnum.INSTAGRAM: {
      return cleanHandle ? `https://instagram.com/${cleanHandle}` : "https://instagram.com"
    }
    case ChannelTypeEnum.THREADS: {
      return cleanHandle ? `https://threads.net/@${cleanHandle}` : "https://threads.com"
    }
    case ChannelTypeEnum.BLUESKY: {
      return cleanHandle ? `https://bsky.app/profile/${cleanHandle}` : "https://bluesky.com"
    }
    default:
      return baseUrl ? `${baseUrl}/${cleanHandle}` : "#"
  }
}
