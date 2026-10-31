import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "lemon-ai-social-scheduling",
  isDev: process.env.NODE_ENV === "development",
});
