"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

export type CanvasArtifactData = Record<string, unknown>[];
export type CanvasArtifactConfig = Record<string, unknown>;

export type AIContextValue = {
  canvasArtifactData: CanvasArtifactData;
  canvasArtifactConfig: CanvasArtifactConfig;
  ganttSelectedItems: string[];
  dataGridSelectedItems: string[];
  kanbanSelectedItems: string[];
  setCanvasArtifactData: React.Dispatch<React.SetStateAction<CanvasArtifactData>>;
  setCanvasArtifactConfig: React.Dispatch<React.SetStateAction<CanvasArtifactConfig>>;
  setGanttSelections: React.Dispatch<React.SetStateAction<string[]>>;
  setDataGridSelections: React.Dispatch<React.SetStateAction<string[]>>;
  setKanbanSelections: React.Dispatch<React.SetStateAction<string[]>>;
};

const AIContext = createContext<AIContextValue | undefined>(undefined);

export function AIContextProvider({ children }: { children: ReactNode }) {
  const [canvasArtifactData, setCanvasArtifactData] = useState<CanvasArtifactData>([]);
  const [canvasArtifactConfig, setCanvasArtifactConfig] = useState<CanvasArtifactConfig>({});
  const [ganttSelectedItems, setGanttSelections] = useState<string[]>([]);
  const [dataGridSelectedItems, setDataGridSelections] = useState<string[]>([]);
  const [kanbanSelectedItems, setKanbanSelections] = useState<string[]>([]);

  // Memo to keep value stable across renders unless deps change
  const value = useMemo<AIContextValue>(() => ({
      canvasArtifactData,
      canvasArtifactConfig,
      ganttSelectedItems,
      dataGridSelectedItems,
      kanbanSelectedItems,
      setCanvasArtifactData,
      setCanvasArtifactConfig,
      setGanttSelections,
      setDataGridSelections,
      setKanbanSelections,
    }),
    [
      canvasArtifactData,
      canvasArtifactConfig,
      ganttSelectedItems,
      dataGridSelectedItems,
      kanbanSelectedItems,
    ]
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAIContext(): AIContextValue {
  const ctx = useContext(AIContext);
  if (!ctx) {
    throw new Error("useAIContext must be used within an AIContextProvider");
  }
  return ctx;
}

export type { AIContextValue as AIContextMethods };