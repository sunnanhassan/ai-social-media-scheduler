"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";
import IdeaDialog from "./idea-dialog";
import { IdeaType } from "@/types/idea.type";
import { IdeaColumn, KanbanColumn } from "./idea-column";
import { IdeaToolbar } from "./idea-toolbar";
import { calculateNewOrder } from "@/lib/kanban-sort";

const IdeaKanban = () => {
  const queryClient = useQueryClient();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showIdeaDialog, setShowIdeaDialog] = useState<boolean>(false);
  const [selectedIdea, setSelectedIdea] = useState<IdeaType | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>("");

  const { data: ideaData, isPending } = useQuery({
    queryKey: ["ideas"],
    queryFn: async () => {
      const res = await fetch("/api/ideas");
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
      const isUpdate = idea.id && !idea.id.startsWith("temp-");
      const url = "/api/ideas";
      
      const payload = isUpdate 
        ? {
            id: idea.id,
            updates: {
              groupId: idea.columnId,
              content: idea.title,
              title: idea.title,
              description: idea.description,
              sortOrder: idea.sortOrder,
              images: idea.images || []
            }
          }
        : {
            groupId: idea.columnId,
            content: idea.title,
            title: idea.title,
            description: idea.description,
            images: idea.images || []
          };

      const response = await fetch(url, {
        method: isUpdate ? "PATCH" : "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to save idea");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
    onError: (error, _variables, context: any) => {
      console.error("Failed to save idea:", error);
      toast.error("Failed to save idea");
      if (context?.previousColumns) {
        setColumns(context.previousColumns);
      } else {
        queryClient.invalidateQueries({ queryKey: ["ideas"] });
      }
    },
  });

  const deleteIdeaMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ideas`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
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
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
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

    const previousColumnsSnapshot = columns;

    if (source.droppableId === destination.droppableId) {
      const newIdeas = [...sourceColumn.ideas];
      const [movedIdea] = newIdeas.splice(source.index, 1);
      
      const newOrder = calculateNewOrder(newIdeas, destination.index);
      movedIdea.sortOrder = newOrder;
      
      newIdeas.splice(destination.index, 0, movedIdea);

      const newColumns = columns.map((col) =>
        col.id === sourceColumn.id ? { ...col, ideas: newIdeas } : col
      );
      setColumns(newColumns);

      saveIdeaMutation.mutate(
        {
          ...movedIdea,
          sortOrder: newOrder,
        },
        {
          onError: () => {
            setColumns(previousColumnsSnapshot);
          },
        }
      );
    } else {
      const sourceIdeas = [...sourceColumn.ideas];
      const destIdeas = [...destinationColumn.ideas];
      const [movedIdea] = sourceIdeas.splice(source.index, 1);

      const newOrder = calculateNewOrder(destIdeas, destination.index);
      movedIdea.sortOrder = newOrder;
      movedIdea.columnId = destination.droppableId;
      
      destIdeas.splice(destination.index, 0, movedIdea);

      const newColumns = columns.map((col) => {
        if (col.id === sourceColumn.id) return { ...col, ideas: sourceIdeas };
        if (col.id === destinationColumn.id) return { ...col, ideas: destIdeas };
        return col;
      });

      setColumns(newColumns);
      saveIdeaMutation.mutate(
        {
          ...movedIdea,
          columnId: destination.droppableId,
          sortOrder: newOrder,
        },
        {
          onError: () => {
            setColumns(previousColumnsSnapshot);
          },
        }
      );
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

  const totalIdeas = useMemo(() => {
    return columns.reduce((acc, col) => acc + col.ideas.length, 0);
  }, [columns]);

  const displayedColumns = useMemo(() => {
    if (!searchQuery.trim()) return columns;
    const query = searchQuery.toLowerCase();
    return columns.map((col) => ({
      ...col,
      ideas: col.ideas.filter(
        (idea) =>
          idea.title.toLowerCase().includes(query) ||
          (idea.description && idea.description.toLowerCase().includes(query))
      ),
    }));
  }, [columns, searchQuery]);

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
        {/* Modern Data-Dense Toolbar */}
        <IdeaToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalIdeas={totalIdeas}
          totalColumns={columns.length}
          onNewIdea={() => handleAddIdea(columns[0]?.id ?? "")}
          onGenerated={handleGeneratedIdea}
        />

        {/* Board Canvas with subtle technical grid */}
        <div className="relative flex-1 min-h-0 pt-4 pb-2 overflow-hidden subtle-grid-bg rounded-lg">
          {isPending ? (
            <div className="flex gap-4 w-full h-full items-start px-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="shrink-0 w-[300px] flex flex-col h-full min-h-0 rounded-lg bg-card/50 border border-border/70 p-3"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-border/50">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-6 rounded" />
                  </div>
                  <div className="flex-1 space-y-2.5 pt-3">
                    <Skeleton className="h-20 w-full rounded-md" />
                    <Skeleton className="h-28 w-full rounded-md" />
                    <Skeleton className="h-16 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full overflow-x-auto kanban-scroll px-1">
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-4 w-full h-full pb-2">
                  {displayedColumns?.map((column) => (
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