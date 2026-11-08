"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WorkspaceItem } from "@/types/workspace.type";
import { DEFAULT_MOCK_WORKSPACES } from "@/constants/mock-workspaces";

const STORAGE_KEY = "omnipost_active_workspace_id";

export function useWorkspace() {
  const queryClient = useQueryClient();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_MOCK_WORKSPACES[0].id;
    }
    return DEFAULT_MOCK_WORKSPACES[0].id;
  });

  const { data, isLoading } = useQuery<{
    workspaces: WorkspaceItem[];
    isFallback?: boolean;
  }>({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await fetch("/api/workspaces");
      if (!res.ok) throw new Error("Failed to fetch workspaces");
      return res.json();
    },
    placeholderData: {
      workspaces: DEFAULT_MOCK_WORKSPACES,
      isFallback: true,
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const workspaces = data?.workspaces || DEFAULT_MOCK_WORKSPACES;

  // Ensure active workspace exists in list, else fallback to default
  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) ||
    workspaces.find((w) => w.is_default) ||
    workspaces[0] ||
    DEFAULT_MOCK_WORKSPACES[0];

  const setActiveWorkspace = useCallback((ws: WorkspaceItem) => {
    setActiveWorkspaceId(ws.id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, ws.id);
    }
    // Invalidate dependent queries to refresh data for new workspace
    queryClient.invalidateQueries({ queryKey: ["channels"] });
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async (params: {
      name: string;
      color?: string;
      icon?: string;
      ai_persona?: { tone: string; industry: string; target_audience: string };
    }) => {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("Failed to create workspace");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      if (data?.workspace) {
        setActiveWorkspace(data.workspace);
      }
    },
  });

  useEffect(() => {
    if (activeWorkspace && activeWorkspace.id !== activeWorkspaceId) {
      setActiveWorkspaceId(activeWorkspace.id);
    }
  }, [activeWorkspace, activeWorkspaceId]);

  return {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    isLoading,
    createWorkspace: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

