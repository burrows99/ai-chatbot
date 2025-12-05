"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  CanvasData,
  CanvasMetadata,
  EntityRecord,
} from "@/lib/artifacts/canvas/types";

type CanvasContextType = {
  entityRecords: EntityRecord[];
  metadata: CanvasMetadata | null;
  setCanvasData: (data: CanvasData) => void;
  updateEntityRecords: (records: EntityRecord[]) => void;
  updateMetadata: (metadata: CanvasMetadata) => void;
};

const CanvasContext = createContext<CanvasContextType | null>(null);

export function CanvasProvider({
  children,
  initialContent,
}: {
  children: ReactNode;
  initialContent?: string;
}) {
  const [entityRecords, setEntityRecords] = useState<EntityRecord[]>([]);
  const [metadata, setMetadata] = useState<CanvasMetadata | null>(null);

  useEffect(() => {
    if (initialContent) {
      try {
        const parsed: CanvasData = JSON.parse(initialContent);
        if (parsed.entityRecords) {
          setEntityRecords(parsed.entityRecords);
        }
        if (parsed.metadata) {
          setMetadata(parsed.metadata);
        }
      } catch (error) {
        console.error("Error parsing canvas content:", error);
      }
    }
  }, [initialContent]);

  const setCanvasData = useCallback((data: CanvasData) => {
    setEntityRecords(data.entityRecords || []);
    setMetadata(data.metadata || null);
  }, []);

  const updateEntityRecords = useCallback((records: EntityRecord[]) => {
    setEntityRecords(records);
  }, []);

  const updateMetadata = useCallback((newMetadata: CanvasMetadata) => {
    setMetadata(newMetadata);
  }, []);

  return (
    <CanvasContext.Provider
      value={{
        entityRecords,
        metadata,
        setCanvasData,
        updateEntityRecords,
        updateMetadata,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvas must be used within a CanvasProvider");
  }
  return context;
}
