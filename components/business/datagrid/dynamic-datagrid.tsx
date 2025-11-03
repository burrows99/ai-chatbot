/** biome-ignore-all lint/correctness/useHookAtTopLevel: false positive */
/** biome-ignore-all lint/nursery/noShadow: intentional variable naming */
"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createStandardButtonGroups,
  createStandardHandlers,
  dateFormatter,
  detectFieldMappings,
  filterDataBySearch,
} from "@/components/business/base/utils";
import { CommandBar } from "@/components/business/command-bar/command-bar";
import { DynamicDialog } from "@/components/business/dialog/dynamic-dialog";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAIContext } from "@/lib/ai/context/ai-context";
import { cn } from "@/lib/utils";
import type { FieldConfig } from "@/artifacts/canvas/blueprint";

type DataGridItem = {
  id: string;
  [key: string]: any;
};

const DynamicDataGrid = () => {
  const {
    canvasArtifactData,
    setCanvasArtifactData,
    dataGridSelectedItems,
    setKanbanSelections,
    setGanttSelections,
    setDataGridSelections,
  } = useAIContext();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingData, setAddingData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const firstRecord = canvasArtifactData[0] ?? {};

  const fieldMappings = useMemo(
    () => detectFieldMappings(firstRecord),
    [firstRecord]
  );
  const { idField } = fieldMappings;

  const gridItems = useMemo(() => {
    if (!canvasArtifactData || canvasArtifactData.length === 0) {
      return [];
    }

    try {
      const filteredData = filterDataBySearch(canvasArtifactData, searchQuery, fieldMappings);

      return filteredData.map((item: any, index: number) => {
        const idValue = item[idField]?.value || `item-${index}`;
        const itemData: DataGridItem = {
          id: String(idValue),
        };

        // Add all field values to the item
        for (const fieldKey of Object.keys(item)) {
          const field = item[fieldKey];
          if (field && typeof field === "object" && field.value !== undefined) {
            itemData[fieldKey] = field.value;
          }
        }

        return itemData;
      });
    } catch (err) {
      console.error("Error processing grid items:", err);
      return [];
    }
  }, [canvasArtifactData, idField, searchQuery, fieldMappings]);

  const tableHeaders = useMemo(() => {
    const record = firstRecord as Record<string, Partial<FieldConfig>>;
    if (!record || Object.keys(record).length === 0) {
      return [];
    }

    return Object.keys(record).map((fieldKey) => {
      const field = record[fieldKey];
      return {
        key: fieldKey,
        label: field?.label ?? fieldKey,
        type: field?.type?.name ?? "text",
      };
    });
  }, [firstRecord]);

  // Handle row selection
  const handleRowSelect = useCallback(
    (itemId: string, checked: boolean) => {
      const currentSelected = dataGridSelectedItems || [];
      let newSelected: string[];

      if (checked) {
        newSelected = [...currentSelected, itemId];
      } else {
        newSelected = currentSelected.filter((id: string) => id !== itemId);
      }

      setDataGridSelections(newSelected);
    },
    [dataGridSelectedItems, setDataGridSelections]
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      const newSelected = checked ? gridItems.map((item) => item.id) : [];
      setDataGridSelections(newSelected);
    },
    [gridItems, setDataGridSelections]
  );

  const handlers = createStandardHandlers({
    setCanvasArtifactData,
    clearSelections: () => {
      setGanttSelections([]);
      setDataGridSelections([]);
      setKanbanSelections([]);
    },
    selectedItems: dataGridSelectedItems,
    idField,
    setEditingData,
    setEditDialogOpen,
    setAddingData,
    setAddDialogOpen,
    canvasArtifactData,
  });

  const {
    handleEdit,
    handleAdd,
    handleSave,
    handleAddSave,
    deleteSelectedItems,
  } = handlers;

  const buttonGroups = createStandardButtonGroups(
    {
      handleAdd,
      handleEdit,
      deleteSelectedItems,
    },
    dataGridSelectedItems
  );

  const formatCellValue = useCallback((value: any, type: string) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    switch (type) {
      case "date": {
        try {
          const date = new Date(value);
          return dateFormatter.format(date);
        } catch {
          return value;
        }
      }
      case "dropdown":
        return value;
      case "textarea":
        return value.length > 50 ? `${value.substring(0, 50)}...` : value;
      default:
        return value;
    }
  }, []);
  
  const isAllSelected =
    gridItems.length > 0 && dataGridSelectedItems.length === gridItems.length;
  const isIndeterminate =
    dataGridSelectedItems.length > 0 &&
    dataGridSelectedItems.length < gridItems.length;

  if (!canvasArtifactData || canvasArtifactData.length === 0) {
    return (
      <div className="flex w-full items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              No data available to display in the data grid.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <CommandBar
        buttonGroups={buttonGroups}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search items..."
        searchValue={searchQuery}
        showSearch={true}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  ref={(el) => {
                    if (el && "indeterminate" in el) {
                      (el as any).indeterminate = isIndeterminate;
                    }
                  }}
                />
              </TableHead>
              {tableHeaders.map((header) => (
                <TableHead key={header.key}>{header.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {gridItems.map((item) => {
              const isSelected = dataGridSelectedItems.includes(item.id);
              return (
                <TableRow
                  className={cn("cursor-pointer", isSelected && "bg-muted/50")}
                  key={item.id}
                  onClick={() => handleRowSelect(item.id, !isSelected)}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleRowSelect(item.id, checked as boolean)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  {tableHeaders.map((header) => (
                    <TableCell key={header.key}>
                      {formatCellValue(item[header.key], header.type)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {editingData && (
        <DynamicDialog
          data={editingData}
          onOpenChange={setEditDialogOpen}
          onSave={handleSave}
          open={editDialogOpen}
          title="Edit Item"
        />
      )}

      {/* Add Dialog */}
      {addingData && (
        <DynamicDialog
          data={addingData}
          onOpenChange={setAddDialogOpen}
          onSave={handleAddSave}
          open={addDialogOpen}
          title="Add New Item"
        />
      )}
    </div>
  );
};

export default DynamicDataGrid;
