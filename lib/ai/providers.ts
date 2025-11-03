import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { createOllama } from "ollama-ai-provider-v2";
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

const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL,
});

const ollamaProvider = customProvider({
  languageModels: {
    "chat-model": ollama("gpt-oss:120b-cloud"),
    "chat-model-reasoning": wrapLanguageModel({
      model: ollama("gpt-oss:120b-cloud"),
      middleware: extractReasoningMiddleware({ tagName: "reasoning" }),
    }),
    "title-model": ollama("gpt-oss:120b-cloud"),
    "artifact-model": ollama("gpt-oss:120b-cloud"),
  },
  imageModels: {
    // 'small-model': openai.image('gpt-image-1'),
  },
});

const xAIProvider = customProvider({
  languageModels: {
    "chat-model": gateway.languageModel("xai/grok-2-vision-1212"),
    "chat-model-reasoning": wrapLanguageModel({
      model: gateway.languageModel("xai/grok-3-mini"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": gateway.languageModel("xai/grok-2-1212"),
    "artifact-model": gateway.languageModel("xai/grok-2-1212"),
  },
});

export const myProvider = isTestEnvironment ? providerForTest : ollamaProvider;
// : xAIProvider;

export const allProviders = [xAIProvider, ollamaProvider];