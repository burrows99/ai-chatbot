import { generateObject } from "ai";
import { z } from "zod";
import { canvasPrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

// Schema that matches our blueprint structure
const fieldValueSchema = z.object({
  name: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  label: z.string(),
  type: z.object({
    name: z.enum(["text", "textarea", "date", "dropdown"]),
    placeholder: z.string().optional(),
    format: z.string().optional(),
    allowedValues: z.array(z.string()).optional(),
  }),
});

const canvasDataSchema = z.object({
  config: z.record(z.any()), // Field types configuration
  data: z.array(z.record(fieldValueSchema)), // Array of field data objects
});

export const canvasDocumentHandler = createDocumentHandler({
  kind: "canvas",
  onCreateDocument: async ({ id, title, dataStream }) => {
    dataStream.write({
      type: "data-canvasDelta",
      data: "",
      transient: true,
    });

    const { object: canvasData } = await generateObject({
      model: myProvider.languageModel("artifact-model"),
      schema: canvasDataSchema,
      system: canvasPrompt,
      prompt: `Create realistic data based on the title: "${title}". 
      
      Generate appropriate sample data that makes sense for the title context.
      Follow the blueprint structure with config and data arrays.
      Include 3-6 data rows with meaningful, realistic values.
      
      For example:
      - If it's about Jira stories, create task-related data with titles, descriptions, dates, and statuses
      - If it's about user profiles, create user information with names, emails, dates, and categories
      - If it's about project data, create project-related information
      
      Make sure all data is realistic and follows the field type constraints (dates in YYYY-MM-DD format, dropdown values from allowedValues, etc.).`,
    });

    const canvasJson = JSON.stringify(canvasData, null, 2);

    dataStream.write({
      type: "data-canvasDelta",
      data: canvasJson,
      transient: true,
    });

    // Publish canvas data to AI context for future AI analysis
    dataStream.write({
      type: "data-aiContextUpdate",
      data: {
        action: "setArtifactData",
        artifactType: "canvasArtifact",
        documentId: id,
        payload: {
          title,
          content: canvasData,
          timestamp: Date.now(),
          kind: "canvas"
        }
      },
      transient: true,
    });

    return canvasJson;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let currentData: any;
    try {
      currentData = JSON.parse(document.content || "{}");
    } catch {
      currentData = { config: {}, data: [] };
    }

    dataStream.write({
      type: "data-canvasDelta",
      data: document.content || "",
      transient: true,
    });

    const { object: updatedCanvasData } = await generateObject({
      model: myProvider.languageModel("artifact-model"),
      schema: canvasDataSchema,
      system: updateDocumentPrompt(document.content, "canvas"),
      prompt: `Update the existing canvas data based on this request: "${description}"
      
      Current canvas data:
      ${JSON.stringify(currentData, null, 2)}
      
      Modify the data according to the user's request. This could involve:
      - Adding or removing data rows
      - Updating field values
      - Changing field configurations
      - Modifying labels or field types
      - Adjusting data to match new requirements
      
      Keep the changes focused on what the user requested while maintaining data integrity and following field type constraints.`,
    });

    const updatedJson = JSON.stringify(updatedCanvasData, null, 2);

    dataStream.write({
      type: "data-canvasDelta",
      data: updatedJson,
      transient: true,
    });

    // Publish updated canvas data to AI context
    dataStream.write({
      type: "data-aiContextUpdate",
      data: {
        action: "setArtifactData",
        artifactType: "canvasArtifact",
        documentId: document.id,
        payload: {
          title: document.title,
          content: updatedCanvasData,
          timestamp: Date.now(),
          kind: "canvas",
          updateDescription: description
        }
      },
      transient: true,
    });

    return updatedJson;
  },
});