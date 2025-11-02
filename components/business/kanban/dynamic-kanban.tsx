/** biome-ignore-all lint/correctness/useHookAtTopLevel: false positive */
/** biome-ignore-all lint/nursery/noShadow: intentional variable naming */
"use client";

import { Pencil, Plus, Trash } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { getRandomColor } from "@/components/business/base/utils";
import { CommandBar } from "@/components/business/command-bar/command-bar";
import { DynamicDialog } from "@/components/business/dialog/dynamic-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/ui/shadcn-io/kanban";
import { useAIContext } from "@/lib/ai/context/ai-context";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

type KanbanColumn = {
  id: string;
  name: string;
  color: string;
};

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
  const dataRef = useRef<any[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingData, setAddingData] = useState<any>(null);

  const parseResult = useMemo(() => {
    try {
      const artifactData = contextData?.artifact?.canvasArtifact?.data;

      // The data might be directly in artifactData or nested under a 'data' property
      const data = artifactData?.data || artifactData;
      const dataArray = Array.isArray(data) ? data : [];

      // Only update ref if data actually changed
      if (JSON.stringify(dataArray) !== JSON.stringify(dataRef.current)) {
        dataRef.current = dataArray;
      }

      return {
        success: true,
        data: dataRef.current,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Invalid format",
      };
    }
  }, [contextData?.artifact?.canvasArtifact?.data]);

  const { data, error } = parseResult;
  const firstRecord = data[0] ?? {};

  // Get selected items from context
  const selectedItems = useMemo(() => {
    return contextData?.artifact?.canvasArtifact?.selectedItems || [];
  }, [contextData?.artifact?.canvasArtifact?.selectedItems]);

  const extractColumns = useCallback(
    (dataArray: any[]): KanbanColumn[] => {
      if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
        return [];
      }
      try {
        for (const fieldKey in firstRecord) {
          if (Object.hasOwn(firstRecord, fieldKey)) {
            const field = firstRecord[fieldKey];
            if (
              field &&
              typeof field === "object" &&
              field.type &&
              Array.isArray(field.type.allowedValues)
            ) {
              return field.type.allowedValues.map((value: any) => ({
                id: String(value),
                name: String(value),
                color: getRandomColor(),
              }));
            }
          }
        }
      } catch (error) {
        console.warn("Error extracting columns from data:", error);
      }
      return [];
    },
    [firstRecord]
  );

  const detectFieldMappings = useCallback(
    (
      firstRecord: any
    ): {
      idField: string;
      dateField: string;
      columnField: string;
      descriptionField: string;
    } => {
      const idField =
        Object.keys(firstRecord).find(
          (fieldNumber) => firstRecord[fieldNumber]?.type?.name === "text"
        ) ||
        Object.keys(firstRecord)[0] ||
        "field1";

      const dateField =
        Object.keys(firstRecord).find(
          (fieldNumber) => firstRecord[fieldNumber]?.type?.name === "date"
        ) ||
        Object.keys(firstRecord).find(
          (fieldNumber) => firstRecord[fieldNumber]?.type?.name === "text"
        ) ||
        Object.keys(firstRecord)[1] ||
        "field4";

      const columnField =
        Object.keys(firstRecord).find(
          (fieldNumber) => firstRecord[fieldNumber]?.type?.name === "dropdown"
        ) ||
        Object.keys(firstRecord).find((fieldNumber) =>
          Array.isArray(firstRecord[fieldNumber]?.type?.allowedValues)
        ) ||
        "field3";
      const descriptionField =
        Object.keys(firstRecord).find(
          (fieldNumber) => firstRecord[fieldNumber]?.type?.name === "textArea"
        ) || "field2";
      return { idField, dateField, columnField, descriptionField };
    },
    []
  );

  const fieldMappings = useMemo(
    () => detectFieldMappings(firstRecord),
    [detectFieldMappings, firstRecord]
  );
  const { idField, dateField, columnField, descriptionField } = fieldMappings;
  const newColumns = useMemo(
    () => extractColumns(data),
    [data, extractColumns]
  );

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

  // Edit handler - opens dialog with selected item
  const handleEdit = useCallback(() => {
    if (selectedItems.length !== 1) {
      return;
    }

    const selectedItemId = selectedItems[0];
    const selectedItem = data.find((item: any, index: number) => {
      const itemId = String(item[idField]?.value || `item-${index}`);
      return itemId === selectedItemId;
    });

    if (selectedItem) {
      setEditingData(selectedItem);
      setEditDialogOpen(true);
    }
  }, [selectedItems, data, idField]);

  // Add handler - opens dialog with cloned first record with cleared values
  const handleAdd = useCallback(() => {
    if (data.length === 0) {
      return;
    }

    const firstRecord = data[0];
    const clonedRecord = JSON.parse(JSON.stringify(firstRecord));

    // Clear all field values
    for (const fieldKey of Object.keys(clonedRecord)) {
      if (
        clonedRecord[fieldKey] &&
        typeof clonedRecord[fieldKey] === "object" &&
        clonedRecord[fieldKey].value !== undefined
      ) {
        clonedRecord[fieldKey].value = "";
      }
    }

    setAddingData(clonedRecord);
    setAddDialogOpen(true);
  }, [data]);

  // Save handler - updates the data
  const handleSave = useCallback(
    (updatedFormData: any) => {
      const currentArtifactData = contextData?.artifact?.canvasArtifact?.data;
      const currentData = currentArtifactData?.data || currentArtifactData;

      if (!Array.isArray(currentData)) {
        return;
      }

      const selectedItemId = selectedItems[0];

      // Update the data array with the edited item
      const updatedData = currentData.map((item: any, index: number) => {
        const itemId = String(item[idField]?.value || `item-${index}`);
        if (itemId === selectedItemId) {
          return updatedFormData;
        }
        return item;
      });

      setArtifactData("canvasArtifact", { data: updatedData });
    },
    [
      selectedItems,
      contextData?.artifact?.canvasArtifact?.data,
      idField,
      setArtifactData,
    ]
  );

  // Add save handler - appends new record to data
  const handleAddSave = useCallback(
    (newFormData: any) => {
      const currentArtifactData = contextData?.artifact?.canvasArtifact?.data;
      const currentData = currentArtifactData?.data || currentArtifactData;

      if (!Array.isArray(currentData)) {
        return;
      }

      // Append the new item to the data array
      const updatedData = [...currentData, newFormData];

      setArtifactData("canvasArtifact", { data: updatedData });
    },
    [contextData?.artifact?.canvasArtifact?.data, setArtifactData]
  );

  // Delete selected items
  const deleteSelectedItems = useCallback(() => {
    if (selectedItems.length === 0) {
      return;
    }

    const currentArtifactData = contextData?.artifact?.canvasArtifact?.data;
    const currentData = currentArtifactData?.data || currentArtifactData;

    if (!Array.isArray(currentData)) {
      return;
    }

    // Filter out selected items
    const updatedData = currentData.filter((item: any, index: number) => {
      const itemId = String(item[idField]?.value || `item-${index}`);
      return !selectedItems.includes(itemId);
    });

    setArtifactData("canvasArtifact", {
      data: updatedData,
      selectedItems: [],
    });
  }, [
    selectedItems,
    contextData?.artifact?.canvasArtifact?.data,
    idField,
    setArtifactData,
  ]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h3 className="mb-2 font-semibold text-lg text-red-800">
            Invalid JSON for Kanban
          </h3>
          <p className="text-red-600">Error parsing JSON data: {error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <h3 className="mb-2 font-semibold text-gray-800 text-lg">
            No Data Available
          </h3>
          <p className="text-gray-600">
            No data found to display in Kanban board.
          </p>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="w-full p-4">
        <CommandBar
          buttonGroups={[
            [
              {
                label: "Add",
                tooltip: "Create a new card",
                callback: handleAdd,
                icon: <Plus className="mr-1 h-4 w-4" />,
              },
              {
                label: "Edit",
                tooltip: "Edit selected card(s)",
                callback: handleEdit,
                icon: <Pencil className="mr-1 h-4 w-4" />,
                disabled: selectedItems.length !== 1,
              },
              {
                label: "Delete",
                tooltip: "Delete selected card(s)",
                callback: deleteSelectedItems,
                icon: <Trash className="mr-1 h-4 w-4" />,
                disabled: selectedItems.length === 0,
              },
            ],
          ]}
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h3 className="mb-2 font-semibold text-lg text-red-800">
            Kanban Rendering Error
          </h3>
          <p className="text-red-600">
            Error rendering Kanban board:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }
};

export default DynamicKanban;
