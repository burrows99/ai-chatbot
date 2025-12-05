export type EntityField = {
  apiName: string;
  label: string;
  value: string;
  type: string;
  allowedValues: string[];
  format: string;
};

export type EntityRecord = {
  recordId: string;
  fields: EntityField[];
};

export type KanbanComponent = {
  type: "kanban";
  columnField: {
    apiName: string;
    allowedValues: string[];
  };
  isVisible: boolean;
  reasoningForVisibilityFlag: string;
};

export type TableComponent = {
  type: "table";
  isVisible: boolean;
  reasoningForVisibilityFlag: string;
};

export type GanttComponent = {
  type: "gantt";
  startDateField: {
    apiName: string;
  };
  endDateField: {
    apiName: string;
  };
  groupByField: {
    apiName: string;
  };
  isVisible: boolean;
  reasoningForVisibilityFlag: string;
};

export type ComponentConfig = KanbanComponent | TableComponent | GanttComponent;

export type CanvasMetadata = {
  entityType: string;
  components: ComponentConfig[];
};

export type CanvasData = {
  entityRecords: EntityRecord[];
  metadata: CanvasMetadata;
};
