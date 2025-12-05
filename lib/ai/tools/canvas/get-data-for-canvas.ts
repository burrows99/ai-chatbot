import { tool } from "ai";
import { z } from "zod";
import type { Field, FieldType } from "@/lib/types";

// Field schema matching the buildField pattern
const fieldSchema = z.object({
  apiName: z.string().min(1, "apiName must be a non-empty string"),
  label: z.string().min(1, "label must be a non-empty string"),
  value: z.any().nullable(),
  allowedValues: z.array(z.any()).default([]),
  type: z.enum(["id", "number", "text", "textarea", "json"]).default("text"),
  isVisible: z.boolean().default(true),
});

function buildField({
  apiName,
  label,
  value = null,
  allowedValues = [],
  type = "text" as const,
  isVisible = true,
}: {
  apiName: string;
  label: string;
  value?: any;
  allowedValues?: any[];
  type?: FieldType;
  isVisible?: boolean;
}): Field {
  if (!apiName || typeof apiName !== "string") {
    throw new Error("apiName must be a non-empty string");
  }

  if (!label || typeof label !== "string") {
    throw new Error("label must be a non-empty string");
  }

  const validTypes = ["id", "number", "text", "textarea", "json"];
  if (!validTypes.includes(type)) {
    throw new Error(
      `Invalid type '${type}'. Allowed: ${validTypes.join(", ")}`
    );
  }

  const raw = {
    apiName,
    label,
    value,
    allowedValues: Array.isArray(allowedValues) ? allowedValues : [],
    type,
    isVisible: Boolean(isVisible),
  };

  // Validate/normalize with zod — this ensures returned shape always matches Field
  return fieldSchema.parse(raw);
}

export const getDataForCanvas = tool({
  description:
    'Generate structured records for canvas visualizations. Must return array of records where each record has field names as keys and field objects as values. Field object: {apiName: string, label: string, value: any, allowedValues: array, type: \'id\'|\'number\'|\'text\'|\'textarea\'|\'json\', isVisible: boolean}. Example: [{"taskId": {"apiName": "taskId", "label": "Task ID", "value": "TASK-001", "allowedValues": [], "type": "id", "isVisible": true}, "task": {"apiName": "task", "label": "Task", "value": "Setup", "allowedValues": [], "type": "text", "isVisible": true}}]. All records must have same fields.',
  inputSchema: z.object({
    records: z
      .string()
      .describe(
        "JSON array of records. Each record: object with field names as keys. Each field value: {apiName: string, label: string, value: any, allowedValues: array, type: 'id'|'number'|'text'|'textarea'|'json', isVisible: boolean}"
      ),
  }),
  execute: ({ records }) => {
    let parsedRecords: Record<string, any>[];
    try {
      parsedRecords = JSON.parse(records);
    } catch {
      return { records: [] };
    }

    const validatedRecords = parsedRecords.map(
      (record: Record<string, any>) => {
        const validatedRecord: Record<string, Field> = {};
        for (const [fieldName, field] of Object.entries(record)) {
          validatedRecord[fieldName] = buildField({
            apiName: field.apiName,
            label: field.label,
            value: field.value,
            allowedValues: field.allowedValues || [],
            type: field.type || "text",
            isVisible: field.isVisible !== undefined ? field.isVisible : true,
          });
        }
        return validatedRecord;
      }
    );

    return { records: validatedRecords };
  },
});
