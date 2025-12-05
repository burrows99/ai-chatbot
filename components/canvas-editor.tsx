import { memo, useMemo, useState } from "react";
import type { GanttTransformedData } from "@/components/canvas/gantt-view";
import GanttView from "@/components/canvas/gantt-view";
import type { KanbanTransformedData } from "@/components/canvas/kanban-view";
import KanbanView from "@/components/canvas/kanban-view";
import { JsonViewer } from "@/components/json-viewer";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  transformToGanttData,
  transformToKanbanData,
} from "@/lib/artifacts/canvas/data-transformer";
import type { CanvasData } from "@/lib/artifacts/canvas/types";

type CanvasEditorProps = {
  content: string;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  saveContent: (content: string, debounce: boolean) => void;
  status: "idle" | "streaming";
};

export const CanvasEditor = memo(function CanvasEditorComponent({
  content,
  currentVersionIndex: _currentVersionIndex,
  isCurrentVersion: _isCurrentVersion,
  saveContent: _saveContent,
  status: _status,
}: CanvasEditorProps) {
  const [activeTab, setActiveTab] = useState<"canvas" | "json">("canvas");

  const canvasData = useMemo<CanvasData | null>(() => {
    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch {
      return null;
    }
  }, [content]);

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

  if (!canvasData) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Canvas Data</CardTitle>
            <CardDescription>
              Unable to parse canvas configuration. Please check the JSON
              structure.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Tabs
        className="flex h-full flex-col"
        onValueChange={(v: string) => setActiveTab(v as "canvas" | "json")}
        value={activeTab}
      >
        <TabsList className="mx-4 mt-4 w-fit">
          <TabsTrigger value="canvas">Canvas</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-0 flex-1 overflow-auto p-4" value="canvas">
          {!kanbanData && !ganttData ? (
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

        <TabsContent className="mt-0 flex-1 overflow-auto" value="json">
          <JsonViewer data={canvasData} rootName="" />
        </TabsContent>
      </Tabs>
    </div>
  );
});
