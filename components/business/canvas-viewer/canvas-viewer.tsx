// biome-ignore assist/source/organizeImports: grouped imports for clarity
import DynamicDataGrid from "@/components/business/datagrid/dynamic-datagrid";
import DynamicKanban from "@/components/business/kanban/dynamic-kanban";
import DynamicGantt from "@/components/business/gantt/dynamic-gantt";
// import JsonViewer from '@/components/business/json-viewer/json-viewer';

type CanvasViewerProps = {
  metadata?: any;
  isCurrentVersion?: boolean;
  currentVersionIndex?: number;
  onSaveContent?: (content: string, debounce: boolean) => void;
  status?: string;
};

const CanvasViewer = ({
  metadata,
  isCurrentVersion,
  currentVersionIndex,
  onSaveContent,
  status,
}: CanvasViewerProps) => {
  console.log({
    metadata,
    isCurrentVersion,
    currentVersionIndex,
    onSaveContent,
    status,
  });
  return (
    <div className="h-full w-full">
      <DynamicDataGrid />
      <DynamicKanban />
      <DynamicGantt />
    </div>
  );
};

export default CanvasViewer;