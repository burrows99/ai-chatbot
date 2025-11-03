import { Pencil, Plus, Trash } from "lucide-react";

export const getRandomColor = (): string => {
  const colors = [
    "#6B7280",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#EF4444",
    "#14B8A6",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Common types for business components
export type BaseColumn = {
  id: string;
  name: string;
  color: string;
};

export type FieldMappings = {
  idField: string;
  startDateField: string;
  endDateField: string;
  columnField: string;
  descriptionField: string;
};

export const extractColumns = (
  dataArray: any[],
  firstRecord: any
): BaseColumn[] => {
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
  } catch (error) {
    console.warn("Error extracting columns from data:", error);
  }
  return [];
};

export const detectFieldMappings = (sampleRecord: any): FieldMappings => {
  const idField =
    Object.keys(sampleRecord).find(
      (fieldNumber) => sampleRecord[fieldNumber]?.type?.name === "text"
    ) ||
    Object.keys(sampleRecord)[0] ||
    "field1";

  const startDateField =
    Object.keys(sampleRecord).find(
      (fieldNumber) => sampleRecord[fieldNumber]?.type?.name === "date"
    ) ||
    Object.keys(sampleRecord)[1] ||
    "field4";

  const endDateField =
    Object.keys(sampleRecord).find(
      (fieldNumber) =>
        sampleRecord[fieldNumber]?.type?.name === "date" &&
        fieldNumber !== startDateField
    ) ||
    Object.keys(sampleRecord)[1] ||
    "field5";

  const columnField =
    Object.keys(sampleRecord).find(
      (fieldNumber) => sampleRecord[fieldNumber]?.type?.name === "dropdown"
    ) ||
    Object.keys(sampleRecord).find((fieldNumber) =>
      Array.isArray(sampleRecord[fieldNumber]?.type?.allowedValues)
    ) ||
    "field3";

  const descriptionField =
    Object.keys(sampleRecord).find(
      (fieldNumber) => sampleRecord[fieldNumber]?.type?.name === "textArea"
    ) || "field2";

  return {
    idField,
    startDateField,
    endDateField,
    columnField,
    descriptionField,
  };
};

export const createEmptyRecord = (data: any[]): any => {
  if (!data || data.length === 0) {
    return null;
  }
  
  const clonedRecord = JSON.parse(JSON.stringify(data[0]));
  
  for (const fieldKey of Object.keys(clonedRecord)) {
    if (
      clonedRecord[fieldKey] &&
      typeof clonedRecord[fieldKey] === "object" &&
      clonedRecord[fieldKey].value !== undefined
    ) {
      clonedRecord[fieldKey].value = "";
    }
  }

  return clonedRecord;
};

export const findSelectedItem = (
  canvasArtifactData: Record<string, unknown>[],
  selectedItemId: string,
  idField: string
): any => {
  return canvasArtifactData.find((item: any, index: number) => {
    const itemId = String(item?.[idField]?.value ?? `item-${index}`);
    return itemId === selectedItemId;
  });
};

export const updateDataArray = (
  currentData: Record<string, unknown>[],
  selectedItemId: string,
  updatedFormData: Record<string, unknown>,
  idField: string
): Record<string, unknown>[] => {
  if (!Array.isArray(currentData)) {
    return currentData;
  }

  return currentData.map((item: Record<string, unknown>, index: number) => {
    const itemId = String(item?.[idField]?.value ?? `item-${index}`);
    if (itemId === selectedItemId) {
      return updatedFormData;
    }
    return item;
  });
};

export const addToDataArray = (
  currentData: Record<string, unknown>[],
  newFormData: Record<string, unknown>
): Record<string, unknown>[] => {
  if (!Array.isArray(currentData)) {
    return currentData;
  }

  return [...currentData, newFormData];
};

export const deleteFromDataArray = (
  currentData: Record<string, unknown>[],
  selectedItems: string[],
  idField: string
): Record<string, unknown>[] => {
  if (!Array.isArray(currentData)) {
    return currentData;
  }

  return currentData.filter((item: Record<string, unknown>, index: number) => {
    const itemId = String(item?.[idField]?.value ?? `item-${index}`);
    return !selectedItems.includes(itemId);
  });
};

export const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export const filterDataBySearch = (
  canvasArtifactData: Record<string, unknown>[],
  searchQuery: string,
  fieldMappings: FieldMappings
): Record<string, unknown>[] => {
  if (!searchQuery || !searchQuery.trim()) {
    return canvasArtifactData;
  }

  const query = searchQuery.toLowerCase().trim();

  return canvasArtifactData.filter((item: Record<string, unknown>) => {
    const fieldsToSearch = [
      fieldMappings.idField,
      fieldMappings.startDateField,
      fieldMappings.columnField,
      fieldMappings.descriptionField,
    ];

    return fieldsToSearch.some((fieldKey) => {
      const field = item[fieldKey];
      if (!field) {
        return false;
      }
      
      if (typeof field === "string") {
        return field.toLowerCase().includes(query);
      }

      if (field.value) {
        const value = String(field.value).toLowerCase();
        return value.includes(query);
      }

      return String(field).toLowerCase().includes(query);
    });
  });
};

export const createStandardHandlers = (params: {
  setCanvasArtifactData: (updated: Record<string, unknown>[]) => void;
  clearSelections: () => void;
  selectedItems: string[];
  idField: string;
  setEditingData: (data: Record<string, unknown>) => void;
  setEditDialogOpen: (open: boolean) => void;
  setAddingData: (data: Record<string, unknown>) => void;
  setAddDialogOpen: (open: boolean) => void;
  canvasArtifactData: Record<string, unknown>[];
}) => {
  const {
    setCanvasArtifactData,
    clearSelections,
    selectedItems,
    idField,
    setEditingData,
    setEditDialogOpen,
    setAddingData,
    setAddDialogOpen,
    canvasArtifactData,
  } = params;

  const handleEdit = () => {
    if (selectedItems.length !== 1) {
      return;
    }

    const [ selectedItemId ] = selectedItems;
    const selectedItem = findSelectedItem(
      canvasArtifactData,
      selectedItemId,
      idField
    );

    if (selectedItem) {
      setEditingData(selectedItem);
      setEditDialogOpen(true);
    }
  };

  const handleAdd = () => {
    const emptyRecord = createEmptyRecord(canvasArtifactData);
    setAddingData(emptyRecord);
    setAddDialogOpen(true);
  };

  const handleSave = (updatedFormData: Record<string, unknown>) => {
    if (!Array.isArray(canvasArtifactData)) {
      return;
    }

    const updatedData = updateDataArray(
      canvasArtifactData,
      selectedItems[0],
      updatedFormData,
      idField
    );
    setCanvasArtifactData(updatedData);
  };

  const handleAddSave = (newFormData: Record<string, unknown>) => {
    if (!Array.isArray(canvasArtifactData)) {
      return;
    }

    const updatedData = addToDataArray(canvasArtifactData, newFormData);
    setCanvasArtifactData(updatedData);
  };

  const deleteSelectedItems = () => {
    if (selectedItems.length === 0) {
      return;
    }

    if (!Array.isArray(canvasArtifactData)) {
      return;
    }

    const updatedData = deleteFromDataArray(canvasArtifactData, selectedItems, idField);
    setCanvasArtifactData(updatedData);
    clearSelections();
  };

  return {
    handleEdit,
    handleAdd,
    handleSave,
    handleAddSave,
    deleteSelectedItems,
  };
};

export const createStandardButtonGroups = (
  handlers: {
    handleAdd: () => void;
    handleEdit: () => void;
    deleteSelectedItems: () => void;
  },
  selectedItems: string[]
) => {
  return [
    [
      {
        label: "Add",
        tooltip: "Create a new card",
        callback: handlers.handleAdd,
        icon: <Plus className="mr-1 h-4 w-4" />,
      },
      {
        label: "Edit",
        tooltip: "Edit selected card(s)",
        callback: handlers.handleEdit,
        disabled: selectedItems.length !== 1,
        icon: <Pencil className="mr-1 h-4 w-4" />,
      },
      {
        label: "Delete",
        tooltip: "Delete selected card(s)",
        callback: handlers.deleteSelectedItems,
        disabled: selectedItems.length === 0,
        icon: <Trash className="mr-1 h-4 w-4" />,
      },
    ],
  ];
};