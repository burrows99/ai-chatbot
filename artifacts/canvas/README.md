# Canvas Artifact

The Canvas artifact provides configurable data visualizations with multiple view modes: Kanban, Table, and Gantt charts.

## Structure

The Canvas artifact uses a JSON structure with three main sections:

### 1. Field Configuration

Define the data structure with field metadata:

```typescript
fieldConfig: [
  {
    apiname: string,        // API/database field name
    label: string,          // Human-readable label
    type: "number" | "text" | "id" | "textarea" | "date" | "select" | "checkbox",
    allowedvalues?: string[],  // For select fields
    defaultvalue?: any         // Default value
  }
]
```

### 2. Data

Provide data records that match the field configuration:

```typescript
data: [
  {
    [apiname]: value  // Each record has fields matching fieldConfig
  }
]
```

### 3. Layout

Configure which views are visible and their settings:

```typescript
layout: {
  kanban: {
    visible: boolean,
    position: "left" | "right" | "top" | "bottom",
    groupBy?: string  // Field apiname to group cards by
  },
  table: {
    visible: boolean,
    position: "left" | "right" | "top" | "bottom"
  },
  gantt: {
    visible: boolean,
    position: "left" | "right" | "top" | "bottom",
    startDateField?: string,  // Field apiname for start date
    endDateField?: string     // Field apiname for end date
  }
}
```

## Example

Here's a complete example for a project management canvas:

```json
{
  "fieldConfig": [
    {
      "apiname": "id",
      "label": "Task ID",
      "type": "id"
    },
    {
      "apiname": "title",
      "label": "Task Title",
      "type": "text"
    },
    {
      "apiname": "status",
      "label": "Status",
      "type": "select",
      "allowedvalues": ["Todo", "In Progress", "Review", "Done"],
      "defaultvalue": "Todo"
    },
    {
      "apiname": "priority",
      "label": "Priority",
      "type": "select",
      "allowedvalues": ["Low", "Medium", "High"],
      "defaultvalue": "Medium"
    },
    {
      "apiname": "startDate",
      "label": "Start Date",
      "type": "date"
    },
    {
      "apiname": "endDate",
      "label": "End Date",
      "type": "date"
    }
  ],
  "data": [
    {
      "id": "T-001",
      "title": "Setup project repository",
      "status": "Done",
      "priority": "High",
      "startDate": "2024-01-01",
      "endDate": "2024-01-03"
    },
    {
      "id": "T-002",
      "title": "Design database schema",
      "status": "In Progress",
      "priority": "High",
      "startDate": "2024-01-02",
      "endDate": "2024-01-05"
    },
    {
      "id": "T-003",
      "title": "Implement authentication",
      "status": "Todo",
      "priority": "Medium",
      "startDate": "2024-01-06",
      "endDate": "2024-01-10"
    }
  ],
  "layout": {
    "kanban": {
      "visible": true,
      "position": "left",
      "groupBy": "status"
    },
    "table": {
      "visible": true,
      "position": "right"
    },
    "gantt": {
      "visible": true,
      "position": "bottom",
      "startDateField": "startDate",
      "endDateField": "endDate"
    }
  }
}
```

## Views

### Kanban View
- Groups items by a specified field (typically status or category)
- Displays cards in columns
- Shows all field values for each item

### Table View
- Displays all data in a structured table format
- Shows columns for each field in fieldConfig
- Supports all defined field types

### Gantt View
- Timeline-based visualization
- Requires startDateField and endDateField to be specified
- Shows task duration and relationships

## View Modes

The artifact supports two display modes:

1. **Canvas Mode**: Interactive visualizations (Kanban, Table, or Gantt)
2. **JSON Mode**: Raw JSON view for editing or copying

Switch between modes using the toolbar button.

## Creating a Canvas

To create a canvas artifact, use natural language like:

- "Create a project management canvas with tasks"
- "Show me a kanban board for tracking issues"
- "Create a timeline view for project milestones"

The AI will generate appropriate fieldConfig, data, and layout based on your request.

## Updating a Canvas

You can ask the AI to:
- Add or remove fields
- Update data records
- Change layout configuration
- Switch between view types
- Modify grouping or date fields
