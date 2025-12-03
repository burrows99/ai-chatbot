# Canvas Examples

This directory contains example data structures for the Canvas artifact feature.

## canvas-data-example.json

This example demonstrates:
- A project task management canvas with multiple views
- **Field Configuration**: 6 fields including ID, title, status, priority, and date fields
- **Data Records**: 5 sample tasks with varied statuses and priorities
- **Selection State**: Shows `isSelected` property usage (2 tasks selected)
- **Layout Config**: All three views enabled (Kanban, Table, Gantt)

### Features Demonstrated

#### Kanban View
- Groups tasks by Status (Todo, In Progress, Done)
- Displays all fields for each task card
- Shows selection state with ring border on selected cards
- Includes checkboxes for multi-select

#### Table View
- Displays all tasks in a structured table
- Header checkbox for select-all functionality
- Individual row checkboxes for selection
- Visual highlighting of selected rows

#### Gantt View
- Timeline visualization using startDate and endDate fields
- Shows task duration and scheduling
- Checkboxes for selection
- Badge showing field count per item

### Using This Example

To test the canvas with this data:
1. Start the development server
2. Create a new chat
3. Ask the AI to create a canvas artifact
4. The AI will generate canvas data similar to this structure
5. You can manually edit the canvas JSON to match this example for testing

### Data Structure

```typescript
{
  fieldConfig: FieldConfig[],  // Defines the schema
  data: DataRecord[],           // Array of records with isSelected
  layout: LayoutConfig          // View visibility and configuration
}
```

### Testing Multi-Select Features

With this example data loaded:
1. **Select/Deselect**: Click checkboxes on individual items
2. **Select All**: Use the table view header checkbox
3. **Add**: Click "Add" to create a new task with default values
4. **Edit**: Select one task and click "Edit" (placeholder implementation)
5. **Delete**: Select tasks and click "Delete" to remove them

### Expected Behavior

- Tasks with `isSelected: true` will be visually highlighted
- The toolbar will show "2 selected" initially
- Edit button is enabled only when exactly 1 item is selected
- Delete button is enabled when 1 or more items are selected
- Add button is always enabled
