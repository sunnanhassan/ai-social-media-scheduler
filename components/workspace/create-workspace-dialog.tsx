"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Sparkles } from "lucide-react";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLOR_PRESETS = [
  { name: "Emerald", value: "#10B981" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Pink", value: "#EC4899" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Rose", value: "#F43F5E" },
];

const AI_PERSONA_PRESETS = [
  {
    label: "Professional / B2B",
    persona: {
      tone: "high-signal, professional, product-driven",
      industry: "business & technology",
      target_audience: "professionals and leaders",
    },
  },
  {
    label: "Educator / Thought Leader",
    persona: {
      tone: "thoughtful, authentic, educational",
      industry: "software & creative",
      target_audience: "creators and developers",
    },
  },
  {
    label: "Viral / High Energy",
    persona: {
      tone: "high-energy, viral hooks, engaging",
      industry: "entertainment & culture",
      target_audience: "general social audience",
    },
  },
];

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const { createWorkspace, isCreating } = useWorkspace();
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0].value);
  const [selectedPersonaIdx, setSelectedPersonaIdx] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a brand name");
      return;
    }

    try {
      await createWorkspace({
        name: name.trim(),
        color: selectedColor,
        ai_persona: AI_PERSONA_PRESETS[selectedPersonaIdx].persona,
      });
      toast.success(`Brand "${name.trim()}" created!`);
      setName("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create brand");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Create New Brand / Workspace
          </DialogTitle>
          <DialogDescription>
            Organize separate calendars, analytics, social accounts, and AI voice
            personas for each brand or client you manage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="brand-name">Brand or Project Name</Label>
            <Input
              id="brand-name"
              placeholder="e.g. Acme SaaS, Personal Channel, Client X"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Brand Accent Color</Label>
            <div className="flex items-center gap-2 pt-1">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.name}
                  onClick={() => setSelectedColor(color.value)}
                  className={`size-7 rounded-full transition-transform ${
                    selectedColor === color.value
                      ? "ring-2 ring-offset-2 ring-primary scale-110"
                      : "hover:scale-105 opacity-80"
                  }`}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>AI Tone & Persona Preset</Label>
            <div className="grid grid-cols-1 gap-2 pt-1">
              {AI_PERSONA_PRESETS.map((item, idx) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSelectedPersonaIdx(idx)}
                  className={`flex flex-col text-left p-2.5 rounded-lg border text-xs transition-colors ${
                    selectedPersonaIdx === idx
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-muted-foreground mt-0.5">
                    Tone: {item.persona.tone}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim()}>
              {isCreating && <Spinner className="size-4 mr-2" />}
              Create Brand
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

