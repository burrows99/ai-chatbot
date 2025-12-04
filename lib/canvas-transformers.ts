/**
 * Canvas Data Transformers
 *
 * This module is responsible for transforming canvas data into the format
 * required by the shadcn components (Kanban, Table, and Gantt).
 */

import type { ColumnDef } from "@/components/ui/shadcn-io/table";

export type FieldType =
  | "number"
  | "text"
  | "id"
  | "textarea"
  | "date"
  | "select"
  | "checkbox";

export type FieldConfig = {
  apiname: string;
  label: string;
  allowedvalues?: string[];
  defaultvalue?: any;
  type: FieldType;
};

export type LayoutConfig = {
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

export type CanvasData = {
  fieldConfig: FieldConfig[];
  data: Record<string, any>[];
  layout?: LayoutConfig;
};

// Kanban Transformation Types
export type KanbanColumn = {
  id: string;
  name: string;
  color?: string;
};

export type KanbanFeature = {
  id: string;
  name: string;
  column: string;
  [key: string]: any;
};

export type KanbanTransformedData = {
  columns: KanbanColumn[];
  features: KanbanFeature[];
};

/**
 * Transform canvas data to Kanban format
 * @param canvasData - The raw canvas data
 * @returns Transformed data for Kanban component
 *
 * @todo This function currently returns empty data. Implementation is pending.
 * The function should extract groupBy fields, create columns, assign colors,
 * and transform data items to include proper column references and IDs.
 */
export function transformToKanban(
  _canvasData: CanvasData
): KanbanTransformedData {
  // TODO: Implement transformation logic
  // 1. Extract groupBy field from layout.kanban.groupBy
  // 2. Get unique values from groupBy field to create columns
  // 3. Assign colors to columns (can use predefined color palette)
  // 4. Transform data items to include column reference
  // 5. Ensure each item has an id and name field

  return {
    columns: [],
    features: [],
  };
}

// Table Transformation Types
export type TableTransformedData<TData = any> = {
  columns: ColumnDef<TData>[];
  data: TData[];
};

/**
 * Transform canvas data to Table format
 * @param canvasData - The raw canvas data
 * @returns Transformed data for Table component
 *
 * @todo This function currently returns empty data. Implementation is pending.
 * The function should map fieldConfig to ColumnDef format with proper
 * accessorKeys, headers, and cell renderers based on field types.
 */
export function transformToTable<TData = any>(
  _canvasData: CanvasData
): TableTransformedData<TData> {
  // TODO: Implement transformation logic
  // 1. Map fieldConfig to ColumnDef format
  // 2. For each field, create a column definition with:
  //    - accessorKey from field.apiname
  //    - header from field.label
  //    - appropriate cell renderer based on field.type
  // 3. Return data as-is or with minimal transformation

  return {
    columns: [],
    data: [] as TData[],
  };
}

// Gantt Transformation Types
export type GanttFeature = {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status?: { name: string; color: string };
  owner?: { name: string; image: string };
  group?: { id: string; name: string };
  [key: string]: any;
};

export type GanttTransformedData = {
  features: GanttFeature[];
  groups: Record<string, GanttFeature[]>;
};

/**
 * Transform canvas data to Gantt format
 * @param canvasData - The raw canvas data
 * @returns Transformed data for Gantt component
 *
 * @todo This function currently returns empty data. Implementation is pending.
 * The function should extract date fields, transform to Date objects, generate IDs,
 * and group features appropriately for the Gantt view.
 */
export function transformToGantt(
  _canvasData: CanvasData
): GanttTransformedData {
  // TODO: Implement transformation logic
  // 1. Extract startDateField and endDateField from layout.gantt
  // 2. Transform date strings to Date objects
  // 3. Extract or generate id and name fields
  // 4. Group features by a relevant field (e.g., status, owner, or custom group)
  // 5. Sort groups alphabetically or by custom logic

  return {
    features: [],
    groups: {},
  };
}

/**
 * Helper function to generate a unique ID if not present
 */
export function generateId(_item: Record<string, any>, index: number): string {
  // TODO: Implement ID generation logic
  // Try to use existing ID field, or generate from index
  return `item-${index}`;
}

/**
 * Helper function to extract name/title field
 */
export function extractName(
  _item: Record<string, any>,
  _fieldConfig: FieldConfig[]
): string {
  // TODO: Implement name extraction logic
  // Find the first text field that could serve as a name/title
  // Or use a predefined field like 'name', 'title', etc.
  return "Untitled";
}

/**
 * Helper function to parse date strings to Date objects
 */
export function parseDate(_dateValue: any): Date | null {
  // TODO: Implement date parsing logic
  // Handle various date formats (ISO strings, timestamps, etc.)
  return null;
}

/**
 * Helper function to get color for a value (for status, priority, etc.)
 */
export function getColorForValue(_value: string, index: number): string {
  // TODO: Implement color assignment logic
  // Use a predefined color palette and assign colors based on value or index
  const colors = [
    "#6B7280", // gray
    "#F59E0B", // amber
    "#10B981", // green
    "#3B82F6", // blue
    "#EF4444", // red
    "#8B5CF6", // purple
  ];
  return colors[index % colors.length];
}
