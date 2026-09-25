"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import IdeaDialog from "./idea-dialog";
import { IdeaType } from "@/types/idea.type";
import { GenerateIdeasPopover } from "./generate-ideas-popover";
import { IdeaColumn, KanbanColumn } from "./idea-column";

const IdeaKanban = () => {
  const queryClient = useQueryClient();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [showIdeaDialog, setShowIdeaDialog] = useState<boolean>(false);
  const [selectedIdea, setSelectedIdea] = useState<IdeaType | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>("");

  const { data: ideaData, isPending } = useQuery({
    queryKey: ["ideas"],
    queryFn: async () => {
      const res = await fetch("/api/idea");
      if (!res.ok) throw new Error("Failed to fetch ideas");
      return res.json();
    },
  });

  useEffect(() => {
    if (ideaData?.groups) {
      setColumns(ideaData.groups);
    }
  }, [ideaData]);

  const saveIdeaMutation = useMutation({
    mutationFn: async (idea: IdeaType) => {
      const response = await fetch("/api/idea", {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: idea.id,
          title: idea.title,
          description: idea.description,
          groupId: idea.columnId,
          images: idea.images,
          sortOrder: idea.sortOrder,
        }),
      });
      if (!response.ok) throw new Error("Failed to save idea");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
    onError: (error) => {
      console.error("Failed to save idea:", error);
      toast.error("Failed to save idea");
    },
  });

  const deleteIdeaMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/idea/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete idea");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
    onError: (error) => {
      console.error("Failed to delete idea", error);
      toast.error("Failed to delete idea");
    },
  });

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destinationColumn = columns.find((col) => col.id === destination.droppableId);

    if (!sourceColumn || !destinationColumn) return;

    if (source.droppableId === destination.droppableId) {
      const newIdeas = [...sourceColumn.ideas];
      const [movedIdea] = newIdeas.splice(source.index, 1);
      movedIdea.sortOrder = destination.index;
      newIdeas.splice(destination.index, 0, movedIdea);

      const newColumns = columns.map((col) =>
        col.id === sourceColumn.id ? { ...col, ideas: newIdeas } : col
      );
      setColumns(newColumns);

      saveIdeaMutation.mutate({
        ...movedIdea,
        sortOrder: destination.index,
      });
    } else {
      const sourceIdeas = [...sourceColumn.ideas];
      const destIdeas = [...destinationColumn.ideas];
      const [movedIdea] = sourceIdeas.splice(source.index, 1);

      movedIdea.sortOrder = destination.index;
      movedIdea.columnId = destination.droppableId;
      destIdeas.splice(destination.index, 0, movedIdea);

      const newColumns = columns.map((col) => {
        if (col.id === sourceColumn.id) return { ...col, ideas: sourceIdeas };
        if (col.id === destinationColumn.id) return { ...col, ideas: destIdeas };
        return col;
      });

      setColumns(newColumns);
      saveIdeaMutation.mutate({
        ...movedIdea,
        columnId: destination.droppableId,
        sortOrder: destination.index,
      });
    }
  };

  const handleAddIdea = (columnId: string) => {
    setSelectedIdea(null);
    setSelectedColumnId(columnId);
    setShowIdeaDialog(true);
  };

  const handleEditIdea = (idea: IdeaType, columnId: string) => {
    setSelectedIdea(idea);
    setSelectedColumnId(columnId);
    setShowIdeaDialog(true);
  };

  const handleSaveIdea = (idea: IdeaType) => {
    if (idea.id) {
      const newColumns = columns.map((col) => ({
        ...col,
        ideas: col.ideas.map((ideaCol) => (ideaCol.id === idea.id ? { ...ideaCol, ...idea } : ideaCol)),
      }));
      setColumns(newColumns);
    } else {
      const newIdea = { ...idea, id: `temp-${Date.now()}` };
      const newColumn = columns.map((col) =>
        col.id === idea.columnId ? { ...col, ideas: [newIdea, ...col.ideas] } : col
      );
      setColumns(newColumn);
    }

    saveIdeaMutation.mutate(idea, {
      onSuccess: () => {
        setSelectedIdea(null);
        setShowIdeaDialog(false);
      },
    });
  };

  const handleDeleteIdea = (columnId: string, ideaId: string) => {
    if (!ideaId) return;
    const newColumns = columns.map((col) =>
      col.id === columnId ? { ...col, ideas: col.ideas.filter((i) => i.id !== ideaId) } : col
    );
    setColumns(newColumns);

    if (!ideaId.startsWith("temp-")) {
      deleteIdeaMutation.mutate(ideaId);
    }
  };

  const handleGeneratedIdea = (title: string, description: string) => {
    const targetColumnId = columns[0]?.id;
    if (!targetColumnId) return;

    const newIdea: IdeaType = {
      id: `temp-${Date.now()}`,
      title,
      description,
      columnId: targetColumnId,
    };

    const newColumns = columns.map((col) =>
      col.id === targetColumnId ? { ...col, ideas: [newIdea, ...col.ideas] } : col
    );
    setColumns(newColumns);
    saveIdeaMutation.mutate({
      title,
      description,
      columnId: targetColumnId,
      sortOrder: 0,
    });
  };

  return (
    <>
      <div className="flex flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Ideas</h1>
            <p className="text-sm text-muted-foreground">Capture and organize your content ideas</p>
          </div>
          <div className="flex items-center gap-3">
            <GenerateIdeasPopover onGenerated={handleGeneratedIdea} />
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleAddIdea(columns[0]?.id ?? "")}
            >
              <Plus className="h-4 w-4" />
              New Idea
            </Button>
          </div>
        </header>

        <div className="h-[calc(100vh-120px)]">
          <div className="kanban--board relative py-6 flex-1 h-full overflow-hidden">
            {isPending ? (
              <div className="flex gap-4 w-full h-full items-start px-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="shrink-0 w-[280px] flex flex-col h-full min-h-0 rounded-2xl bg-card border p-3"
                  >
                    <div className="flex items-center justify-between pb-3">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-6 rounded-full" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-[100px] w-full rounded-xl" />
                      <Skeleton className="h-[120px] w-full rounded-xl" />
                      <Skeleton className="h-[80px] w-full rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full overflow-x-auto px-6">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <div style={{ height: "100%" }} className="flex gap-4 w-full">
                    {columns?.map((column) => (
                      <IdeaColumn
                        key={column.id}
                        column={column}
                        onAddIdea={handleAddIdea}
                        onEditIdea={handleEditIdea}
                        onDeleteIdea={handleDeleteIdea}
                        isDeleting={deleteIdeaMutation.isPending}
                      />
                    ))}
                  </div>
                </DragDropContext>
              </div>
            )}
          </div>
        </div>
      </div>

      <IdeaDialog
        open={showIdeaDialog}
        onOpenChange={(open) => setShowIdeaDialog(open)}
        idea={selectedIdea ?? undefined}
        isSaving={saveIdeaMutation.isPending}
        selectedColumnId={selectedColumnId || columns[0]?.id || ""}
        columns={columns?.map((col) => ({
          id: col.id,
          title: col.title,
        }))}
        onSave={handleSaveIdea}
      />
    </>
  );
};

export default IdeaKanban;