import { memo, useMemo } from "react";
import { JsonViewer } from "@/components/json-viewer";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CanvasData } from "@/lib/types";

type CanvasEditorProps = {
  content: string;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  saveContent: (content: string, debounce: boolean) => void;
  status: "idle" | "streaming";
};

export const CanvasEditor = memo(function CanvasEditorComponent({
  content,
  currentVersionIndex: _currentVersionIndex,
  isCurrentVersion: _isCurrentVersion,
  saveContent: _saveContent,
  status: _status,
}: CanvasEditorProps) {
  const canvasData = useMemo<CanvasData | null>(() => {
    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch {
      return;
    }
  }, [content]);

  if (!canvasData) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Canvas Data</CardTitle>
            <CardDescription>
              Unable to parse canvas configuration. Please check the JSON
              structure.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <JsonViewer data={canvasData} />
    </div>
  );
});
