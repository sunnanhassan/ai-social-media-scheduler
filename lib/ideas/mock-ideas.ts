export interface IdeaItem {
  id: string;
  title: string;
  description?: string;
  images?: any[];
  columnId: string;
  sortOrder?: number;
}

export interface IdeaGroup {
  id: string;
  title: string;
  ideas: IdeaItem[];
}

export const DEFAULT_MOCK_GROUPS: IdeaGroup[] = [
  {
    id: "col-backlog",
    title: "Backlog",
    ideas: [
      {
        id: "idea-1",
        title: "Product Launch Announcement",
        description:
          "Thread breaking down the core value proposition, AI scheduler features, and early access discount.",
        images: [
          {
            url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=80",
            path: "mock/launch.png",
          },
        ],
        columnId: "col-backlog",
        sortOrder: 1000,
      },
      {
        id: "idea-2",
        title: "5 Lessons from Building in Public",
        description:
          "Share lessons learned about multi-platform OAuth, rate-limiting queues, and design systems.",
        images: [],
        columnId: "col-backlog",
        sortOrder: 2000,
      },
    ],
  },
  {
    id: "col-progress",
    title: "In Progress",
    ideas: [
      {
        id: "idea-3",
        title: "Micro-SaaS Tech Stack Comparison",
        description:
          "Infographic comparing Next.js 16 App Router vs Vite SPA for SaaS applications.",
        images: [
          {
            url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80",
            path: "mock/stats.png",
          },
        ],
        columnId: "col-progress",
        sortOrder: 1000,
      },
    ],
  },
  {
    id: "col-ready",
    title: "Ready to Schedule",
    ideas: [
      {
        id: "idea-4",
        title: "Weekly Growth Metric Roundup",
        description:
          "Recap our +240% engagement surge after shifting to automated timing optimization.",
        images: [],
        columnId: "col-ready",
        sortOrder: 1000,
      },
    ],
  },
  {
    id: "col-done",
    title: "Published / Archived",
    ideas: [
      {
        id: "idea-5",
        title: "Customer Milestone Celebration",
        description:
          "A huge thank you to our first 1,000 active creators on the platform!",
        images: [],
        columnId: "col-done",
        sortOrder: 1000,
      },
    ],
  },
];

// Persistent global fallback memory for seamless offline / mock edits
const GLOBAL_IDEAS_STORE_KEY = Symbol.for("insforge.mock.ideas.store");
const globalScope = globalThis as unknown as {
  [GLOBAL_IDEAS_STORE_KEY]?: IdeaGroup[];
};

export function getInMemoryMockGroups(): IdeaGroup[] {
  if (!globalScope[GLOBAL_IDEAS_STORE_KEY]) {
    globalScope[GLOBAL_IDEAS_STORE_KEY] = JSON.parse(
      JSON.stringify(DEFAULT_MOCK_GROUPS)
    );
  }
  return globalScope[GLOBAL_IDEAS_STORE_KEY]!;
}

export function resetInMemoryMockGroups(): void {
  globalScope[GLOBAL_IDEAS_STORE_KEY] = JSON.parse(
    JSON.stringify(DEFAULT_MOCK_GROUPS)
  );
}

