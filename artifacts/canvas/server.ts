import { streamObject } from "ai";
import { z } from "zod";
import { canvasPrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

const fieldConfigSchema = z.object({
  apiname: z.string(),
  label: z.string(),
  allowedvalues: z.array(z.string()).optional(),
  defaultvalue: z.any().optional(),
  type: z.enum([
    "number",
    "text",
    "id",
    "textarea",
    "date",
    "select",
    "checkbox",
  ]),
});

const layoutSchema = z.object({
  kanban: z.object({
    visible: z.boolean(),
    position: z.enum(["left", "right", "top", "bottom"]),
    groupBy: z.string().optional(),
  }),
  table: z.object({
    visible: z.boolean(),
    position: z.enum(["left", "right", "top", "bottom"]),
  }),
  gantt: z.object({
    visible: z.boolean(),
    position: z.enum(["left", "right", "top", "bottom"]),
    startDateField: z.string().optional(),
    endDateField: z.string().optional(),
  }),
});

const canvasSchema = z.object({
  fieldConfig: z.array(fieldConfigSchema),
  data: z.array(z.record(z.any())),
  layout: layoutSchema,
});

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
