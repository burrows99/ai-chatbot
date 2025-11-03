"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

// Simple JSON object structure for storing AI context data
type AIContextData = {
  artifact: {
    canvasArtifact: {
      data: {
        documentId?: string;
        [dataKey: string]: any;
      };
      ganttSelectedItems?: string[];
      dataGridSelectedItems?: string[];
      kanbanSelectedItems?: string[];
    };
  };
  // Other things can be added here later
  [contextKey: string]: any;
};

// Context methods
type AIContextMethods = {
  setArtifactData: (artifactType: string, value: any) => void;
  getArtifactData: (artifactType: string) => any;
  getContextAsJson: () => string;
  contextData: AIContextData;
  // Selection-specific methods
  getSelectedItems: (artifactType: string) => string[];
  clearSelectedItems: (artifactType: string) => void;
  toggleItemSelection: (artifactType: string, itemId: string) => void;
};

// Combined context interface
interface AIContextValue extends AIContextData, AIContextMethods {}

// Create the context
const AIContext = createContext<AIContextValue | null>(null);

// Provider component
export function AIContextProvider({ children }: { children: ReactNode }) {
  const [contextData, setContextData] = useState<AIContextData>({
    artifact: {
      canvasArtifact: {
        data: {},
        ganttSelectedItems: [],
        dataGridSelectedItems: [],
        kanbanSelectedItems: [],   
      },
    },
  });

  const setArtifactData = (artifactType: string, value: any) => {
    setContextData((prev) => ({
      ...prev,
      artifact: {
        ...prev.artifact,
        [artifactType]: {
          ...prev.artifact[artifactType],
          data: {
            ...prev.artifact[artifactType]?.data,
            ...value,
          },
          // Preserve selectedItems if not explicitly updated
          ganttSelectedItems:
            value.ganttSelectedItems !== undefined
              ? value.ganttSelectedItems
              : prev.artifact[artifactType]?.ganttSelectedItems || [],
          dataGridSelectedItems:
            value.dataGridSelectedItems !== undefined
              ? value.dataGridSelectedItems
              : prev.artifact[artifactType]?.dataGridSelectedItems || [],
          kanbanSelectedItems:
            value.kanbanSelectedItems !== undefined
              ? value.kanbanSelectedItems
              : prev.artifact[artifactType]?.kanbanSelectedItems || [],
        },
      },
    }));
  };

  const getArtifactData = (artifactType: string) => {
    return contextData.artifact[artifactType]?.data;
  };

  const contextValue: AIContextValue = {
    ...contextData,
    setArtifactData,
    getArtifactData,
    contextData,
  };

  return (
    <AIContext.Provider value={contextValue}>{children}</AIContext.Provider>
  );
}

// Hook to use the AI context
export function useAIContext() {
  const context = useContext(AIContext);

  if (!context) {
    throw new Error("useAIContext must be used within an AIContextProvider");
  }

  return context;
}

// Export types
export type { AIContextData, AIContextMethods, AIContextValue };
