import { memo, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type FieldType =
  | "number"
  | "text"
  | "id"
  | "textarea"
  | "date"
  | "select"
  | "checkbox";

type FieldConfig = {
  apiname: string;
  label: string;
  allowedvalues?: string[];
  defaultvalue?: any;
  type: FieldType;
};

type LayoutConfig = {
  kanban: {
    visible: boolean;
    position: "left" | "right" | "top" | "bottom";
    groupBy?: string;
  };
  table: {
    visible: boolean;
    position: "left" | "right" | "top" | "bottom";
  };
  gantt: {
    visible: boolean;
    position: "left" | "right" | "top" | "bottom";
    startDateField?: string;
    endDateField?: string;
  };
};

type CanvasData = {
  fieldConfig: FieldConfig[];
  data: Record<string, any>[];
  layout: LayoutConfig;
};

type CanvasEditorProps = {
  content: string;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  saveContent: (content: string, debounce: boolean) => void;
  status: "idle" | "streaming";
};

function KanbanView({
  data,
  fieldConfig,
  groupBy,
}: {
  data: Record<string, any>[];
  fieldConfig: FieldConfig[];
  groupBy?: string;
}) {
  const groupedData = useMemo(() => {
    if (!groupBy) {
      return { Ungrouped: data };
    }

    const groups: Record<string, Record<string, any>[]> = {};

    for (const item of data) {
      const groupValue = String(item[groupBy] || "Ungrouped");
      if (!groups[groupValue]) {
        groups[groupValue] = [];
      }
      groups[groupValue].push(item);
    }

    return groups;
  }, [data, groupBy]);

  const getFieldLabel = (apiname: string) => {
    return fieldConfig.find((f) => f.apiname === apiname)?.label || apiname;
  };

  return (
    <div className="flex h-full gap-4 overflow-x-auto p-4">
      {Object.entries(groupedData).map(([groupName, items]) => (
        <div className="w-80 flex-shrink-0" key={groupName}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between font-medium text-sm">
                {groupName}
                <Badge className="ml-2" variant="secondary">
                  {items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {items.map((item) => (
                    <Card key={JSON.stringify(item)}>
                      <CardContent className="p-3">
                        {Object.entries(item).map(([key, value]) => (
                          <div className="mb-2 text-sm" key={key}>
                            <span className="font-medium text-muted-foreground">
                              {getFieldLabel(key)}:
                            </span>{" "}
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

function TableView({
  data,
  fieldConfig,
}: {
  data: Record<string, any>[];
  fieldConfig: FieldConfig[];
}) {
  return (
    <div className="h-full overflow-auto p-4">
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              {fieldConfig.map((field) => (
                <th
                  className="px-4 py-2 text-left font-medium text-sm"
                  key={field.apiname}
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr className="border-t" key={JSON.stringify(row)}>
                {fieldConfig.map((field) => (
                  <td className="px-4 py-2 text-sm" key={field.apiname}>
                    {String(row[field.apiname] || "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GanttView({
  data,
  fieldConfig,
  startDateField,
  endDateField,
}: {
  data: Record<string, any>[];
  fieldConfig: FieldConfig[];
  startDateField?: string;
  endDateField?: string;
}) {
  const getFieldLabel = (apiname: string) => {
    return fieldConfig.find((f) => f.apiname === apiname)?.label || apiname;
  };

  const titleField =
    fieldConfig.find(
      (f) =>
        f.type === "text" &&
        f.apiname !== startDateField &&
        f.apiname !== endDateField
    )?.apiname || fieldConfig[0]?.apiname;

  return (
    <div className="h-full overflow-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Gantt Chart</CardTitle>
          <CardDescription>
            Timeline view of tasks
            {startDateField &&
              ` (${getFieldLabel(startDateField)} - ${endDateField ? getFieldLabel(endDateField) : "ongoing"})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.map((item) => {
              const startDate = startDateField ? item[startDateField] : null;
              const endDate = endDateField ? item[endDateField] : null;

              return (
                <Card key={JSON.stringify(item)}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {titleField
                            ? item[titleField]
                            : `Item ${data.indexOf(item) + 1}`}
                        </div>
                        <div className="mt-1 text-muted-foreground text-xs">
                          {startDate && (
                            <span>
                              {startDate}
                              {endDate && ` → ${endDate}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <Badge variant="outline">
                          {Object.keys(item).length} fields
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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

  const { fieldConfig, data, layout } = canvasData;

  // Determine which view to show based on layout config or active view
  const getViewToShow = () => {
    if (activeView !== "auto") {
      return activeView;
    }

    // Auto-detect based on layout visibility
    if (layout.kanban.visible) {
      return "kanban";
    }
    if (layout.table.visible) {
      return "table";
    }
    if (layout.gantt.visible) {
      return "gantt";
    }

    return "table"; // Default fallback
  };

  const currentView = getViewToShow();

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
        {layout.kanban.visible && (
          <Button
            onClick={() => setActiveView("kanban")}
            size="sm"
            variant={activeView === "kanban" ? "default" : "outline"}
          >
            Kanban
          </Button>
        )}
        {layout.table.visible && (
          <Button
            onClick={() => setActiveView("table")}
            size="sm"
            variant={activeView === "table" ? "default" : "outline"}
          >
            Table
          </Button>
        )}
        {layout.gantt.visible && (
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
        {currentView === "kanban" && (
          <KanbanView
            data={data}
            fieldConfig={fieldConfig}
            groupBy={layout.kanban.groupBy}
          />
        )}
        {currentView === "table" && (
          <TableView data={data} fieldConfig={fieldConfig} />
        )}
        {currentView === "gantt" && (
          <GanttView
            data={data}
            endDateField={layout.gantt.endDateField}
            fieldConfig={fieldConfig}
            startDateField={layout.gantt.startDateField}
          />
        )}
      </div>
    </div>
  );
});
