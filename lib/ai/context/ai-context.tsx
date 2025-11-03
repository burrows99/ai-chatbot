"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
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
  setCanvasArtifactData: React.Dispatch<
    React.SetStateAction<CanvasArtifactData>
  >;
  setCanvasArtifactConfig: React.Dispatch<
    React.SetStateAction<CanvasArtifactConfig>
  >;
  setGanttSelections: React.Dispatch<React.SetStateAction<string[]>>;
  setDataGridSelections: React.Dispatch<React.SetStateAction<string[]>>;
  setKanbanSelections: React.Dispatch<React.SetStateAction<string[]>>;
};

const AIContext = createContext<AIContextValue | undefined>(undefined);

const LS_KEY = "ai:context:v1";

function loadInitial() {
  try {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as {
      canvasArtifactData: CanvasArtifactData;
      canvasArtifactConfig: CanvasArtifactConfig;
      ganttSelectedItems: string[];
      dataGridSelectedItems: string[];
      kanbanSelectedItems: string[];
    };
  } catch {
    return null;
  }
}

export function AIContextProvider({ children }: { children: ReactNode }) {
  const initial = loadInitial();

  const [canvasArtifactData, setCanvasArtifactData] =
    useState<CanvasArtifactData>(initial?.canvasArtifactData ?? []);
  const [canvasArtifactConfig, setCanvasArtifactConfig] =
    useState<CanvasArtifactConfig>(initial?.canvasArtifactConfig ?? {});
  const [ganttSelectedItems, setGanttSelections] = useState<string[]>(
    initial?.ganttSelectedItems ?? []
  );
  const [dataGridSelectedItems, setDataGridSelections] = useState<string[]>(
    initial?.dataGridSelectedItems ?? []
  );
  const [kanbanSelectedItems, setKanbanSelections] = useState<string[]>(
    initial?.kanbanSelectedItems ?? []
  );
  
  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          canvasArtifactData,
          canvasArtifactConfig,
          ganttSelectedItems,
          dataGridSelectedItems,
          kanbanSelectedItems,
        })
      );
    } catch (err) {
      console.warn("[AIContext] persist failed:", err);
    }
  }, [
    canvasArtifactData,
    canvasArtifactConfig,
    ganttSelectedItems,
    dataGridSelectedItems,
    kanbanSelectedItems,
  ]);

  const value = useMemo<AIContextValue>(
    () => ({
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
