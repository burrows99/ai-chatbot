/** biome-ignore-all lint/nursery/useMaxParams: <explanation> */
export type FieldTypeName = "text" | "textarea" | "date" | "dropdown";

type BaseFieldType = {
  readonly name: FieldTypeName;
};

interface TextFieldType extends BaseFieldType {
  readonly name: "text";
}

interface TextareaFieldType extends BaseFieldType {
  readonly name: "textarea";
}

interface DateFieldType extends BaseFieldType {
  readonly name: "date";
  readonly format: "YYYY-MM-DD";
}

interface DropdownFieldType extends BaseFieldType {
  readonly name: "dropdown";
  readonly allowedValues: readonly string[];
  readonly defaultValue: string;
}

export type FieldType =
  | TextFieldType
  | TextareaFieldType
  | DateFieldType
  | DropdownFieldType;

export type FieldConfig = {
  readonly apiName: string;
  readonly value: string;
  readonly label: string;
  readonly type: FieldType;
};

export type CanvasData = {
  readonly [fieldName: string]: FieldConfig;
};

export const fieldTypes = {
  text: {
    name: "text" as const,
  } satisfies TextFieldType,

  textarea: {
    name: "textarea" as const,
  } satisfies TextareaFieldType,

  date: {
    name: "date" as const,
    format: "YYYY-MM-DD",
  } satisfies DateFieldType,

  dropdown: {
    name: "dropdown" as const,
    allowedValues: [] as readonly string[],
    defaultValue: "",
  } satisfies DropdownFieldType,
} as const;

export const createTextField = (apiName = "", value = "", label = "") => ({
  apiName,
  value,
  label,
  type: fieldTypes.text,
});

export const createTextareaField = (apiName = "", value = "", label = "") => ({
  apiName,
  value,
  label,
  type: fieldTypes.textarea,
});

export const createDateField = (apiName = "", value = "", label = "") => ({
  apiName,
  value,
  label,
  type: fieldTypes.date,
});

export const createDropdownField = (
  apiName = "",
  value = "",
  label = "",
  allowedValues = [] as readonly string[],
  defaultValue = ""
) => ({
  apiName,
  value,
  label,
  type: {
    ...fieldTypes.dropdown,
    allowedValues,
    defaultValue,
  },
});

// Example data with proper typing
export const exampleCanvasData: readonly CanvasData[] = [
  {
    field1: createTextField("API Name of field1", "Sample text", "Text Field"),
    field2: createTextareaField(
      "API Name of field2",
      "Sample textarea content",
      "Textarea Field"
    ),
    field3: createDropdownField(
      "API Name of field3",
      "option1",
      "Dropdown Field",
      ["option1", "option2", "option3"],
      "option1"
    ),
    field4: createDateField("API Name of field4", "2024-01-01", "Date Field"),
  },
  {
    field1: createTextField(
      "API Name of field1",
      "Another text",
      "Text Field 2"
    ),
    field2: createTextareaField(
      "API Name of field2",
      "Another textarea content",
      "Textarea Field 2"
    ),
    field3: createDropdownField(
      "API Name of field3",
      "option2",
      "Dropdown Field 2",
      ["option1", "option2", "option3"],
      "option1"
    ),
    field4: createDateField("API Name of field4", "2024-12-31", "Date Field 2"),
  },
] as const;
