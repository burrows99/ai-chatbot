import { memo, useMemo, useState, useCallback, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Toolbar } from "@/components/ui/data-toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  layout?: LayoutConfig;
};

type DataRecord = Record<string, any> & {
  isSelected?: boolean;
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
  onToggleSelect,
}: {
  data: DataRecord[];
  fieldConfig: FieldConfig[];
  groupBy?: string;
  onToggleSelect: (index: number) => void;
}) {
  const groupedData = useMemo(() => {
    if (!groupBy) {
      return { Ungrouped: data.map((item, idx) => ({ item, originalIndex: idx })) };
    }

    const groups: Record<string, { item: DataRecord; originalIndex: number }[]> = {};

    for (const [idx, item] of data.entries()) {
      const groupValue = String(item[groupBy] || "Ungrouped");
      if (!groups[groupValue]) {
        groups[groupValue] = [];
      }
      groups[groupValue].push({ item, originalIndex: idx });
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
                  {items.map(({ item, originalIndex }) => (
                    <Card 
                      key={originalIndex}
                      className={item.isSelected ? "ring-2 ring-primary" : ""}
                    >
                      <CardContent className="p-3">
                        <div className="mb-2 flex items-start gap-2">
                          <Checkbox
                            checked={item.isSelected || false}
                            onCheckedChange={() => onToggleSelect(originalIndex)}
                          />
                          <div className="flex-1">
                            {Object.entries(item)
                              .filter(([key]) => key !== "isSelected")
                              .map(([key, value]) => (
                                <div className="mb-2 text-sm" key={key}>
                                  <span className="font-medium text-muted-foreground">
                                    {getFieldLabel(key)}:
                                  </span>{" "}
                                  <span>{String(value)}</span>
                                </div>
                              ))}
                          </div>
                        </div>
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
  onToggleSelect,
  onToggleSelectAll,
}: {
  data: DataRecord[];
  fieldConfig: FieldConfig[];
  onToggleSelect: (index: number) => void;
  onToggleSelectAll: () => void;
}) {
  const allSelected = data.length > 0 && data.every((item) => item.isSelected);
  const someSelected = data.some((item) => item.isSelected) && !allSelected;

  return (
    <div className="h-full overflow-auto p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleSelectAll}
                aria-label="Select all"
                className={someSelected ? "opacity-50" : ""}
              />
            </TableHead>
            {fieldConfig.map((field) => (
              <TableHead key={field.apiname}>{field.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow
              key={index}
              data-state={row.isSelected ? "selected" : undefined}
            >
              <TableCell>
                <Checkbox
                  checked={row.isSelected || false}
                  onCheckedChange={() => onToggleSelect(index)}
                  aria-label={`Select row ${index + 1}`}
                />
              </TableCell>
              {fieldConfig.map((field) => (
                <TableCell key={field.apiname}>
                  {String(row[field.apiname] || "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function GanttView({
  data,
  fieldConfig,
  startDateField,
  endDateField,
  onToggleSelect,
}: {
  data: DataRecord[];
  fieldConfig: FieldConfig[];
  startDateField?: string;
  endDateField?: string;
  onToggleSelect: (index: number) => void;
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
            {data.map((item, index) => {
              const startDate = startDateField ? item[startDateField] : null;
              const endDate = endDateField ? item[endDateField] : null;

              return (
                <Card 
                  key={index}
                  className={item.isSelected ? "ring-2 ring-primary" : ""}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={item.isSelected || false}
                        onCheckedChange={() => onToggleSelect(index)}
                      />
                      <div className="flex flex-1 items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {titleField
                              ? item[titleField]
                              : `Item ${index + 1}`}
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
                            {Object.keys(item).filter(k => k !== "isSelected").length} fields
                          </Badge>
                        </div>
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
  saveContent,
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

  // Local state for data with selection
  const [localData, setLocalData] = useState<DataRecord[]>([]);

  // Initialize localData when canvasData changes
  useEffect(() => {
    if (canvasData?.data) {
      setLocalData(
        canvasData.data.map((item) => ({
          ...item,
          isSelected: item.isSelected || false,
        }))
      );
    }
  }, [canvasData]);

  // Selection handlers
  const handleToggleSelect = useCallback((index: number) => {
    setLocalData((prev) => {
      const newData = [...prev];
      newData[index] = {
        ...newData[index],
        isSelected: !newData[index].isSelected,
      };
      
      // Save to content
      if (canvasData) {
        const updatedCanvas = {
          ...canvasData,
          data: newData,
        };
        saveContent(JSON.stringify(updatedCanvas, null, 2), true);
      }
      
      return newData;
    });
  }, [canvasData, saveContent]);

  const handleToggleSelectAll = useCallback(() => {
    setLocalData((prev) => {
      const allSelected = prev.every((item) => item.isSelected);
      const newData = prev.map((item) => ({
        ...item,
        isSelected: !allSelected,
      }));
      
      // Save to content
      if (canvasData) {
        const updatedCanvas = {
          ...canvasData,
          data: newData,
        };
        saveContent(JSON.stringify(updatedCanvas, null, 2), true);
      }
      
      return newData;
    });
  }, [canvasData, saveContent]);

  // Toolbar handlers
  const handleAdd = useCallback(() => {
    // Create a new record with default values
    const newRecord: DataRecord = { isSelected: false };
    
    if (canvasData?.fieldConfig) {
      for (const field of canvasData.fieldConfig) {
        newRecord[field.apiname] = field.defaultvalue || "";
      }
    }

    setLocalData((prev) => {
      const newData = [...prev, newRecord];
      
      // Save to content
      if (canvasData) {
        const updatedCanvas = {
          ...canvasData,
          data: newData,
        };
        saveContent(JSON.stringify(updatedCanvas, null, 2), true);
      }
      
      return newData;
    });
  }, [canvasData, saveContent]);

  const handleEdit = useCallback(() => {
    // For now, just log that edit was clicked
    // In a real implementation, this would open an edit dialog
    const selectedIndex = localData.findIndex((item) => item.isSelected);
    if (selectedIndex !== -1) {
      console.log("Edit item at index:", selectedIndex);
    }
  }, [localData]);

  const handleDelete = useCallback(() => {
    setLocalData((prev) => {
      const newData = prev.filter((item) => !item.isSelected);
      
      // Save to content
      if (canvasData) {
        const updatedCanvas = {
          ...canvasData,
          data: newData,
        };
        saveContent(JSON.stringify(updatedCanvas, null, 2), true);
      }
      
      return newData;
    });
  }, [canvasData, saveContent]);

  const selectedCount = localData.filter((item) => item.isSelected).length;

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

  const { fieldConfig, layout } = canvasData;

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

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        selectedCount={selectedCount}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
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
        {currentView === "kanban" && (
          <KanbanView
            data={localData}
            fieldConfig={fieldConfig}
            groupBy={layout?.kanban?.groupBy}
            onToggleSelect={handleToggleSelect}
          />
        )}
        {currentView === "table" && (
          <TableView 
            data={localData} 
            fieldConfig={fieldConfig}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
          />
        )}
        {currentView === "gantt" && (
          <GanttView
            data={localData}
            endDateField={layout?.gantt?.endDateField}
            fieldConfig={fieldConfig}
            startDateField={layout?.gantt?.startDateField}
            onToggleSelect={handleToggleSelect}
          />
        )}
      </div>
    </div>
  );
});
