import { toast } from "sonner";
import { Artifact } from "@/components/create-artifact";
import { DocumentSkeleton } from "@/components/document-skeleton";
import {
  CopyIcon,
  RedoIcon,
  UndoIcon,
  MessageIcon,
} from "@/components/icons";

type Metadata = {
  jsonData: any | null;
};

const JsonViewer = ({ content }: { content: string }) => {
  try {
    const jsonData = JSON.parse(content);
    
    return (
      <div className="h-full w-full overflow-auto p-4">
        <div className="rounded-lg border bg-gray-50 p-4">
          <h3 className="mb-4 font-semibold text-gray-800 text-lg">Generated Canvas Data</h3>
          <pre className="overflow-auto rounded bg-white p-4 text-sm">
            <code className="text-gray-700">
              {JSON.stringify(jsonData, null, 2)}
            </code>
          </pre>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h3 className="mb-2 font-semibold text-lg text-red-800">Invalid JSON</h3>
          <p className="text-red-600">
            Error parsing JSON data: {error instanceof Error ? error.message : "Invalid format"}
          </p>
          <div className="mt-4 rounded bg-red-100 p-3 text-left text-sm">
            <strong>Raw content:</strong>
            <pre className="mt-2 whitespace-pre-wrap break-words text-red-700">
              {content}
            </pre>
          </div>
        </div>
      </div>
    );
  }
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
    
    return <JsonViewer content={content} />;
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