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
  parseArtifactData,
  shortDateFormatter,
} from "@/components/business/base/utils";
import { CommandBar } from "@/components/business/command-bar/command-bar";
import { DynamicDialog } from "@/components/business/dialog/dynamic-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  const { contextData, setArtifactData } = useAIContext();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingData, setAddingData] = useState<any>(null);

  const parseResult = useMemo(() => {
    return parseArtifactData(contextData);
  }, [contextData]);

  const { data, error } = parseResult;
  const firstRecord = data[0] ?? {};

  // Get selected items from context
  const selectedItems = useMemo(() => {
    return contextData?.artifact?.canvasArtifact?.selectedItems || [];
  }, [contextData?.artifact?.canvasArtifact?.selectedItems]);

  const columns = useMemo(() => {
    return extractColumns(data, firstRecord);
  }, [data, firstRecord]);

  const fieldMappings = useMemo(
    () => detectFieldMappings(firstRecord),
    [firstRecord]
  );
  const { idField, dateField, columnField, descriptionField } = fieldMappings;
  const newColumns = useMemo(() => columns, [columns]);

  const features = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    try {
      return data.map((item: any, index: number) => {
        const idValue = item[idField]?.value || `item-${index}`;
        const nameValue = item[idField]?.value || `Item ${index + 1}`;
        const dateValue =
          item[dateField]?.value || new Date().toISOString().split("T")[0];
        const columnValue =
          item[columnField]?.value || newColumns[0]?.id || "Default";
        const descriptionValue = item[descriptionField]?.value || "";
        return {
          id: String(idValue),
          name: String(nameValue),
          description: String(descriptionValue),
          startAt: new Date(dateValue),
          endAt: new Date(dateValue),
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
  }, [data, idField, dateField, columnField, descriptionField, newColumns]);

  const getUpdatedContentData = useCallback(
    (
      originalContent: any,
      updatedFeatures: KanbanFeature[],
      fieldMappings: {
        idField: string;
        dateField: string;
        columnField: string;
      }
    ): any => {
      const { columnField } = fieldMappings;

      // Work with the original data structure
      const updatedData = JSON.parse(JSON.stringify(originalContent));

      const featureMap = new Map<string, KanbanFeature>();
      updatedFeatures.map((feature) => {
        featureMap.set(feature.id, feature);
        return null;
      });

      // Update the data array if it exists
      if (Array.isArray(updatedData)) {
        return updatedData.map((record, index) => {
          const recordId = String(record[idField]?.value || `item-${index}`);
          const feature = featureMap.get(recordId);
          if (!feature) {
            return record;
          }
          const updatedRecord = { ...record };
          if (updatedRecord[columnField]) {
            updatedRecord[columnField] = {
              ...updatedRecord[columnField],
              value: feature.column,
            };
          }

          return updatedRecord;
        });
      }

      return updatedData;
    },
    [idField]
  );

  const onDataChange = useCallback(
    (updatedFeatures: KanbanFeature[]) => {
      const currentArtifactData = contextData?.artifact?.canvasArtifact?.data;
      const updatedData = getUpdatedContentData(
        currentArtifactData?.data || currentArtifactData,
        updatedFeatures,
        fieldMappings
      );
      setArtifactData("canvasArtifact", { data: updatedData });
    },
    [
      fieldMappings,
      getUpdatedContentData,
      contextData?.artifact?.canvasArtifact?.data,
      setArtifactData,
    ]
  );

  // Handle card selection
  const handleCardClick = useCallback(
    (featureId: string, event: React.PointerEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;

      let newSelection: string[];

      if (isCtrlOrCmd) {
        // Toggle selection
        if (selectedItems.includes(featureId)) {
          newSelection = selectedItems.filter((id: string) => id !== featureId);
        } else {
          newSelection = [...selectedItems, featureId];
        }
      } else if (isShift && selectedItems.length > 0) {
        // Range selection
        const lastSelected = selectedItems.at(-1);
        const lastIndex = features.findIndex((f) => f.id === lastSelected);
        const currentIndex = features.findIndex((f) => f.id === featureId);

        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          const rangeIds = features.slice(start, end + 1).map((f) => f.id);

          // Combine with existing selection
          newSelection = Array.from(new Set([...selectedItems, ...rangeIds]));
        } else {
          newSelection = [featureId];
        }
      } else {
        // Single selection
        newSelection = [featureId];
      }

      setArtifactData("canvasArtifact", { selectedItems: newSelection });
    },
    [selectedItems, features, setArtifactData]
  );

  // Create standard handlers using shared utility
  const standardHandlers = useMemo(() => {
    return createStandardHandlers({
      contextData,
      setArtifactData,
      selectedItems,
      idField,
      setEditingData,
      setEditDialogOpen,
      setAddingData,
      setAddDialogOpen,
      data,
    });
  }, [contextData, setArtifactData, selectedItems, idField, data]);

  const {
    handleEdit,
    handleAdd,
    handleSave,
    handleAddSave,
    deleteSelectedItems,
  } = standardHandlers;

  // Create standard button groups using shared utility
  const buttonGroups = useMemo(() => {
    return createStandardButtonGroups(
      { handleAdd, handleEdit, deleteSelectedItems },
      selectedItems
    );
  }, [handleAdd, handleEdit, deleteSelectedItems, selectedItems]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Alert className="max-w-md" variant="destructive">
          <AlertTitle>Invalid JSON for Kanban</AlertTitle>
          <AlertDescription>Error parsing JSON data: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
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
          columns={newColumns}
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
                  const isSelected = selectedItems.includes(feature.id);
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
                            return `${startDate} - ${endDate}`;
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
