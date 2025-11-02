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
    };
    // Other artifacts can be added here later
    [artifactKey: string]: {
      data: {
        documentId?: string;
        [dataKey: string]: any;
      };
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
            // content: {
            //     ...prev.artifact[artifactType]?.data?.content,
            //     ...value?.content,
            // }
            ...prev.artifact[artifactType]?.data,
            ...value,
          },
        },
      },
    }));
  };

  const getArtifactData = (artifactType: string) => {
    return contextData.artifact[artifactType]?.data?.content?.data;
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
