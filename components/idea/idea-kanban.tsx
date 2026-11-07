"use client";

import { DragDropContext } from "@hello-pangea/dnd";
import { Skeleton } from "../ui/skeleton";
import IdeaDialog from "./idea-dialog";
import { IdeaColumn } from "./idea-column";
import { IdeaToolbar } from "./idea-toolbar";
import { useIdeaKanban } from "./use-idea-kanban";

const IdeaKanban = () => {
  const {
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
  } = useIdeaKanban();

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
          {isPending && columns.length === 0 ? (
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
