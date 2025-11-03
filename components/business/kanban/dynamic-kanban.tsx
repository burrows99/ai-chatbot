/** biome-ignore-all lint/correctness/useHookAtTopLevel: false positive */
/** biome-ignore-all lint/nursery/noShadow: intentional variable naming */
"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createStandardButtonGroups,
  createStandardHandlers,
  dateFormatter,
  detectFieldMappings,
  extractColumns,
  filterDataBySearch,
  shortDateFormatter,
} from "@/components/business/base/utils";
import { CommandBar } from "@/components/business/command-bar/command-bar";
import { DynamicDialog } from "@/components/business/dialog/dynamic-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/ui/shadcn-io/kanban";
import { useAIContext } from "@/lib/ai/context/ai-context";
import { cn } from "@/lib/utils";

type KanbanFeature = {
  id: string;
  name: string;
  description: string;
  startAt: Date;
  endAt: Date;
  column: string;
  owner: {
    name: string;
    image: string;
  };
};

const DynamicKanban = () => {
  const {
    canvasArtifactData,
    setCanvasArtifactData,
    kanbanSelectedItems,
    setKanbanSelections,
    setGanttSelections,
    setDataGridSelections,
  } = useAIContext();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingData, setAddingData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const firstRecord = canvasArtifactData?.[0] ?? {};

  // Get selected items from context
  const handleCardClick = useCallback(
    (featureId: string, event: React.PointerEvent) => {
      if (event.ctrlKey || event.metaKey) {
        // Multi-select
        setKanbanSelections((prev) =>
          prev.includes(featureId)
            ? prev.filter((id) => id !== featureId)
            : [...prev, featureId]
        );
      } else {
        // Single selection
        setKanbanSelections([featureId]);
      }
    },
    [setKanbanSelections]
  );

  const columns = useMemo(() => {
    return extractColumns(canvasArtifactData, firstRecord);
  }, [canvasArtifactData, firstRecord]);

  const fieldMappings = useMemo(
    () => detectFieldMappings(firstRecord),
    [firstRecord]
  );

  const {
    idField,
    startDateField,
    endDateField,
    columnField,
    descriptionField,
  } = fieldMappings;

  const features = useMemo(() => {
    if (!canvasArtifactData || canvasArtifactData.length === 0) {
      return [];
    }

    try {
      const filteredData = filterDataBySearch(
        canvasArtifactData,
        searchQuery,
        fieldMappings
      );

      return filteredData.map((item: any, index: number) => {
        const idValue = item[idField]?.value || `item-${index}`;
        const nameValue = item[idField]?.value || `Item ${index + 1}`;
        const startDateValue =
          item[startDateField]?.value || new Date().toISOString().split("T")[0];
        const endDateValue =
          item[endDateField]?.value || new Date().toISOString().split("T")[0];
        const columnValue =
          item[columnField]?.value || columns[0]?.id || "Default";
        const descriptionValue = item[descriptionField]?.value || "";
        return {
          id: String(idValue),
          name: String(nameValue),
          description: String(descriptionValue),
          startAt: new Date(startDateValue),
          endAt: new Date(endDateValue),
          column: String(columnValue),
          owner: {
            name: item.owner?.value || "Unassigned",
            image: item.owner?.image || "",
          },
        };
      });
    } catch (error) {
      console.error("Error mapping data to features:", error);
      return [];
    }
  }, [
    canvasArtifactData,
    idField,
    startDateField,
    endDateField,
    columnField,
    descriptionField,
    columns,
    searchQuery,
    fieldMappings,
  ]);

  const getUpdatedContentData = useCallback(
    (
      canvasArtifactData: Record<string, any>[],
      updatedFeatures: KanbanFeature[],
      fieldMappings: {
        idField: string;
        startDateField: string;
        endDateField: string;
        columnField: string;
      }
    ): Record<string, any>[] => {
      const { idField, columnField } = fieldMappings;

      if (
        !Array.isArray(canvasArtifactData) ||
        canvasArtifactData.length === 0
      ) {
        return [];
      }

      // Build feature map by the SAME key you'll use below
      const featureMap = new Map<string, KanbanFeature>();
      updatedFeatures.map((feature) => {
        featureMap.set(feature.id, feature);
        return null;
      });

      return canvasArtifactData.map((record, index) => {
        // Choose ONE canonical id format and stick to it.
        // If your features are keyed by the raw id field, use this:
        const recordKey = String(record?.[idField]?.value ?? `item-${index}`);
        const feature = featureMap.get(recordKey);
        if (!feature) {
          return record;
        }

        // Update column field immutably
        return {
          ...record,
          [columnField]: record?.[columnField]
            ? { ...record[columnField], value: feature.column }
            : { value: feature.column },
        };
      });
    },
    []
  );

  const onDataChange = useCallback(
    (updatedFeatures: KanbanFeature[]) => {
      const updatedCanvasArtifactData = getUpdatedContentData(
        canvasArtifactData,
        updatedFeatures,
        fieldMappings
      );
      setCanvasArtifactData(updatedCanvasArtifactData);
    },
    [
      fieldMappings,
      getUpdatedContentData,
      canvasArtifactData,
      setCanvasArtifactData,
    ]
  );

  const standardHandlers = useMemo(() => {
    return createStandardHandlers({
      setCanvasArtifactData,
      clearSelections: () => {
        setGanttSelections([]);
        setDataGridSelections([]);
        setKanbanSelections([]);
      },
      selectedItems: kanbanSelectedItems,
      idField,
      setEditingData,
      setEditDialogOpen,
      setAddingData,
      setAddDialogOpen,
      canvasArtifactData,
    });
  }, [
    setCanvasArtifactData,
    setGanttSelections,
    setDataGridSelections,
    setKanbanSelections,
    kanbanSelectedItems,
    idField,
    canvasArtifactData,
  ]);

  const {
    handleEdit,
    handleAdd,
    handleSave,
    handleAddSave,
    deleteSelectedItems,
  } = standardHandlers;

  const buttonGroups = useMemo(() => {
    return createStandardButtonGroups(
      { handleAdd, handleEdit, deleteSelectedItems },
      kanbanSelectedItems
    );
  }, [handleAdd, handleEdit, deleteSelectedItems, kanbanSelectedItems]);

  if (!canvasArtifactData || canvasArtifactData.length === 0) {
    return (
      <div className="flex w-full items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              No data found to display in Kanban board.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  try {
    return (
      <div className="w-full p-4">
        <CommandBar
          buttonGroups={buttonGroups}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search cards..."
          searchValue={searchQuery}
          showSearch={true}
        />

        {editingData && (
          <DynamicDialog
            data={editingData}
            description="Make changes to the card. Click save when you're done."
            onOpenChange={setEditDialogOpen}
            onSave={handleSave}
            open={editDialogOpen}
            title="Edit Card"
          />
        )}

        {addingData && (
          <DynamicDialog
            data={addingData}
            description="Create a new card. Click save when you're done."
            onOpenChange={setAddDialogOpen}
            onSave={handleAddSave}
            open={addDialogOpen}
            title="Add New Card"
          />
        )}

        <KanbanProvider
          columns={columns}
          data={features}
          onDataChange={onDataChange}
        >
          {(column) => (
            <KanbanBoard id={column.id} key={column.id}>
              <KanbanHeader>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: column.color as string }}
                  />
                  <span>{column.name}</span>
                </div>
              </KanbanHeader>
              <KanbanCards id={column.id}>
                {(feature: (typeof features)[number]) => {
                  const isSelected = kanbanSelectedItems.includes(feature.id);
                  return (
                    <KanbanCard
                      className={cn(isSelected && "ring-2 ring-primary")}
                      column={column.id}
                      id={feature.id}
                      key={feature.id}
                      name={feature.name}
                    >
                      <div
                        className="flex items-start justify-between gap-2"
                        onPointerUp={(e) => handleCardClick(feature.id, e)}
                      >
                        <div className="flex flex-col gap-1">
                          <p className="m-0 flex-1 font-medium text-sm">
                            {feature.name}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="m-0 flex-1 font-medium text-sm">
                            {feature.description}
                          </p>
                        </div>
                        {feature.owner && (
                          <Avatar className="h-4 w-4 shrink-0">
                            <AvatarImage src={feature.owner?.image} />
                            <AvatarFallback>
                              {feature.owner?.name?.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      <p className="m-0 text-muted-foreground text-xs">
                        {(() => {
                          try {
                            const startDate =
                              feature.startAt instanceof Date &&
                              !Number.isNaN(feature.startAt.getTime())
                                ? shortDateFormatter.format(feature.startAt)
                                : "N/A";
                            const endDate =
                              feature.endAt instanceof Date &&
                              !Number.isNaN(feature.endAt.getTime())
                                ? dateFormatter.format(feature.endAt)
                                : "N/A";
                            return `;${startDate} - ${endDate}`;
                          } catch (_error) {
                            return "Invalid date";
                          }
                        })()}
                      </p>
                    </KanbanCard>
                  );
                }}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>
    );
  } catch (error) {
    console.error("Error rendering Kanban board:", error);
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Alert className="max-w-md" variant="destructive">
          <AlertTitle>Kanban Rendering Error</AlertTitle>
          <AlertDescription>
            Error rendering Kanban board:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
};

export default DynamicKanban;
