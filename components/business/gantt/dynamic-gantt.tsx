/** biome-ignore-all lint/correctness/useHookAtTopLevel: false positive */
/** biome-ignore-all lint/nursery/noShadow: intentional variable naming */
"use client";

import groupBy from "lodash.groupby";
import {
  EyeIcon,
  LinkIcon,
  MaximizeIcon,
  TrashIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  createStandardButtonGroups,
  createStandardHandlers,
  detectFieldMappings,
  extractColumns,
  filterDataBySearch,
  getRandomColor,
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { GanttStatus } from "@/components/ui/shadcn-io/gantt";
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
  const {
    canvasArtifactData,
    setCanvasArtifactData,
    ganttSelectedItems,
    setKanbanSelections,
    setGanttSelections,
    setDataGridSelections,
  } = useAIContext();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingData, setAddingData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomLevel, setZoomLevel] = useState(100);

  const firstRecord = canvasArtifactData[0] ?? {};

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

  const {
    idField,
    startDateField,
    endDateField,
    columnField,
    descriptionField,
  } = fieldMappings;
  const newColumns = useMemo(
    () => extractColumnsCallback(canvasArtifactData),
    [canvasArtifactData, extractColumnsCallback]
  );

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
          startAt: new Date(startDateValue),
          endAt: new Date(endDateValue),
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
  }, [
    canvasArtifactData,
    idField,
    startDateField,
    endDateField,
    columnField,
    descriptionField,
    newColumns,
    searchQuery,
    fieldMappings,
  ]);

  const groupedFeatures = groupBy(features, "group.name");
  const sortedGroupedFeatures = Object.fromEntries(
    Object.entries(groupedFeatures).sort(([nameA], [nameB]) =>
      nameA.localeCompare(nameB)
    )
  );

  const handleFeatureClick = useCallback(
    (featureId: string, event: React.MouseEvent | React.KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      let newSelection: string[];
      if (isCtrlOrCmd) {
        if (ganttSelectedItems.includes(featureId)) {
          newSelection = ganttSelectedItems.filter(
            (id: string) => id !== featureId
          );
        } else {
          newSelection = [...ganttSelectedItems, featureId];
        }
      } else {
        newSelection = [featureId];
      }
      setGanttSelections(newSelection);
    },
    [ganttSelectedItems, setGanttSelections]
  );

  const standardHandlers = useMemo(() => {
    return createStandardHandlers({
      setCanvasArtifactData,
      clearSelections: () => {
        setGanttSelections([]);
        setDataGridSelections([]);
        setKanbanSelections([]);
      },
      selectedItems: ganttSelectedItems,
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
    ganttSelectedItems,
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

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 25, 500));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 25, 25));
  }, []);

  const handleZoomToFit = useCallback(() => {
    setZoomLevel(100);
  }, []);

  const buttonGroups = useMemo(() => {
    const standardGroups = createStandardButtonGroups(
      { handleAdd, handleEdit, deleteSelectedItems },
      ganttSelectedItems
    );

    const zoomGroup = [
      {
        label: "",
        tooltip: "Zoom In",
        callback: handleZoomIn,
        icon: <ZoomInIcon className="h-4 w-4" />,
      },
      {
        label: "",
        tooltip: "Zoom Out",
        callback: handleZoomOut,
        icon: <ZoomOutIcon className="h-4 w-4" />,
      },
      {
        label: "",
        tooltip: "Zoom to Fit",
        callback: handleZoomToFit,
        icon: <MaximizeIcon className="h-4 w-4" />,
      },
    ];

    return [...standardGroups, zoomGroup];
  }, [
    handleAdd,
    handleEdit,
    deleteSelectedItems,
    ganttSelectedItems,
    handleZoomIn,
    handleZoomOut,
    handleZoomToFit,
  ]);

  const handleViewFeature = (id: string) =>
    console.log(`Feature selected: ${id}`);

  const handleCopyLink = (id: string) => console.log(`Copy link: ${id}`);

  const handleRemoveFeature = (id: string) => {
    const currentData = canvasArtifactData;

    if (!Array.isArray(currentData)) {
      return;
    }

    const updatedData = currentData.filter((item: any, index: number) => {
      const itemId = String(item[idField]?.value || `item-${index}`);
      return itemId !== id;
    });
    setCanvasArtifactData(updatedData);
    setGanttSelections(
      ganttSelectedItems.filter((selectedId: string) => selectedId !== id)
    );
  };

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

  if (!canvasArtifactData || canvasArtifactData.length === 0) {
    return (
      <div className="flex w-full items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              No data found to display in Gantt.
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
          searchPlaceholder="Search tasks..."
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
            title="Add Card"
          />
        )}

        <GanttProvider
          className="border"
          onAddItem={handleAddFeature}
          range="monthly"
          zoom={zoomLevel}
        >
          <GanttSidebar>
            {Object.entries(sortedGroupedFeatures).map(
              ([groupKey, groupFeatures]) => (
                <GanttSidebarGroup key={groupKey} name={groupKey}>
                  {groupFeatures.map((feature) => {
                    const isSelected = ganttSelectedItems.includes(feature.id);
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
                      const isSelected = ganttSelectedItems.includes(
                        feature.id
                      );
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
