# Canvas Toolbar and Multi-Select Feature

## Overview
This update enhances the Canvas artifact with a toolbar and multi-select functionality, following shadcn/ui patterns and documentation.

## New Features

### 1. Data Toolbar
A toolbar component with the following actions:
- **Add**: Create new records
- **Edit**: Modify selected record (enabled when exactly 1 item is selected)
- **Delete**: Remove selected records (enabled when items are selected)
- **Selection Counter**: Shows count of selected items

### 2. Multi-Select Support
All three views (Kanban, Table, and Gantt) now support multi-select:

#### Table View
- Checkbox column for row selection
- Header checkbox for select-all functionality
- Visual indication of selected rows (highlighted background)

#### Kanban View
- Checkbox at the top of each card
- Selected cards are highlighted with a ring border
- Maintains selection state across column groups

#### Gantt View
- Checkbox for each timeline item
- Selected items highlighted with a ring border
- Selection persists during view changes

### 3. Selection State Management
- Each data record now includes an `isSelected` property
- Selection state persists in the canvas JSON data
- Changes are automatically saved to the content

## Technical Implementation

### New Components Added

#### `components/ui/checkbox.tsx`
Shadcn checkbox component built on Radix UI:
```typescript
<Checkbox
  checked={item.isSelected}
  onCheckedChange={() => handleToggle(index)}
/>
```

#### `components/ui/table.tsx`
Complete shadcn table component set:
- Table, TableHeader, TableBody, TableFooter
- TableRow, TableHead, TableCell, TableCaption
- Supports selection state with `data-state` attribute

#### `components/ui/data-toolbar.tsx`
Custom toolbar component:
```typescript
<Toolbar
  selectedCount={count}
  onAdd={handleAdd}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### Updated Components

#### `components/canvas-editor.tsx`
Major updates:
- Added `DataRecord` type with `isSelected?: boolean`
- Local state management for selection tracking
- Selection handlers: `handleToggleSelect`, `handleToggleSelectAll`
- Toolbar action handlers: `handleAdd`, `handleEdit`, `handleDelete`
- All views updated to support selection callbacks

## Data Structure Changes

### DataRecord Type
```typescript
type DataRecord = Record<string, any> & {
  isSelected?: boolean;
};
```

### Example Canvas Data
```json
{
  "fieldConfig": [
    { "apiname": "title", "label": "Title", "type": "text" },
    { "apiname": "status", "label": "Status", "type": "select" }
  ],
  "data": [
    {
      "title": "Task 1",
      "status": "Todo",
      "isSelected": false
    },
    {
      "title": "Task 2",
      "status": "Done",
      "isSelected": true
    }
  ],
  "layout": {
    "kanban": { "visible": true, "groupBy": "status" },
    "table": { "visible": true },
    "gantt": { "visible": true }
  }
}
```

## Usage Examples

### Creating a Canvas with Selection
Users can prompt:
- "Create a task board with 5 tasks"
- "Make a project timeline"

The system will generate data with `isSelected: false` for all items.

### Interacting with Selection
1. **Select Items**: Click checkboxes to select/deselect items
2. **Select All** (Table view): Use header checkbox to toggle all
3. **Add New Item**: Click "Add" button to create a new record
4. **Edit Item**: Select one item and click "Edit"
5. **Delete Items**: Select items and click "Delete" to remove them

## Accessibility
- Checkboxes have proper `aria-label` attributes
- Table rows show selection state with `data-state` attribute
- Keyboard navigation supported via Radix UI components
- Visual feedback for selected items

## Browser Support
- All modern browsers (Chrome, Firefox, Safari, Edge)
- Follows shadcn/ui compatibility requirements
- Requires React 18+ for concurrent features

## Future Enhancements
1. Bulk edit functionality for multiple selections
2. Selection persistence across sessions
3. Keyboard shortcuts (Ctrl+A for select-all)
4. Context menu for selected items
5. Drag-and-drop for selected items

## Related Documentation
- [shadcn/ui Checkbox](https://ui.shadcn.com/docs/components/checkbox)
- [shadcn/ui Table](https://ui.shadcn.com/docs/components/table)
- [shadcn/ui Data Table Example](https://ui.shadcn.com/docs/components/data-table)
