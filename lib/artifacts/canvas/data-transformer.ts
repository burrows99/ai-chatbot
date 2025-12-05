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

    // Try to find a title/name field
    const nameField =
      getFieldValue(record, "title") ||
      getFieldValue(record, "name") ||
      getFieldValue(record, "subject") ||
      record.recordId;

    // Try to find date fields for startAt/endAt
    const dueDateStr =
      getFieldValue(record, "dueDate") ||
      getFieldValue(record, "endDate") ||
      getFieldValue(record, "targetDate");

    const startDateStr =
      getFieldValue(record, "startDate") ||
      getFieldValue(record, "createdDate") ||
      dueDateStr;

    const startAt = startDateStr ? new Date(startDateStr) : new Date();
    const endAt = dueDateStr ? new Date(dueDateStr) : new Date();

    // Try to find owner/assignee
    const ownerName =
      getFieldValue(record, "assignee") ||
      getFieldValue(record, "owner") ||
      getFieldValue(record, "responsiblePerson") ||
      "Unassigned";

    // Try to find description
    const description =
      getFieldValue(record, "description") ||
      getFieldValue(record, "notes") ||
      getFieldValue(record, "details");

    // Try to find priority
    const priority =
      getFieldValue(record, "priority") || getFieldValue(record, "importance");

    // Collect other metadata fields
    const metadata: Record<string, string> = {};
    record.fields.map((field) => {
      const excludedFields = [
        "title",
        "name",
        "subject",
        "description",
        "notes",
        "details",
        "priority",
        "importance",
        "dueDate",
        "endDate",
        "targetDate",
        "startDate",
        "createdDate",
        "assignee",
        "owner",
        "responsiblePerson",
        columnFieldApiName,
      ];
      if (!excludedFields.includes(field.apiName) && field.value) {
        metadata[field.label || field.apiName] = field.value;
        return;
      }
      return;
    });

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
  const features: GanttFeature[] = data.entityRecords.map((record, index) => {
    // Get dates
    const startDateStr = getFieldValue(record, startDateFieldApiName);
    const endDateStr = getFieldValue(record, endDateFieldApiName);
    const startAt = startDateStr ? new Date(startDateStr) : new Date();
    const endAt = endDateStr ? new Date(endDateStr) : new Date();

    // Get name
    const name =
      getFieldValue(record, "title") ||
      getFieldValue(record, "name") ||
      getFieldValue(record, "subject") ||
      record.recordId;

    // Get status
    const statusName =
      getFieldValue(record, "status") ||
      getFieldValue(record, "state") ||
      "To Do";
    if (!statusMap.has(statusName)) {
      statusMap.set(statusName, {
        id: `status-${statusMap.size}`,
        name: statusName,
        color: STATUS_COLORS[statusMap.size % STATUS_COLORS.length],
      });
    }
    const status = statusMap.get(statusName)!;

    // Get owner
    const ownerName =
      getFieldValue(record, "assignee") ||
      getFieldValue(record, "owner") ||
      getFieldValue(record, "responsiblePerson") ||
      "Unassigned";
    if (!userMap.has(ownerName)) {
      userMap.set(ownerName, {
        id: ownerName.toLowerCase().replace(/\s+/g, "-"),
        name: ownerName,
        image: generateAvatarUrl(ownerName),
      });
    }
    const owner = userMap.get(ownerName)!;

    // Get group
    const groupName = getFieldValue(record, groupByFieldApiName) || "Default";
    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, {
        id: `group-${groupMap.size}`,
        name: groupName,
      });
    }
    const group = groupMap.get(groupName)!;

    // Get optional fields
    const productName = getFieldValue(record, "product");
    let product;
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
    let initiative;
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
    let release;
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
      const milestoneDate = getFieldValue(record, "milestone");
      if (!milestoneDate) return null;

      const milestoneName =
        getFieldValue(record, "milestoneName") ||
        getFieldValue(record, "title") ||
        getFieldValue(record, "name") ||
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
