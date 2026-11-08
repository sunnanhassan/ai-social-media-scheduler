import type { WorkspaceItem } from "../types/workspace.type.ts";

export const DEFAULT_MOCK_WORKSPACES: WorkspaceItem[] = [
  {
    id: "ws-default-brand",
    name: "Personal Brand",
    slug: "personal-brand",
    color: "#10B981", // Emerald
    icon: "user",
    is_default: true,
    channel_count: 3,
    ai_persona: {
      tone: "thoughtful, authentic, educator",
      industry: "tech & software development",
      target_audience: "developers and founders",
    },
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "ws-saas-brand",
    name: "OmniPost SaaS",
    slug: "omnipost-saas",
    color: "#6366F1", // Indigo
    icon: "briefcase",
    is_default: false,
    channel_count: 2,
    ai_persona: {
      tone: "high-signal, professional, product-driven",
      industry: "social media automation",
      target_audience: "creators, agencies, marketing teams",
    },
    created_at: "2026-01-02T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
  },
  {
    id: "ws-gaming-brand",
    name: "Gaming & Clips",
    slug: "gaming-clips",
    color: "#EC4899", // Pink
    icon: "gamepad",
    is_default: false,
    channel_count: 1,
    ai_persona: {
      tone: "high-energy, viral, meme-aware",
      industry: "gaming and entertainment",
      target_audience: "gen-z gamers and clip viewers",
    },
    created_at: "2026-01-03T00:00:00Z",
    updated_at: "2026-01-03T00:00:00Z",
  },
];

export function getMockWorkspaceById(id: string | null | undefined): WorkspaceItem {
  if (!id) return DEFAULT_MOCK_WORKSPACES[0];
  const found = DEFAULT_MOCK_WORKSPACES.find((w) => w.id === id);
  return found || DEFAULT_MOCK_WORKSPACES[0];
}
