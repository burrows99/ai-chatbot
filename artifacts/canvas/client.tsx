import { toast } from "sonner";
import { Artifact } from "@/components/create-artifact";
import { DocumentSkeleton } from "@/components/document-skeleton";
import {
  CopyIcon,
  MessageIcon,
  RedoIcon,
  UndoIcon,
} from "@/components/icons";
import CanvasViewer from "@/components/business/canvas-viewer/canvas-viewer";

type Metadata = {
  jsonData: any | null;
};

export const canvasArtifact = new Artifact<"canvas", Metadata>({
  kind: "canvas",
  description: "Displays LLM-generated JSON data in a readable format",
  initialize: ({ setMetadata }) => {
    setMetadata({
      jsonData: null,
    });
  },
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === "data-canvasDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data,
        isVisible: true,
        status: "streaming",
      }));
    }
  },
  content: ({ content, status }) => {
    if (status === "streaming" && !content) {
      return <DocumentSkeleton artifactKind="canvas" />;
    }

    return <CanvasViewer content={content} />;
  },
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: "View Previous version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
      isDisabled: ({ currentVersionIndex }) => {
        return currentVersionIndex === 0;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: "View Next version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
      isDisabled: ({ isCurrentVersion }) => {
        return isCurrentVersion;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: "Copy JSON data to clipboard",
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success("JSON data copied to clipboard!");
      },
    },
  ],
  toolbar: [
    {
      icon: <MessageIcon />,
      description: "Modify data",
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Please modify this data based on my requirements",
            },
          ],
        });
      },
    },
  ],
});
