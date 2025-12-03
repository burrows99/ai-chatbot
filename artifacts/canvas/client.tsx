import { toast } from "sonner";
import { CanvasEditor } from "@/components/canvas-editor";
import { CanvasJsonView } from "@/components/canvas-json-view";
import { Artifact } from "@/components/create-artifact";
import { DocumentSkeleton } from "@/components/document-skeleton";
import { CopyIcon, DeltaIcon, RedoIcon, UndoIcon } from "@/components/icons";

type Metadata = {
  viewMode: "canvas" | "json";
};

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
  content: ({
    content,
    currentVersionIndex,
    onSaveContent,
    status,
    isLoading,
    metadata,
    isCurrentVersion,
  }) => {
    if (isLoading) {
      return <DocumentSkeleton artifactKind="canvas" />;
    }

    const viewMode = metadata?.viewMode || "canvas";

    if (viewMode === "json") {
      return <CanvasJsonView content={content} />;
    }

    return (
      <CanvasEditor
        content={content}
        currentVersionIndex={currentVersionIndex}
        isCurrentVersion={isCurrentVersion}
        saveContent={onSaveContent}
        status={status}
      />
    );
  },
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
  toolbar: [
    {
      description: "Toggle Canvas View",
      icon: <DeltaIcon />,
      onClick: ({ metadata, setMetadata }: any) => {
        setMetadata({
          ...metadata,
          viewMode: metadata?.viewMode === "canvas" ? "json" : "canvas",
        });
      },
    },
  ],
});
