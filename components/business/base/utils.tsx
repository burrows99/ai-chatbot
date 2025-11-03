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

// Common data parsing utility
export const parseArtifactData = (contextData: any) => {
  try {
    const artifactDataRaw = contextData?.artifact?.canvasArtifact?.data;
    const contentData = artifactDataRaw?.data || artifactDataRaw;
    const dataArray = Array.isArray(contentData) ? contentData : [];

    return {
      success: true,
      data: dataArray,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Invalid format",
    };
  }
};

// Extract columns from data array
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

// Detect field mappings from sample record
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

// Create a cloned record with cleared values for adding new items
export const createEmptyRecord = (data: any[]): any => {
  if (!data || data.length === 0) {
    return null;
  }

  // Clone the first record
  const clonedRecord = JSON.parse(JSON.stringify(data[0]));

  // Clear all field values
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

// Find selected item from data array
export const findSelectedItem = (
  data: any[],
  selectedItemId: string,
  idField: string
): any => {
  return data.find((item: any, index: number) => {
    const itemId = String(item[idField]?.value || `item-${index}`);
    return itemId === selectedItemId;
  });
};

// Update data array with edited item
export const updateDataArray = (
  currentData: any[],
  selectedItemId: string,
  updatedFormData: any,
  idField: string
): any[] => {
  if (!Array.isArray(currentData)) {
    return currentData;
  }

  return currentData.map((item: any, index: number) => {
    const itemId = String(item[idField]?.value || `item-${index}`);
    if (itemId === selectedItemId) {
      return updatedFormData;
    }
    return item;
  });
};

// Add new item to data array
export const addToDataArray = (currentData: any[], newFormData: any): any[] => {
  if (!Array.isArray(currentData)) {
    return currentData;
  }

  return [...currentData, newFormData];
};

// Delete selected items from data array
export const deleteFromDataArray = (
  currentData: any[],
  selectedItems: string[],
  idField: string
): any[] => {
  if (!Array.isArray(currentData)) {
    return currentData;
  }

  return currentData.filter((item: any, index: number) => {
    const itemId = String(item[idField]?.value || `item-${index}`);
    return !selectedItems.includes(itemId);
  });
};

// Common date formatters
export const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

// Filter data based on search query
export const filterDataBySearch = (
  data: any[],
  searchQuery: string,
  fieldMappings: FieldMappings
): any[] => {
  if (!searchQuery || !searchQuery.trim()) {
    return data;
  }

  const query = searchQuery.toLowerCase().trim();

  return data.filter((item) => {
    // Search in all mapped fields
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

      // Handle different field types
      if (typeof field === "string") {
        return field.toLowerCase().includes(query);
      }

      if (field.value) {
        const value = String(field.value).toLowerCase();
        return value.includes(query);
      }

      // Fallback to string conversion
      return String(field).toLowerCase().includes(query);
    });
  });
};

// Shared button group utilities
export const createStandardHandlers = (params: {
  contextData: any;
  setArtifactData: (key: string, data: any) => void;
  selectedItems: string[];
  idField: string;
  setEditingData: (data: any) => void;
  setEditDialogOpen: (open: boolean) => void;
  setAddingData: (data: any) => void;
  setAddDialogOpen: (open: boolean) => void;
  data: any[];
}) => {
  const {
    contextData,
    setArtifactData,
    selectedItems,
    idField,
    setEditingData,
    setEditDialogOpen,
    setAddingData,
    setAddDialogOpen,
    data,
  } = params;

  const handleEdit = () => {
    if (selectedItems.length !== 1) {
      return;
    }

    const selectedItemId = selectedItems[0];
    const selectedItem = findSelectedItem(data, selectedItemId, idField);

    if (selectedItem) {
      setEditingData(selectedItem);
      setEditDialogOpen(true);
    }
  };

  const handleAdd = () => {
    const emptyRecord = createEmptyRecord(data);
    setAddingData(emptyRecord);
    setAddDialogOpen(true);
  };

  const handleSave = (updatedFormData: any) => {
    const currentArtifactData = contextData?.artifact?.canvasArtifact?.data;
    const currentData = currentArtifactData?.data || currentArtifactData;

    if (!Array.isArray(currentData)) {
      return;
    }

    const updatedData = updateDataArray(
      currentData,
      selectedItems[0],
      updatedFormData,
      idField
    );
    setArtifactData("canvasArtifact", { data: updatedData });
  };

  const handleAddSave = (newFormData: any) => {
    const currentArtifactData = contextData?.artifact?.canvasArtifact?.data;
    const currentData = currentArtifactData?.data || currentArtifactData;

    if (!Array.isArray(currentData)) {
      return;
    }

    const updatedData = addToDataArray(currentData, newFormData);
    setArtifactData("canvasArtifact", { data: updatedData });
  };

  const deleteSelectedItems = () => {
    if (selectedItems.length === 0) {
      return;
    }

    const currentArtifactData = contextData?.artifact?.canvasArtifact?.data;
    const currentData = currentArtifactData?.data || currentArtifactData;

    if (!Array.isArray(currentData)) {
      return;
    }

    const updatedData = deleteFromDataArray(
      currentData,
      selectedItems,
      idField
    );
    setArtifactData("canvasArtifact", {
      data: updatedData,
      selectedItems: [],
    });
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