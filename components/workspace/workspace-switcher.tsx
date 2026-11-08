"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/hooks/use-workspace";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { Check, ChevronsUpDown, Plus, Sparkles } from "lucide-react";
import type { WorkspaceItem } from "@/types/workspace.type";

interface WorkspaceSwitcherProps {
  isCollapsed?: boolean;
}

export function WorkspaceSwitcher({ isCollapsed = false }: WorkspaceSwitcherProps) {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleSelect = (ws: WorkspaceItem) => {
    setActiveWorkspace(ws);
  };

  const initial = (activeWorkspace.name || "B").slice(0, 1).toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={isCollapsed ? "icon" : "default"}
            className={
              isCollapsed
                ? "size-8 p-0 border-border/80"
                : "w-full justify-between h-9 px-2 text-left font-normal border-border/70 hover:bg-muted/60 transition-colors shadow-2xs"
            }
            title={activeWorkspace.name}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="size-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-2xs"
                style={{ backgroundColor: activeWorkspace.color || "#10B981" }}
              >
                {initial}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className="text-xs font-semibold truncate text-foreground">
                    {activeWorkspace.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {activeWorkspace.is_default ? "Default Brand" : "Brand Project"}
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronsUpDown className="size-3.5 shrink-0 opacity-50 ml-1" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" align="start" sideOffset={6}>
          <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground">
            Brands & Workspaces
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {workspaces.map((ws) => {
            const wsInitial = (ws.name || "B").slice(0, 1).toUpperCase();
            const isActive = ws.id === activeWorkspace.id;

            return (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => handleSelect(ws)}
                className="flex items-center justify-between cursor-pointer py-1.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="size-4 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: ws.color || "#10B981" }}
                  >
                    {wsInitial}
                  </div>
                  <span className="text-xs truncate font-medium">{ws.name}</span>
                </div>
                {isActive && <Check className="size-3.5 text-primary shrink-0 ml-2" />}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 text-primary cursor-pointer py-1.5 text-xs font-medium"
          >
            <Plus className="size-3.5" />
            <span>Create New Brand</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </>
  );
}

