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
      selectedItems?: string[]; // Added for selection tracking
    };
    // Other artifacts can be added here later
    [artifactKey: string]: {
      data: {
        documentId?: string;
        [dataKey: string]: any;
      };
      selectedItems?: string[];
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
  setSelectedItems: (artifactType: string, selectedIds: string[]) => void;
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
        selectedItems: [],
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
          selectedItems:
            value.selectedItems !== undefined
              ? value.selectedItems
              : prev.artifact[artifactType]?.selectedItems || [],
        },
      },
    }));
  };

  const getArtifactData = (artifactType: string) => {
    return contextData.artifact[artifactType]?.data;
  };
  
  const setSelectedItems = (artifactType: string, selectedIds: string[]) => {
    setContextData((prev) => ({
      ...prev,
      artifact: {
        ...prev.artifact,
        [artifactType]: {
          ...prev.artifact[artifactType],
          selectedItems: selectedIds,
        },
      },
    }));
  };

  const getSelectedItems = (artifactType: string): string[] => {
    return contextData.artifact[artifactType]?.selectedItems || [];
  };

  const clearSelectedItems = (artifactType: string) => {
    setSelectedItems(artifactType, []);
  };

  const toggleItemSelection = (artifactType: string, itemId: string) => {
    const currentSelection = getSelectedItems(artifactType);
    if (currentSelection.includes(itemId)) {
      setSelectedItems(
        artifactType,
        currentSelection.filter((id) => id !== itemId)
      );
    } else {
      setSelectedItems(artifactType, [...currentSelection, itemId]);
    }
  };

  const getContextAsJson = () => {
    return JSON.stringify(contextData, null, 2);
  };

  const contextValue: AIContextValue = {
    ...contextData,
    setArtifactData,
    getArtifactData,
    getContextAsJson,
    contextData,
    setSelectedItems,
    getSelectedItems,
    clearSelectedItems,
    toggleItemSelection,
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
