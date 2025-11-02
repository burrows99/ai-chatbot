"use client";

import groupBy from "lodash.groupby";
import {
  EyeIcon,
  LinkIcon,
  Pencil,
  Plus,
  Trash,
  TrashIcon,
} from "lucide-react";
import { useCallback, useMemo, useRef } from "react";
import { getRandomColor } from "@/components/business/base/utils";
import { CommandBar } from "@/components/business/command-bar/command-bar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const parseResult = useMemo(() => {
    try {
      const artifactDataRaw = contextData?.artifact?.canvasArtifact?.data;
      const contentData = artifactDataRaw?.data || artifactDataRaw;
      const dataArray = Array.isArray(contentData) ? contentData : [];

      if (JSON.stringify(dataArray) !== JSON.stringify(dataRef.current)) {
        dataRef.current = dataArray;
      }

      return {
        success: true,
        data: dataRef.current,
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        error: err instanceof Error ? err.message : "Invalid format",
      };
    }
  }, [contextData?.artifact?.canvasArtifact?.data]);

  const { data, error } = parseResult;
  const firstRecord = data[0] ?? {};

  const selectedItems = useMemo(() => {
    return contextData?.artifact?.canvasArtifact?.selectedItems || [];
  }, [contextData?.artifact?.canvasArtifact?.selectedItems]);

  const extractColumns = useCallback(
    (dataArray: any[]): GanttStatus[] => {
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
      } catch (err) {
        console.warn("Error extracting statuses from data:", err);
      }
      return [];
    },
    [firstRecord]
  );

  const detectFieldMappings = useCallback(
    (
      sampleRecord: any
    ): {
      idField: string;
      dateField: string;
      columnField: string;
      descriptionField: string;
    } => {
      const idKey =
        Object.keys(sampleRecord).find(
          (fieldNumber) => sampleRecord[fieldNumber]?.type?.name === "text"
        ) ||
        Object.keys(sampleRecord)[0] ||
        "field1";

      const dateKey =
        Object.keys(sampleRecord).find(
          (fieldNumber) => sampleRecord[fieldNumber]?.type?.name === "date"
        ) ||
        Object.keys(sampleRecord).find(
          (fieldNumber) => sampleRecord[fieldNumber]?.type?.name === "text"
        ) ||
        Object.keys(sampleRecord)[1] ||
        "field4";

      const columnKey =
        Object.keys(sampleRecord).find(
          (fieldNumber) => sampleRecord[fieldNumber]?.type?.name === "dropdown"
        ) ||
        Object.keys(sampleRecord).find((fieldNumber) =>
          Array.isArray(sampleRecord[fieldNumber]?.type?.allowedValues)
        ) ||
        "field3";

      const descriptionKey =
        Object.keys(sampleRecord).find(
          (fieldNumber) => sampleRecord[fieldNumber]?.type?.name === "textArea"
        ) || "field2";

      return {
        idField: idKey,
        dateField: dateKey,
        columnField: columnKey,
        descriptionField: descriptionKey,
      };
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h3 className="mb-2 font-semibold text-lg text-red-800">
            Invalid JSON for Gantt
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
          <p className="text-gray-600">No data found to display in Gantt.</p>
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
                callback: () => console.log("add"),
                icon: <Plus className="mr-1 h-4 w-4" />,
              },
              {
                label: "Edit",
                tooltip: "Edit selected card(s)",
                callback: () => console.log("edit"),
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h3 className="mb-2 font-semibold text-lg text-red-800">
            Gantt Rendering Error
          </h3>
          <p className="text-red-600">
            Error rendering Gantt Chart:{" "}
            {err instanceof Error ? err.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }
};

export default DynamicGantt;
