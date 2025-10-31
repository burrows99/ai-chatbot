"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

// Simple JSON object structure for storing AI context data
type AIContextData = {
  artifact: {
    canvasArtifact: {
      data: Record<string, any>;
      selections: Record<string, any>;
    };
    // Other artifacts can be added here later
    [key: string]: {
      data: Record<string, any>;
      selections: Record<string, any>;
    };
  };
  chatHistory: {
    messages: Array<{
      id: string;
      role: 'user' | 'assistant' | 'system' | 'tool';
      content: string;
      timestamp: number;
      metadata?: Record<string, any>;
    }>;
  };
  // Other things can be added here later
  [key: string]: any;
};

// Context methods
type AIContextMethods = {
  setArtifactData: (artifactType: string, id: string, value: any) => void;
  setArtifactSelection: (artifactType: string, id: string, value: any) => void;
  getArtifactData: (artifactType: string, id: string) => any;
  getArtifactSelection: (artifactType: string, id: string) => any;
  addMessage: (message: {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    metadata?: Record<string, any>;
  }) => void;
  getMessages: () => Array<{
    id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    timestamp: number;
    metadata?: Record<string, any>;
  }>;
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
        selections: {},
      },
    },
    chatHistory: {
      messages: [],
    },
  });

  const setArtifactData = (artifactType: string, id: string, value: any) => {
    setContextData((prev) => ({
      ...prev,
      artifact: {
        ...prev.artifact,
        [artifactType]: {
          ...prev.artifact[artifactType],
          data: {
            ...prev.artifact[artifactType]?.data,
            [id]: value,
          },
          selections: prev.artifact[artifactType]?.selections || {},
        },
      },
    }));
  };

  const setArtifactSelection = (
    artifactType: string,
    id: string,
    value: any
  ) => {
    setContextData((prev) => ({
      ...prev,
      artifact: {
        ...prev.artifact,
        [artifactType]: {
          ...prev.artifact[artifactType],
          data: prev.artifact[artifactType]?.data || {},
          selections: {
            ...prev.artifact[artifactType]?.selections,
            [id]: value,
          },
        },
      },
    }));
  };

  const getArtifactData = (artifactType: string, id: string) => {
    return contextData.artifact[artifactType]?.data[id];
  };

  const getArtifactSelection = (artifactType: string, id: string) => {
    return contextData.artifact[artifactType]?.selections[id];
  };

  // Chat history methods
  const addMessage = (message: {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    metadata?: Record<string, any>;
  }) => {

    const newMessage = {
      ...message,
      timestamp: Date.now()
    };

    setContextData(prev => ({
      ...prev,
      chatHistory: {
        ...prev.chatHistory,
        messages: [...prev.chatHistory.messages, newMessage]
      }
    }));
  };

  const getMessages = () => {
    return contextData.chatHistory.messages;
  };

  const contextValue: AIContextValue = {
    ...contextData,
    setArtifactData,
    setArtifactSelection,
    getArtifactData,
    getArtifactSelection,
    addMessage,
    getMessages,
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
