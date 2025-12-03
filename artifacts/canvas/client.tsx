import { useState } from "react";
import { toast } from "sonner";
import { CanvasEditor } from "@/components/canvas-editor";
import { CanvasJsonView } from "@/components/canvas-json-view";
import { Artifact } from "@/components/create-artifact";
import { DocumentSkeleton } from "@/components/document-skeleton";
import { CopyIcon, RedoIcon, UndoIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

type Metadata = {
  viewMode: "canvas" | "json";
};

function CanvasArtifactContent({
  content,
  currentVersionIndex,
  onSaveContent,
  status,
  isLoading,
  isCurrentVersion,
}: {
  content: string;
  currentVersionIndex: number;
  onSaveContent: (content: string, debounce: boolean) => void;
  status: "streaming" | "idle";
  isLoading: boolean;
  isCurrentVersion: boolean;
}) {
  const [viewMode, setViewMode] = useState<"canvas" | "json">("canvas");

  if (isLoading) {
    return <DocumentSkeleton artifactKind="canvas" />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end gap-2 border-b p-2">
        <Button
          onClick={() => setViewMode(viewMode === "canvas" ? "json" : "canvas")}
          size="sm"
          variant="outline"
        >
          {viewMode === "canvas" ? "View JSON" : "View Canvas"}
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        {viewMode === "json" ? (
          <CanvasJsonView content={content} />
        ) : (
          <CanvasEditor
            content={content}
            currentVersionIndex={currentVersionIndex}
            isCurrentVersion={isCurrentVersion}
            saveContent={onSaveContent}
            status={status}
          />
        )}
      </div>
    </div>
  );
}

export const canvasArtifact = new Artifact<"canvas", Metadata>({
  kind: "canvas",
  description:
    "Useful for creating configurable data visualizations with kanban, table, and gantt views",
  initialize: ({ setMetadata }) => {
    setMetadata({
      viewMode: "canvas",
    });
  },
  onStreamPart: ({ setArtifact, streamPart }) => {
    if (streamPart.type === "data-canvasDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data,
        isVisible: true,
        status: "streaming",
      }));
    }
  },
  content: CanvasArtifactContent,
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: "View Previous version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: "View Next version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: "Copy JSON to clipboard",
      onClick: ({ content }) => {
        try {
          const parsed = JSON.parse(content);
          navigator.clipboard.writeText(JSON.stringify(parsed, null, 2));
          toast.success("Copied canvas JSON to clipboard!");
        } catch {
          navigator.clipboard.writeText(content);
          toast.success("Copied to clipboard!");
        }
      },
    },
  ],
  toolbar: [],
});
