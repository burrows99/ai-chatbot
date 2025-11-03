"use client";

import { useEffect } from "react";
import { initialArtifactData, useArtifact } from "@/hooks/use-artifact";
import { useAIContext } from "@/lib/ai/context/ai-context";
import { artifactDefinitions } from "./artifact";
import { useDataStream } from "./data-stream-provider";

export function DataStreamHandler() {
  const { dataStream, setDataStream } = useDataStream();
  const { setCanvasArtifactData, setCanvasArtifactConfig } = useAIContext();

  const { artifact, setArtifact, setMetadata } = useArtifact();

  useEffect(() => {
    if (!dataStream?.length) {
      return;
    }

    const newDeltas = dataStream.slice();
    setDataStream([]);

    for (const delta of newDeltas) {
      // Handle AI context updates
      if (delta.type === "data-aiContextUpdate") {
        const { action, payload } = delta.data;

        if (action === "setArtifactData") {
          const content = payload?.content;
          if (content?.data) {
            setCanvasArtifactData(content.data);
          }
          if (content?.config) {
            setCanvasArtifactConfig(content.config);
          }
        }

        continue;
      }

      const artifactDefinition = artifactDefinitions.find(
        (currentArtifactDefinition) =>
          currentArtifactDefinition.kind === artifact.kind
      );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      setArtifact((draftArtifact) => {
        if (!draftArtifact) {
          return { ...initialArtifactData, status: "streaming" };
        }

        switch (delta.type) {
          case "data-id":
            return {
              ...draftArtifact,
              documentId: delta.data,
              status: "streaming",
            };

          case "data-title":
            return {
              ...draftArtifact,
              title: delta.data,
              status: "streaming",
            };

          case "data-kind":
            return {
              ...draftArtifact,
              kind: delta.data,
              status: "streaming",
            };

          case "data-clear":
            return {
              ...draftArtifact,
              content: "",
              status: "streaming",
            };

          case "data-finish":
            return {
              ...draftArtifact,
              status: "idle",
            };

          default:
            return draftArtifact;
        }
      });
    }
  }, [
    dataStream,
    setArtifact,
    setMetadata,
    artifact,
    setCanvasArtifactData,
    setCanvasArtifactConfig,
    setDataStream,
  ]);

  return null;
}
