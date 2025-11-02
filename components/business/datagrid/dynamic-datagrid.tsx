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
  parseArtifactData,
} from "@/components/business/base/utils";
import { CommandBar } from "@/components/business/command-bar/command-bar";
import { DynamicDialog } from "@/components/business/dialog/dynamic-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

type DataGridItem = {
  id: string;
  [key: string]: any;
};

const DynamicDataGrid = () => {
  const { contextData, setArtifactData } = useAIContext();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingData, setAddingData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const parseResult = useMemo(() => {
    return parseArtifactData(contextData);
  }, [contextData]);

  const { data, error } = parseResult;
  const firstRecord = data[0] ?? {};

  // Get selected items from context
  const selectedItems = useMemo(() => {
    return contextData?.artifact?.canvasArtifact?.selectedItems || [];
  }, [contextData?.artifact?.canvasArtifact?.selectedItems]);

  const fieldMappings = useMemo(
    () => detectFieldMappings(firstRecord),
    [firstRecord]
  );
  const { idField } = fieldMappings;

  const gridItems = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    try {
      // Apply search filter first
      const filteredData = filterDataBySearch(data, searchQuery, fieldMappings);

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
  }, [data, idField, searchQuery, fieldMappings]);

  // Get all field keys for table headers (excluding id)
  const tableHeaders = useMemo(() => {
    if (!firstRecord || Object.keys(firstRecord).length === 0) {
      return [];
    }

    return Object.keys(firstRecord).map((fieldKey) => {
      const field = firstRecord[fieldKey];
      return {
        key: fieldKey,
        label: field?.label || fieldKey,
        type: field?.type?.name || "text",
      };
    });
  }, [firstRecord]);

  // Handle row selection
  const handleRowSelect = useCallback(
    (itemId: string, checked: boolean) => {
      const currentSelected = selectedItems || [];
      let newSelected: string[];

      if (checked) {
        newSelected = [...currentSelected, itemId];
      } else {
        newSelected = currentSelected.filter((id: string) => id !== itemId);
      }

      setArtifactData("canvasArtifact", { selectedItems: newSelected });
    },
    [selectedItems, setArtifactData]
  );

  // Handle select all
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      const newSelected = checked ? gridItems.map((item) => item.id) : [];
      setArtifactData("canvasArtifact", { selectedItems: newSelected });
    },
    [gridItems, setArtifactData]
  );

  // Create standard handlers using the shared utility
  const handlers = createStandardHandlers({
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

  const {
    handleEdit,
    handleAdd,
    handleSave,
    handleAddSave,
    deleteSelectedItems,
  } = handlers;

  // Create button groups using the shared utility
  const buttonGroups = createStandardButtonGroups(
    {
      handleAdd,
      handleEdit,
      deleteSelectedItems,
    },
    selectedItems
  );

  // Format cell value based on field type
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

  // Check if all items are selected
  const isAllSelected =
    gridItems.length > 0 && selectedItems.length === gridItems.length;
  const isIndeterminate =
    selectedItems.length > 0 && selectedItems.length < gridItems.length;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Alert>
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>
          No data available to display in the data grid.
        </AlertDescription>
      </Alert>
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
              const isSelected = selectedItems.includes(item.id);
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

      {/* Edit Dialog */}
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
