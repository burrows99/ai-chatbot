import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/artifact";
import type { createDocument } from "./ai/tools/create-document";
import type { getWeather } from "./ai/tools/get-weather";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { updateDocument } from "./ai/tools/update-document";
import type { Suggestion } from "./db/schema";
import type { AppUsage } from "./usage";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  canvasDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  usage: AppUsage;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};

// Canvas Types - Single Source of Truth
export type FieldType = "id" | "number" | "text" | "textarea" | "json";

export type Field = {
  apiName: string;
  label: string;
  value?: string | number | boolean | Record<string, any> | any[] | null;
  allowedValues: Array<string | number | boolean>;
  type: FieldType;
  isVisible: boolean;
};

export type CanvasData = Record<string, Field>[];

// Kanban Types
export type KanbanColumn = {
  id: string;
  name: string;
  color?: string;
};

export type KanbanFeature = {
  id: string;
  name: string;
  column: string;
  [key: string]: any;
};

export type KanbanTransformedData = {
  columns: KanbanColumn[];
  features: KanbanFeature[];
};

// Table Types
export type TableTransformedData<TData = any> = {
  columns: any[]; // ColumnDef<TData>[] from shadcn table
  data: TData[];
};

// Gantt Types
export type GanttFeature = {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status?: { name: string; color: string };
  owner?: { name: string; image: string };
  group?: { id: string; name: string };
  [key: string]: any;
};

export type GanttTransformedData = {
  features: GanttFeature[];
  groups: Record<string, GanttFeature[]>;
};
