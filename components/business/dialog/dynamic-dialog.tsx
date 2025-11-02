import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type FieldType = {
  apiName: string;
  value: string;
  label: string;
  type: {
    name: "text" | "textarea" | "dropdown" | "date";
    allowedValues?: string[];
    format?: string;
  };
};

type FormData = {
  [key: string]: FieldType;
};

type DynamicDialogProps = {
  data: FormData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onSave?: (updatedData: FormData) => void;
};

export function DynamicDialog({
  data,
  open,
  onOpenChange,
  title = "Default Title",
  description = "Click save when you're done.",
  onSave,
}: DynamicDialogProps) {
  const [formData, setFormData] = useState<FormData>(data);

  // Reset form data when dialog opens or data changes
  useEffect(() => {
    if (open) {
      setFormData(data);
    }
  }, [open, data]);

  const handleChange = (fieldKey: string, newValue: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        value: newValue,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    onOpenChange(false);
  };

  const renderField = (fieldKey: string, field: FieldType) => {
    const { label, value, type } = field;

    switch (type.name) {
      case "text":
        return (
          <div className="grid gap-3" key={fieldKey}>
            <Label htmlFor={fieldKey}>{label}</Label>
            <Input
              id={fieldKey}
              name={field.apiName}
              onChange={(e) => handleChange(fieldKey, e.target.value)}
              value={value}
            />
          </div>
        );

      case "textarea":
        return (
          <div className="grid gap-3" key={fieldKey}>
            <Label htmlFor={fieldKey}>{label}</Label>
            <Textarea
              id={fieldKey}
              name={field.apiName}
              onChange={(e) => handleChange(fieldKey, e.target.value)}
              value={value}
            />
          </div>
        );

      case "dropdown":
        return (
          <div className="grid gap-3" key={fieldKey}>
            <Label htmlFor={fieldKey}>{label}</Label>
            <Select
              onValueChange={(newValue) => handleChange(fieldKey, newValue)}
              value={value}
            >
              <SelectTrigger id={fieldKey}>
                <SelectValue placeholder={`Select ${label}`} />
              </SelectTrigger>
              <SelectContent>
                {type.allowedValues?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "date":
        return (
          <div className="grid gap-3" key={fieldKey}>
            <Label htmlFor={fieldKey}>{label}</Label>
            <Input
              id={fieldKey}
              name={field.apiName}
              onChange={(e) => handleChange(fieldKey, e.target.value)}
              type="date"
              value={value}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {Object.entries(formData).map(([fieldKey, field]) =>
              renderField(fieldKey, field)
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Usage in DynamicGantt:
// const [editDialogOpen, setEditDialogOpen] = useState(false);
// const [editingData, setEditingData] = useState<FormData | null>(null);
//
// const handleEdit = () => {
//   if (selectedItems.length === 1) {
//     const selectedItem = data.find(item =>
//       String(item[idField]?.value) === selectedItems[0]
//     );
//     if (selectedItem) {
//       setEditingData(selectedItem);
//       setEditDialogOpen(true);
//     }
//   }
// };
//
// <DynamicDialog
//   data={editingData || {}}
//   open={editDialogOpen}
//   onOpenChange={setEditDialogOpen}
//   onSave={(updatedData) => {
//     // Handle save logic
//     console.log(updatedData);
//   }}
// />
