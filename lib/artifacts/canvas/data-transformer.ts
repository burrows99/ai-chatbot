import type { ColumnDef } from "@tanstack/react-table";
import type {
  GanttFeature,
  GanttGroup,
  GanttStatus,
  GanttTransformedData,
  GanttUser,
} from "@/components/canvas/gantt-view";
import type {
  KanbanColumn,
  KanbanFeature,
  KanbanTransformedData,
} from "@/components/canvas/kanban-view";
import type {
  CanvasData,
  EntityRecord,
  GanttComponent,
  KanbanComponent,
} from "./types";

export type TableTransformedData = {
  columns: ColumnDef<Record<string, string>, string>[];
  data: Record<string, string>[];
};

const COLUMN_COLORS = [
  "#6B7280", // Gray
  "#F59E0B", // Amber
  "#10B981", // Green
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EF4444", // Red
  "#EC4899", // Pink
  "#14B8A6", // Teal
];

function generateAvatarUrl(name: string): string {
  // Generate a simple avatar using UI Avatars service
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=random`;
}

function getFieldValue(
  record: EntityRecord,
  apiName: string
): string | undefined {
  const field = record.fields.find((f) => f.apiName === apiName);
  return field?.value;
}

// Field mapping configuration for semantic field lookup
const FIELD_MAPPINGS = {
  name: ["title", "name", "subject"],
  description: ["description", "notes", "details"],
  priority: ["priority", "importance"],
  dueDate: ["dueDate", "endDate", "targetDate"],
  startDate: ["startDate", "createdDate"],
  owner: ["assignee", "owner", "responsiblePerson"],
  status: ["status", "state"],
  milestone: ["milestone"],
  milestoneName: ["milestoneName", "title", "name"],
} as const;

// Get the first matching field value from a list of possible field names
function getFieldValueByMapping(
  record: EntityRecord,
  fieldNames: readonly string[]
): string | undefined {
  for (const fieldName of fieldNames) {
    const value = getFieldValue(record, fieldName);
    if (value) {
      return value;
    }
  }
  return;
}

// Collect all field API names that are used for specific purposes
function getUsedFieldNames(
  _record: EntityRecord,
  ...additionalFields: string[]
): Set<string> {
  const usedFields = new Set<string>(additionalFields);

  // Add all semantic mapping fields
  for (const fieldNames of Object.values(FIELD_MAPPINGS)) {
    for (const fieldName of fieldNames) {
      usedFields.add(fieldName);
    }
  }

  return usedFields;
}

export function transformToTableData(data: CanvasData): TableTransformedData {
  if (!data.entityRecords || data.entityRecords.length === 0) {
    return {
      columns: [],
      data: [],
    };
  }

  // Collect all unique field names from all records
  const fieldSet = new Set<string>();
  const fieldLabels = new Map<string, string>();

  for (const record of data.entityRecords) {
    for (const field of record.fields) {
      fieldSet.add(field.apiName);
      // Use label if available, otherwise use apiName
      if (!fieldLabels.has(field.apiName)) {
        fieldLabels.set(field.apiName, field.label || field.apiName);
      }
    }
  }

  // Create columns from unique fields
  const columns: ColumnDef<Record<string, string>, string>[] = Array.from(
    fieldSet
  ).map((apiName) => ({
    accessorKey: apiName,
    header: fieldLabels.get(apiName) || apiName,
  }));

  // Transform entity records into table rows
  const tableData: Record<string, string>[] = data.entityRecords.map(
    (record) => {
      const row: Record<string, string> = {};

      for (const field of record.fields) {
        row[field.apiName] = field.value || "";
      }

      return row;
    }
  );

  return {
    columns,
    data: tableData,
  };
}

export function transformToKanbanData(data: CanvasData): KanbanTransformedData {
  // Find the kanban component configuration
  const kanbanComponent = data.metadata.components.find(
    (c) => c.type === "kanban"
  ) as KanbanComponent | undefined;

  if (!kanbanComponent) {
    throw new Error("No kanban component found in metadata");
  }

  const columnFieldApiName = kanbanComponent.columnField.apiName;
  const allowedValues = kanbanComponent.columnField.allowedValues;

  // Create columns from allowed values
  const columns: KanbanColumn[] = allowedValues.map((value, index) => ({
    id: `column-${index}`,
    name: value,
    color: COLUMN_COLORS[index % COLUMN_COLORS.length],
  }));

  // Create a map for quick column lookup
  const columnMap = new Map(
    columns.map((col, index) => [allowedValues[index], col.id])
  );

  // Transform entity records into features
  const features: KanbanFeature[] = data.entityRecords.map((record) => {
    // Get the column value for this record
    const columnValue = getFieldValue(record, columnFieldApiName) || "";
    const columnId = columnMap.get(columnValue) || columns[0]?.id || "";

    // Use field mappings for semantic field lookup
    const nameField =
      getFieldValueByMapping(record, FIELD_MAPPINGS.name) || record.recordId;

    const dueDateStr = getFieldValueByMapping(record, FIELD_MAPPINGS.dueDate);
    const startDateStr =
      getFieldValueByMapping(record, FIELD_MAPPINGS.startDate) || dueDateStr;

    const startAt = startDateStr ? new Date(startDateStr) : new Date();
    const endAt = dueDateStr ? new Date(dueDateStr) : new Date();

    const ownerName =
      getFieldValueByMapping(record, FIELD_MAPPINGS.owner) || "Unassigned";

    const description = getFieldValueByMapping(
      record,
      FIELD_MAPPINGS.description
    );

    const priority = getFieldValueByMapping(record, FIELD_MAPPINGS.priority);

    // Collect other metadata fields, excluding known semantic fields
    const usedFields = getUsedFieldNames(record, columnFieldApiName);
    const metadata: Record<string, string> = {};
    for (const field of record.fields) {
      if (!usedFields.has(field.apiName) && field.value) {
        metadata[field.label || field.apiName] = field.value;
      }
    }

    return {
      id: record.recordId,
      name: nameField,
      description,
      priority,
      startAt,
      endAt,
      column: columnId,
      owner: {
        id: ownerName.toLowerCase().replace(/\s+/g, "-"),
        name: ownerName,
        image: generateAvatarUrl(ownerName),
      },
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };
  });

  return {
    columns,
    features,
  };
}

const STATUS_COLORS = [
  "#6B7280", // Gray - Planned
  "#F59E0B", // Amber - In Progress
  "#10B981", // Green - Done
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EF4444", // Red
];

const MARKER_CLASSES = [
  "bg-blue-100 text-blue-900",
  "bg-green-100 text-green-900",
  "bg-purple-100 text-purple-900",
  "bg-red-100 text-red-900",
  "bg-orange-100 text-orange-900",
  "bg-teal-100 text-teal-900",
];

export function transformToGanttData(data: CanvasData): GanttTransformedData {
  // Find the gantt component configuration
  const ganttComponent = data.metadata.components.find(
    (c) => c.type === "gantt"
  ) as GanttComponent | undefined;

  if (!ganttComponent) {
    throw new Error("No gantt component found in metadata");
  }

  const startDateFieldApiName = ganttComponent.startDateField.apiName;
  const endDateFieldApiName = ganttComponent.endDateField.apiName;
  const groupByFieldApiName = ganttComponent.groupByField.apiName;

  // Collect unique statuses
  const statusMap = new Map<string, GanttStatus>();
  const userMap = new Map<string, GanttUser>();
  const groupMap = new Map<string, GanttGroup>();
  const productMap = new Map<string, { id: string; name: string }>();
  const initiativeMap = new Map<string, { id: string; name: string }>();
  const releaseMap = new Map<string, { id: string; name: string }>();

  // Transform entity records into features
  const features: GanttFeature[] = data.entityRecords.map((record) => {
    // Get dates from configured fields
    const startDateStr = getFieldValue(record, startDateFieldApiName);
    const endDateStr = getFieldValue(record, endDateFieldApiName);
    const startAt = startDateStr ? new Date(startDateStr) : new Date();
    const endAt = endDateStr ? new Date(endDateStr) : new Date();

    // Use field mappings for semantic field lookup
    const name =
      getFieldValueByMapping(record, FIELD_MAPPINGS.name) || record.recordId;

    const statusName =
      getFieldValueByMapping(record, FIELD_MAPPINGS.status) || "To Do";
    if (!statusMap.has(statusName)) {
      statusMap.set(statusName, {
        id: `status-${statusMap.size}`,
        name: statusName,
        color: STATUS_COLORS[statusMap.size % STATUS_COLORS.length],
      });
    }
    const status = statusMap.get(statusName);
    if (!status) {
      throw new Error(`Status not found for: ${statusName}`);
    }

    const ownerName =
      getFieldValueByMapping(record, FIELD_MAPPINGS.owner) || "Unassigned";
    if (!userMap.has(ownerName)) {
      userMap.set(ownerName, {
        id: ownerName.toLowerCase().replace(/\s+/g, "-"),
        name: ownerName,
        image: generateAvatarUrl(ownerName),
      });
    }
    const owner = userMap.get(ownerName);
    if (!owner) {
      throw new Error(`Owner not found for: ${ownerName}`);
    }

    // Get group from configured field
    const groupName = getFieldValue(record, groupByFieldApiName) || "Default";
    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, {
        id: `group-${groupMap.size}`,
        name: groupName,
      });
    }
    const group = groupMap.get(groupName);
    if (!group) {
      throw new Error(`Group not found for: ${groupName}`);
    }

    // Get optional fields
    const productName = getFieldValue(record, "product");
    let product: { id: string; name: string } | undefined;
    if (productName) {
      if (!productMap.has(productName)) {
        productMap.set(productName, {
          id: `product-${productMap.size}`,
          name: productName,
        });
      }
      product = productMap.get(productName);
    }

    const initiativeName = getFieldValue(record, "initiative");
    let initiative: { id: string; name: string } | undefined;
    if (initiativeName) {
      if (!initiativeMap.has(initiativeName)) {
        initiativeMap.set(initiativeName, {
          id: `initiative-${initiativeMap.size}`,
          name: initiativeName,
        });
      }
      initiative = initiativeMap.get(initiativeName);
    }

    const releaseName = getFieldValue(record, "release");
    let release: { id: string; name: string } | undefined;
    if (releaseName) {
      if (!releaseMap.has(releaseName)) {
        releaseMap.set(releaseName, {
          id: `release-${releaseMap.size}`,
          name: releaseName,
        });
      }
      release = releaseMap.get(releaseName);
    }

    return {
      id: record.recordId,
      name,
      startAt,
      endAt,
      status,
      owner,
      group,
      product,
      initiative,
      release,
    };
  });

  // Generate markers from milestone fields
  const markers = data.entityRecords
    .map((record, index) => {
      const milestoneDate = getFieldValueByMapping(
        record,
        FIELD_MAPPINGS.milestone
      );
      if (!milestoneDate) {
        return null;
      }

      const milestoneName =
        getFieldValueByMapping(record, FIELD_MAPPINGS.milestoneName) ||
        "Milestone";

      return {
        id: `marker-${index}`,
        date: new Date(milestoneDate),
        label: milestoneName,
        className: MARKER_CLASSES[index % MARKER_CLASSES.length],
      };
    })
    .filter((m) => m !== null);

  return {
    statuses: Array.from(statusMap.values()),
    users: Array.from(userMap.values()),
    groups: Array.from(groupMap.values()),
    products: Array.from(productMap.values()),
    initiatives: Array.from(initiativeMap.values()),
    releases: Array.from(releaseMap.values()),
    features,
    markers,
  };
}
