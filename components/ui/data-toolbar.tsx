import * as React from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ToolbarProps {
  selectedCount?: number
  onAdd?: () => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function Toolbar({
  selectedCount = 0,
  onAdd,
  onEdit,
  onDelete,
  className,
}: ToolbarProps) {
  return (
    <div className={cn("flex items-center gap-2 border-b p-2", className)}>
      {onAdd && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAdd}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      )}
      {onEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          disabled={selectedCount !== 1}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      )}
      {onDelete && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          disabled={selectedCount === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      )}
      {selectedCount > 0 && (
        <span className="ml-auto text-sm text-muted-foreground">
          {selectedCount} selected
        </span>
      )}
    </div>
  )
}
