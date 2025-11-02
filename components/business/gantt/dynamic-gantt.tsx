/** biome-ignore-all lint/correctness/useHookAtTopLevel: false positive */
/** biome-ignore-all lint/nursery/noShadow: intentional variable naming */
"use client";

import groupBy from "lodash.groupby";
import {
  EyeIcon,
  LinkIcon,
  TrashIcon,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  createStandardButtonGroups,
  createStandardHandlers,
  detectFieldMappings,
  extractColumns,
  getRandomColor,
  parseArtifactData,
} from "@/components/business/base/utils";
import { CommandBar } from "@/components/business/command-bar/command-bar";
import { DynamicDialog } from "@/components/business/dialog/dynamic-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type {
  // GanttFeature,
  GanttStatus,
} from "@/components/ui/shadcn-io/gantt";
import {
  GanttCreateMarkerTrigger,
  GanttFeatureItem,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttHeader,
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttToday,
} from "@/components/ui/shadcn-io/gantt";
import { useAIContext } from "@/lib/ai/context/ai-context";
import { cn } from "@/lib/utils";

const DynamicGantt = () => {
  const { contextData, setArtifactData } = useAIContext();
  const dataRef = useRef<any[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingData, setAddingData] = useState<any>(null);

  const parseResult = useMemo(() => {
    const result = parseArtifactData(contextData);

    // Only update ref if data actually changed
    if (JSON.stringify(result.data) !== JSON.stringify(dataRef.current)) {
      dataRef.current = result.data;
    }

    return {
      ...result,
      data: dataRef.current,
    };
  }, [contextData]);

  const { data, error } = parseResult;
  const firstRecord = data[0] ?? {};

  const selectedItems = useMemo(() => {
    return contextData?.artifact?.canvasArtifact?.selectedItems || [];
  }, [contextData?.artifact?.canvasArtifact?.selectedItems]);

  const extractColumnsCallback = useCallback(
    (dataArray: any[]): GanttStatus[] => {
      const columns = extractColumns(dataArray, firstRecord);
      return columns.map((col) => ({
        id: col.id,
        name: col.name,
        color: col.color,
      }));
    },
    [firstRecord]
  );

  const fieldMappings = useMemo(
    () => detectFieldMappings(firstRecord),
    [firstRecord]
  );

  const { idField, dateField, columnField, descriptionField } = fieldMappings;
  const newColumns = useMemo(
    () => extractColumnsCallback(data),
    [data, extractColumnsCallback]
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
        const statusObj = newColumns.find(
          (s) => s.id === String(columnValue)
        ) || {
          id: String(columnValue),
          name: String(columnValue),
          color: getRandomColor(),
        };
        return {
          id: String(idValue),
          name: String(nameValue),
          description: String(descriptionValue),
          startAt: new Date(dateValue),
          endAt: new Date(dateValue),
          status: statusObj,
          owner: {
            name: item.owner?.value || "Unassigned",
            image: item.owner?.image || "",
          },
          group: {
            id: String(columnValue),
            name: String(columnValue),
          },
        };
      });
    } catch (err) {
      console.error("Error mapping data to features:", err);
      return [];
    }
  }, [data, idField, dateField, columnField, descriptionField, newColumns]);

  const groupedFeatures = groupBy(features, "group.name");
  const sortedGroupedFeatures = Object.fromEntries(
    Object.entries(groupedFeatures).sort(([nameA], [nameB]) =>
      nameA.localeCompare(nameB)
    )
  );

  // Handle feature selection
  const handleFeatureClick = useCallback(
    (featureId: string, event: React.MouseEvent | React.KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      let newSelection: string[];
      if (isCtrlOrCmd) {
        if (selectedItems.includes(featureId)) {
          newSelection = selectedItems.filter((id: string) => id !== featureId);
        } else {
          newSelection = [...selectedItems, featureId];
        }
      } else {
        newSelection = [featureId];
      }
      setArtifactData("canvasArtifact", { selectedItems: newSelection });
    },
    [selectedItems, setArtifactData]
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

  const handleViewFeature = (id: string) =>
    console.log(`Feature selected: ${id}`);

  const handleCopyLink = (id: string) => console.log(`Copy link: ${id}`);

  const handleRemoveFeature = (id: string) => {
    const currentArtifactData = contextData?.artifact?.canvasArtifact?.data;
    const currentData = currentArtifactData?.data || currentArtifactData;

    if (!Array.isArray(currentData)) {
      return;
    }

    // Filter out the specific item
    const updatedData = currentData.filter((item: any, index: number) => {
      const itemId = String(item[idField]?.value || `item-${index}`);
      return itemId !== id;
    });

    setArtifactData("canvasArtifact", {
      data: updatedData,
      selectedItems: selectedItems.filter(
        (selectedId: string) => selectedId !== id
      ),
    });
  };

  const _handleRemoveMarker = (id: string) =>
    console.log(`Remove marker: ${id}`);

  const handleCreateMarker = (date: Date) =>
    console.log(`Create marker: ${date.toISOString()}`);

  const handleMoveFeature = (id: string, startAt: Date, endAt: Date | null) => {
    if (!endAt) {
      return;
    }
    console.log(
      `Move feature requested: ${id} from ${startAt} to ${endAt} (Gantt is read-only, use Kanban to modify)`
    );
  };

  const handleAddFeature = (date: Date) =>
    console.log(
      `Add feature: ${date.toISOString()} (Gantt is read-only, use Kanban to modify)`
    );

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Alert className="max-w-md" variant="destructive">
          <AlertTitle>Invalid JSON for Gantt</AlertTitle>
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
            <CardDescription>No data found to display in Gantt.</CardDescription>
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
            title="Add Card"
          />
        )}

        <GanttProvider
          className="border"
          onAddItem={handleAddFeature}
          range="monthly"
          zoom={100}
        >
          <GanttSidebar>
            {Object.entries(sortedGroupedFeatures).map(
              ([groupKey, groupFeatures]) => (
                <GanttSidebarGroup key={groupKey} name={groupKey}>
                  {groupFeatures.map((feature) => {
                    const isSelected = selectedItems.includes(feature.id);
                    return (
                      <GanttSidebarItem
                        className={cn(isSelected && "bg-secondary")}
                        feature={feature}
                        key={feature.id}
                        onSelectItem={(id, event) =>
                          handleFeatureClick(id, event)
                        }
                      />
                    );
                  })}
                </GanttSidebarGroup>
              )
            )}
          </GanttSidebar>
          <GanttTimeline>
            <GanttHeader />
            <GanttFeatureList>
              {Object.entries(sortedGroupedFeatures).map(
                ([groupKey, groupFeatures]) => (
                  <GanttFeatureListGroup key={groupKey}>
                    {groupFeatures.map((feature) => {
                      const isSelected = selectedItems.includes(feature.id);
                      return (
                        <div className="flex" key={feature.id}>
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <button
                                onClick={() => handleViewFeature(feature.id)}
                                type="button"
                              >
                                <GanttFeatureItem
                                  onMove={handleMoveFeature}
                                  {...feature}
                                  className={cn(
                                    isSelected && "ring-2 ring-primary"
                                  )}
                                >
                                  <p className="flex-1 truncate text-xs">
                                    {feature.name}
                                  </p>
                                  {feature.owner && (
                                    <Avatar className="h-4 w-4">
                                      <AvatarImage src={feature.owner.image} />
                                      <AvatarFallback>
                                        {feature.owner.name?.slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </GanttFeatureItem>
                              </button>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem
                                className="flex items-center gap-2"
                                onClick={() => handleViewFeature(feature.id)}
                              >
                                <EyeIcon
                                  className="text-muted-foreground"
                                  size={16}
                                />
                                View feature
                              </ContextMenuItem>
                              <ContextMenuItem
                                className="flex items-center gap-2"
                                onClick={() => handleCopyLink(feature.id)}
                              >
                                <LinkIcon
                                  className="text-muted-foreground"
                                  size={16}
                                />
                                Copy link
                              </ContextMenuItem>
                              <ContextMenuItem
                                className="flex items-center gap-2 text-destructive"
                                onClick={() => handleRemoveFeature(feature.id)}
                              >
                                <TrashIcon size={16} />
                                Remove from roadmap
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        </div>
                      );
                    })}
                  </GanttFeatureListGroup>
                )
              )}
            </GanttFeatureList>
            <GanttToday />
            <GanttCreateMarkerTrigger onCreateMarker={handleCreateMarker} />
          </GanttTimeline>
        </GanttProvider>
      </div>
    );
  } catch (err) {
    console.error("Error rendering Gantt Chart:", err);
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Alert className="max-w-md" variant="destructive">
          <AlertTitle>Gantt Rendering Error</AlertTitle>
          <AlertDescription>
            Error rendering Gantt Chart:{" "}
            {err instanceof Error ? err.message : "Unknown error"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
};

export default DynamicGantt;
