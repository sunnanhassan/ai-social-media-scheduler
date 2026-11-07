import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { IdeaType } from "@/types/idea.type";
import { KanbanColumn } from "./idea-column";
import { calculateNewOrder } from "@/lib/kanban-sort";
import { DEFAULT_MOCK_GROUPS } from "@/lib/ideas/mock-ideas";

export function useIdeaKanban() {
  const queryClient = useQueryClient();
  const [columns, setColumns] = useState<KanbanColumn[]>(DEFAULT_MOCK_GROUPS as any);
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
    placeholderData: { groups: DEFAULT_MOCK_GROUPS as any },
    staleTime: 60 * 1000,
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
              images: idea.images || [],
            },
          }
        : {
            groupId: idea.columnId,
            content: idea.title,
            title: idea.title,
            description: idea.description,
            images: idea.images || [],
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
      console.warn("Failed to sync idea with server:", error);
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
      console.warn("Failed to sync delete with server:", error);
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
        { ...movedIdea, sortOrder: newOrder },
        { onError: () => setColumns(previousColumnsSnapshot) }
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
        { ...movedIdea, columnId: destination.droppableId, sortOrder: newOrder },
        { onError: () => setColumns(previousColumnsSnapshot) }
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
      const newColumns = columns.map((col) =>
        col.id === idea.columnId ? { ...col, ideas: [newIdea, ...col.ideas] } : col
      );
      setColumns(newColumns);
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

  return {
    columns,
    displayedColumns,
    searchQuery,
    setSearchQuery,
    isPending,
    showIdeaDialog,
    setShowIdeaDialog,
    selectedIdea,
    setSelectedIdea,
    selectedColumnId,
    totalIdeas,
    saveIdeaMutation,
    deleteIdeaMutation,
    handleDragEnd,
    handleAddIdea,
    handleEditIdea,
    handleSaveIdea,
    handleDeleteIdea,
    handleGeneratedIdea,
  };
}
