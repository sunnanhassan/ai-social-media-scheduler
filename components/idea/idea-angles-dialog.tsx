"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Sparkles, ArrowRight, Lightbulb } from "lucide-react";
import { IdeaType } from "@/types/idea.type";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface IdeaAnglesDialogProps {
  idea: IdeaType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAngle?: (title: string, description: string) => void;
}

const ANGLE_BADGES = [
  { label: "Actionable How-To", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { label: "Contrarian Truth", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { label: "Personal Story", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { label: "Checklist / Framework", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { label: "Discussion Prompt", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
];

export function IdeaAnglesDialog({
  idea,
  open,
  onOpenChange,
  onSelectAngle,
}: IdeaAnglesDialogProps) {
  const router = useRouter();
  const [angles, setAngles] = useState<Array<{ title: string; description: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !idea) return;

    let isMounted = true;
    const fetchAngles = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/idea/generate-ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "expand_angles",
            title: idea.title,
            description: idea.description,
          }),
        });

        const data = await res.json();
        if (isMounted) {
          if (data.ideas && Array.isArray(data.ideas)) {
            setAngles(data.ideas);
          } else {
            setAngles([]);
          }
        }
      } catch (err) {
        console.warn("[IdeaAnglesDialog] Failed to expand angles:", err);
        toast.error("Could not generate angles at this moment. Showing base template.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAngles();
    return () => {
      isMounted = false;
    };
  }, [open, idea]);

  const handleUseAngle = (title: string, description: string) => {
    onOpenChange(false);
    if (onSelectAngle) {
      onSelectAngle(title, description);
    } else {
      const queryParams = new URLSearchParams({
        create: "true",
        content: `${title}\n\n${description}`,
      });
      router.push(`/schedule?${queryParams.toString()}`);
    }
    toast.success("Angle loaded into Post Composer!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4 animate-pulse" />
            </div>
            <DialogTitle className="text-base font-semibold">
              5 Strategic Angles for Idea
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
            Transform &ldquo;{idea?.title}&rdquo; into 5 proven content angles tailored for social channels.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2">
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Spinner className="size-6 text-primary" />
              <p className="text-xs font-mono">Generating 5 distinct content angles...</p>
            </div>
          ) : angles.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
              <Lightbulb className="size-6 mb-1 text-muted-foreground/60" />
              <p className="text-xs">No angles generated. Try again.</p>
            </div>
          ) : (
            angles.map((angle, idx) => {
              const badgeMeta = ANGLE_BADGES[idx % ANGLE_BADGES.length];
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border/70 bg-card p-3.5 hover:border-primary/40 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className={`text-[10px] font-mono border ${badgeMeta.color}`}>
                        Angle {idx + 1}: {badgeMeta.label}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px] gap-1 text-primary hover:bg-primary/10 px-2"
                        onClick={() => handleUseAngle(angle.title, angle.description)}
                      >
                        <span>Create Post</span>
                        <ArrowRight className="size-3" />
                      </Button>
                    </div>
                    <h5 className="text-xs font-semibold text-foreground leading-snug">
                      {angle.title}
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {angle.description}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
