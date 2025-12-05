import { createOllama } from "ollama-ai-provider-v2";
import { createAzure } from "@ai-sdk/azure";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

const providerForTest = (() => {
  const {
    artifactModel,
    chatModel,
    reasoningModel,
    titleModel,
  } = require("./models.mock");
  return customProvider({
    languageModels: {
      "chat-model": chatModel,
      "chat-model-reasoning": reasoningModel,
      "title-model": titleModel,
      "artifact-model": artifactModel,
    },
  });
})();

const azure = createAzure({
  resourceName: process.env.AZURE_RESOURCE_NAME,
  apiKey: process.env.AZURE_API_KEY,
});

const azureProvider = customProvider({
  languageModels: {
    "chat-model": azure(
      process.env.AZURE_CHAT_DEPLOYMENT_NAME || "gpt-5.1-chat"
    ),
    "chat-model-reasoning": wrapLanguageModel({
      model: azure(
        process.env.AZURE_REASONING_DEPLOYMENT_NAME || "gpt-5.1-chat"
      ),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": azure(
      process.env.AZURE_CHAT_DEPLOYMENT_NAME || "gpt-5.1-chat"
    ),
    "artifact-model": azure(
      process.env.AZURE_CHAT_DEPLOYMENT_NAME || "gpt-5.1-chat"
    ),
  },
});

const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL,
});

const ollamaProvider = customProvider({
  languageModels: {
    "chat-model": ollama(String(process.env.OLLAMA_MODEL)),
    "chat-model-reasoning": wrapLanguageModel({
      model: ollama(String(process.env.OLLAMA_MODEL)),
      middleware: extractReasoningMiddleware({ tagName: "reasoning" }),
    }),
    "title-model": ollama(String(process.env.OLLAMA_MODEL)),
    "artifact-model": ollama(String(process.env.OLLAMA_MODEL)),
  },
  imageModels: {
    // 'small-model': openai.image('gpt-image-1'),
  },
});

export const myProvider = isTestEnvironment ? providerForTest : 
azureProvider;
// ollamaProvider;

export const allProviders = [azureProvider, ollamaProvider];
