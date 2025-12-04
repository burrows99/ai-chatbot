import { memo, useMemo, useState } from "react";
import { CanvasGanttView } from "@/components/canvas/gantt-view";
import { CanvasKanbanView } from "@/components/canvas/kanban-view";
import { CanvasTableView } from "@/components/canvas/table-view";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type CanvasData,
  transformToGantt,
  transformToKanban,
  transformToTable,
} from "@/lib/canvas-transformers";

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
  const [activeView, setActiveView] = useState<
    "auto" | "kanban" | "table" | "gantt"
  >("auto");

  const canvasData = useMemo<CanvasData | null>(() => {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }, [content]);

  const { layout } = canvasData || {};

  // Determine which view to show based on layout config or active view
  const getViewToShow = () => {
    if (activeView !== "auto") {
      return activeView;
    }

    // Auto-detect based on layout visibility
    if (layout?.kanban?.visible) {
      return "kanban";
    }
    if (layout?.table?.visible) {
      return "table";
    }
    if (layout?.gantt?.visible) {
      return "gantt";
    }

    return "table"; // Default fallback
  };

  const currentView = getViewToShow();

  // Transform data based on current view
  const kanbanData = useMemo(() => {
    if (currentView === "kanban" && canvasData) {
      return transformToKanban(canvasData);
    }
    return null;
  }, [currentView, canvasData]);

  const tableData = useMemo(() => {
    if (currentView === "table" && canvasData) {
      return transformToTable(canvasData);
    }
    return null;
  }, [currentView, canvasData]);

  const ganttData = useMemo(() => {
    if (currentView === "gantt" && canvasData) {
      return transformToGantt(canvasData);
    }
    return null;
  }, [currentView, canvasData]);

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
      <div className="flex gap-2 border-b p-2">
        <Button
          onClick={() => setActiveView("auto")}
          size="sm"
          variant={activeView === "auto" ? "default" : "outline"}
        >
          Auto
        </Button>
        {layout?.kanban?.visible && (
          <Button
            onClick={() => setActiveView("kanban")}
            size="sm"
            variant={activeView === "kanban" ? "default" : "outline"}
          >
            Kanban
          </Button>
        )}
        {layout?.table?.visible && (
          <Button
            onClick={() => setActiveView("table")}
            size="sm"
            variant={activeView === "table" ? "default" : "outline"}
          >
            Table
          </Button>
        )}
        {layout?.gantt?.visible && (
          <Button
            onClick={() => setActiveView("gantt")}
            size="sm"
            variant={activeView === "gantt" ? "default" : "outline"}
          >
            Gantt
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {currentView === "kanban" && kanbanData && (
          <CanvasKanbanView transformedData={kanbanData} />
        )}
        {currentView === "table" && tableData && (
          <CanvasTableView transformedData={tableData} />
        )}
        {currentView === "gantt" && ganttData && (
          <CanvasGanttView transformedData={ganttData} />
        )}
      </div>
    </div>
  );
});
