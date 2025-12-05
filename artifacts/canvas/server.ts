import { streamObject } from "ai";
import { z } from "zod";
import { canvasPrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

const canvasSchema = z
  .object({})
  .passthrough()
  .describe("Canvas data - accepts any JSON structure");

export const canvasDocumentHandler = createDocumentHandler<"canvas">({
  kind: "canvas",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamObject({
      model: myProvider.languageModel("artifact-model"),
      system: canvasPrompt,
      prompt: title,
      schema: canvasSchema,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "object") {
        const { object } = delta;

        if (object) {
          const canvasData = JSON.stringify(object, null, 2);

          dataStream.write({
            type: "data-canvasDelta",
            data: canvasData,
            transient: true,
          });

          draftContent = canvasData;
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamObject({
      model: myProvider.languageModel("artifact-model"),
      system: updateDocumentPrompt(document.content, "canvas"),
      prompt: description,
      schema: canvasSchema,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "object") {
        const { object } = delta;

        if (object) {
          const canvasData = JSON.stringify(object, null, 2);

          dataStream.write({
            type: "data-canvasDelta",
            data: canvasData,
            transient: true,
          });

          draftContent = canvasData;
        }
      }
    }

    return draftContent;
  },
});
