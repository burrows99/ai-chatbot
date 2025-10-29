// import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";
import { ollama } from 'ollama-ai-provider-v2';

const ollamaProvider = customProvider({
  languageModels: {
    'chat-model': ollama('gpt-oss:120b-cloud'),
    'chat-model-reasoning': wrapLanguageModel({
      model: ollama('gpt-oss:120b-cloud'),
      middleware: extractReasoningMiddleware({ tagName: 'reasoning' }),
    }),
    'title-model': ollama('gpt-oss:120b-cloud'),
    'artifact-model': ollama('gpt-oss:120b-cloud'),
  },
  imageModels: {
    // 'small-model': openai.image('gpt-image-1'),
  },
});

export const myProvider = isTestEnvironment
  ? (() => {
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
    })()
  : ollamaProvider;
