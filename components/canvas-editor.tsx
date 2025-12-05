import { memo, useCallback, useMemo, useState } from "react";
import { useCanvas } from "@/artifacts/canvas/context";
import { DataTableView } from "@/components/canvas/data-table-view";
import type { GanttTransformedData } from "@/components/canvas/gantt-view";
import GanttView from "@/components/canvas/gantt-view";
import type { KanbanTransformedData } from "@/components/canvas/kanban-view";
import KanbanView from "@/components/canvas/kanban-view";
import { InfoIcon } from "@/components/icons";
import { JsonViewer } from "@/components/json-viewer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type TableTransformedData,
  transformToGanttData,
  transformToKanbanData,
  transformToTableData,
} from "@/lib/artifacts/canvas/data-transformer";
import type { CanvasData } from "@/lib/artifacts/canvas/types";

type CanvasEditorProps = {
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  saveContent: (content: string, debounce: boolean) => void;
  status: "idle" | "streaming";
  content: string;
};

export const CanvasEditor = memo(function CanvasEditorComponent({
  currentVersionIndex: _currentVersionIndex,
  isCurrentVersion: _isCurrentVersion,
  saveContent: _saveContent,
  status: _status,
  content,
}: CanvasEditorProps) {
  const [activeTab, setActiveTab] = useState<"canvas" | "json">("canvas");
  const { entityRecords, metadata, updateEntityRecords, updateMetadata } =
    useCanvas();

  const contentData = useMemo(() => {
    if (!content || content.trim() === "") return null;
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }, [content]);

  const handleEntityRecordsChange = useCallback((update: { path: (string | number)[]; value: any }) => {
    const newRecords = structuredClone(entityRecords);
    let current = newRecords;
    
    for (let i = 0; i < update.path.length - 1; i++) {
      current = current[update.path[i]];
    }
    
    current[update.path[update.path.length - 1]] = update.value;
    updateEntityRecords(newRecords);
  }, [entityRecords, updateEntityRecords]);

  const handleMetadataChange = useCallback((update: { path: (string | number)[]; value: any }) => {
    if (!metadata) { 
      return;
    }
    
    const newMetadata = structuredClone(metadata);
    let current = newMetadata;
    
    for (let i = 0; i < update.path.length - 1; i++) {
      current = current[update.path[i]];
    }
    
    current[update.path[update.path.length - 1]] = update.value;
    updateMetadata(newMetadata);
  }, [metadata, updateMetadata]);

  const canvasData = useMemo<CanvasData | null>(() => {
    if (!entityRecords || !metadata) {
      return null;
    }
    return {
      entityRecords,
      metadata,
    };
  }, [entityRecords, metadata]);

  const tableData = useMemo<TableTransformedData | null>(() => {
    if (
      !canvasData ||
      !canvasData.metadata ||
      !canvasData.metadata.components
    ) {
      return null;
    }

    try {
      // Check if table component is visible
      const tableComponent = canvasData.metadata.components.find(
        (c) => c.type === "table"
      );

      if (!tableComponent || !tableComponent.isVisible) {
        return null;
      }

      return transformToTableData(canvasData);
    } catch (error) {
      console.error("Error transforming table data:", error);
      return null;
    }
  }, [canvasData]);

  const kanbanData = useMemo<KanbanTransformedData | null>(() => {
    if (
      !canvasData ||
      !canvasData.metadata ||
      !canvasData.metadata.components
    ) {
      return null;
    }

    try {
      // Check if kanban component is visible
      const kanbanComponent = canvasData.metadata.components.find(
        (c) => c.type === "kanban"
      );

      if (!kanbanComponent || !kanbanComponent.isVisible) {
        return null;
      }

      return transformToKanbanData(canvasData);
    } catch (error) {
      console.error("Error transforming kanban data:", error);
      return null;
    }
  }, [canvasData]);

  const ganttData = useMemo<GanttTransformedData | null>(() => {
    if (
      !canvasData ||
      !canvasData.metadata ||
      !canvasData.metadata.components
    ) {
      return null;
    }

    try {
      // Check if gantt component is visible
      const ganttComponent = canvasData.metadata.components.find(
        (c) => c.type === "gantt"
      );

      if (!ganttComponent || !ganttComponent.isVisible) {
        return null;
      }

      return transformToGanttData(canvasData);
    } catch (error) {
      console.error("Error transforming gantt data:", error);
      return null;
    }
  }, [canvasData]);

  return (
    <div className="flex h-full flex-col">
      <Tabs
        className="flex h-full flex-col"
        onValueChange={(v: string) => setActiveTab(v as "canvas" | "json")}
        value={activeTab}
      >
        <div className="mx-4 mt-4 flex items-center gap-2">
          <TabsList className="w-fit">
            <TabsTrigger value="canvas">Canvas</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline">
                <InfoIcon size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Canvas Provider State</DialogTitle>
                <DialogDescription>
                  Current state of entity records and metadata
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">
                    Entity Records ({entityRecords.length})
                  </h3>
                  <JsonViewer
                    data={entityRecords}
                    isEditable={true}
                    onChange={handleEntityRecordsChange}
                    rootName="entityRecords"
                  />
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">Metadata</h3>
                  <JsonViewer
                    data={metadata}
                    isEditable={true}
                    onChange={handleMetadataChange}
                    rootName="metadata"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent className="mt-0 flex-1 overflow-auto p-4" value="canvas">
          {!tableData && !kanbanData && !ganttData ? (
            <Card>
              <CardHeader>
                <CardTitle>No Visualization Available</CardTitle>
                <CardDescription>
                  No component is enabled or configured for this data.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {tableData && (
                <DataTableView
                  columns={tableData.columns}
                  data={tableData.data}
                />
              )}
              {kanbanData && (
                <KanbanView
                  columns={kanbanData.columns}
                  features={kanbanData.features}
                  users={[]}
                />
              )}
              {ganttData && (
                <GanttView
                  features={ganttData.features}
                  groups={ganttData.groups}
                  initiatives={ganttData.initiatives}
                  markers={ganttData.markers}
                  products={ganttData.products}
                  releases={ganttData.releases}
                  statuses={ganttData.statuses}
                  users={ganttData.users}
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent className="mt-0 flex-1 overflow-auto p-4" value="json">
          <CardDescription className="mb-4">
            Displaying document content (persisted data)
          </CardDescription>
          <JsonViewer data={contentData} rootName="" />
        </TabsContent>
      </Tabs>
    </div>
  );
});
