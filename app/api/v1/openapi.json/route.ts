export async function GET(request: Request | any) {
  const origin =
    request.headers.get("x-forwarded-host")
      ? `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("x-forwarded-host")}`
      : request.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const spec = {
    openapi: "3.0.3",
    info: {
      title: "OmniPost AI Social Media Scheduler API",
      version: "1.0.0",
      description:
        "Programmatic REST API for managing social accounts, creating and scheduling multi-channel posts (Twitter/X, LinkedIn), fetching performance analytics, and generating viral hooks directly from ChatGPT Actions and AI agents.",
      contact: {
        name: "OmniPost Support",
        email: "support@omnipost.ai",
      },
    },
    servers: [
      {
        url: `${origin}/api/v1`,
        description: "Active OmniPost API Gateway",
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
    paths: {
      "/channels": {
        get: {
          summary: "List Connected Social Channels",
          operationId: "listChannels",
          description:
            "Returns the list of active social channels connected to the user's account (e.g. Twitter, LinkedIn) along with their character limits and handles.",
          responses: {
            "200": {
              description: "List of active channels",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      channels: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            type: { type: "string", enum: ["TWITTER", "LINKEDIN", "INSTAGRAM", "FACEBOOK"] },
                            name: { type: "string" },
                            handle: { type: "string" },
                            characterLimit: { type: "integer" },
                            connected: { type: "boolean" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthorized - Invalid or missing Bearer key" },
            "429": { description: "Rate limit exceeded" },
          },
        },
      },
      "/posts": {
        get: {
          summary: "List Posts and Calendar Items",
          operationId: "listPosts",
          description: "Fetches user's scheduled, queued, drafted, or published posts with optional status and channel filtering.",
          parameters: [
            {
              name: "status",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["queue", "draft", "published", "failed"] },
              description: "Filter by lifecycle status",
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", default: 20 },
              description: "Maximum posts to return (max 50)",
            },
          ],
          responses: {
            "200": {
              description: "Array of post records",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      posts: { type: "array", items: { type: "object" } },
                      total: { type: "integer" },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthorized" },
          },
        },
        post: {
          summary: "Create and Schedule a Post",
          operationId: "createPost",
          description: "Schedules a new post across designated channels with exact-time dispatch. Supports optional first comment.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["content", "scheduledAt"],
                  properties: {
                    content: {
                      type: "string",
                      description: "The main text body of the social post.",
                    },
                    channels: {
                      type: "array",
                      items: { type: "string", enum: ["TWITTER", "LINKEDIN", "INSTAGRAM", "FACEBOOK"] },
                      description: "List of target channels (defaults to all connected channels).",
                    },
                    scheduledAt: {
                      type: "string",
                      format: "date-time",
                      description: "ISO 8601 target schedule time (must be at least 2 minutes in the future).",
                    },
                    firstComment: {
                      type: "string",
                      description: "Optional URL or CTA to post automatically 15 seconds after publish.",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Post scheduled successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      id: { type: "string" },
                      status: { type: "string" },
                      scheduledAt: { type: "string" },
                      channels: { type: "array", items: { type: "string" } },
                    },
                  },
                },
              },
            },
            "400": { description: "Bad request (past date, empty text, or unconnected channel)" },
            "401": { description: "Unauthorized" },
            "422": { description: "Character limit overflow for target platform" },
            "429": { description: "Rate limit exceeded" },
          },
        },
      },
      "/posts/{id}": {
        get: {
          summary: "Get Single Post Details",
          operationId: "getPost",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Post object retrieved" },
            "404": { description: "Post not found" },
          },
        },
        delete: {
          summary: "Cancel and Delete Scheduled Post",
          operationId: "deletePost",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Post cancelled successfully" },
            "404": { description: "Post not found" },
          },
        },
      },
      "/analytics": {
        get: {
          summary: "Get Social Media Performance Analytics",
          operationId: "getAnalytics",
          description: "Returns reach, likes, comments, engagement rates, top channel, and peak posting times.",
          parameters: [
            {
              name: "range",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["7d", "30d", "90d"], default: "30d" },
            },
          ],
          responses: {
            "200": { description: "Analytics snapshot and ranked top posts" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/posts/viral-hooks": {
        post: {
          summary: "Generate 3 High-Impact Viral Hooks",
          operationId: "generateViralHooks",
          description: "Analyzes content and suggests 3 viral opening lines: Curiosity Gap, Bold Stance, and Result/Story.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["content"],
                  properties: {
                    content: { type: "string", description: "Post draft or idea topic" },
                    channelType: { type: "string", enum: ["TWITTER", "LINKEDIN"] },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "3 viral hook alternatives",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      hooks: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            angle: { type: "string" },
                            title: { type: "string" },
                            hook: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API Key (op_live_...)",
          description: "Provide your OmniPost API Key obtained from Settings -> API Keys.",
        },
      },
    },
  };

  return Response.json(spec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
