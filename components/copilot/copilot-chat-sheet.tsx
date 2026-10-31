"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Bot, Send, User, Sparkles, CheckCircle2, Calendar, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface CopilotChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: Array<{ tool: string; result: any }>;
}

const QUICK_PROMPTS = [
  "Plan 3 posts for this week",
  "Check my idea backlog and draft 2 posts",
  "Are there any empty schedule slots this week?",
  "Draft a punchy Twitter hook for my product",
];

export function CopilotChatSheet({ open, onOpenChange }: CopilotChatSheetProps) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-msg",
      role: "assistant",
      content:
        "Hello! I am Autopilot, your autonomous social media planner. I can inspect your connected channels, review your backlog ideas, and draft ready-to-review posts directly onto your Kanban board. What would you like to plan today?",
    },
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const payloadMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Agent execution failed");
      }

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: data.reply || "Done! I have reviewed your requests.",
        steps: data.steps || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If draft creation tools were called, refresh posts query
      const createdDrafts = (data.steps || []).filter((s: any) => s.tool === "create_draft");
      if (createdDrafts.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        queryClient.invalidateQueries({ queryKey: ["totals"] });
        toast.success(`Created ${createdDrafts.length} draft post${createdDrafts.length > 1 ? "s" : ""} on your Kanban board!`);
      }
    } catch (err: any) {
      console.error("[CopilotChatSheet]", err);
      toast.error(err?.message || "Failed to contact Autopilot agent");
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "I encountered a network or service issue while processing your request. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-l border-border/80 bg-card/95 backdrop-blur-md">
        <SheetHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Bot className="size-4.5" />
            </div>
            <div>
              <SheetTitle className="text-sm font-semibold flex items-center gap-1.5">
                Autopilot Copilot
                <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary px-1.5 py-0">
                  AI Agent
                </Badge>
              </SheetTitle>
              <p className="text-[11px] text-muted-foreground">Autonomous Multi-Channel Content Planner</p>
            </div>
          </div>
        </SheetHeader>

        {/* Message Thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="size-6 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="size-3" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground font-medium rounded-tr-xs"
                    : "bg-muted/60 border border-border/60 text-foreground rounded-tl-xs space-y-2"
                }`}
              >
                <p className="whitespace-pre-line">{m.content}</p>

                {m.steps && m.steps.length > 0 && (
                  <div className="pt-2 border-t border-border/40 space-y-1">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">Executed Steps:</p>
                    {m.steps.map((st, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                        <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                        <span>tool: {st.tool}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {m.role === "user" && (
                <div className="size-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <User className="size-3 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 items-center text-muted-foreground text-xs py-1">
              <Spinner className="size-3 text-primary" />
              <span className="font-mono text-[11px] animate-pulse">Autopilot is thinking and checking tools...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Suggestions */}
        <div className="px-4 py-2 border-t border-border/40 bg-muted/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              disabled={loading}
              onClick={() => handleSend(prompt)}
              className="shrink-0 text-[10px] font-mono bg-card hover:bg-muted border border-border px-2.5 py-1 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 border-t border-border/60 bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Autopilot to plan posts, check ideas..."
              disabled={loading}
              className="text-xs h-9 bg-muted/40"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="h-9 w-9 shrink-0"
            >
              <Send className="size-3.5" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

