// biome-ignore assist/source/organizeImports: grouped imports for clarity
import DynamicDataGrid from "@/components/business/datagrid/dynamic-datagrid";
import DynamicKanban from "@/components/business/kanban/dynamic-kanban";
import DynamicGantt from "@/components/business/gantt/dynamic-gantt";
// import JsonViewer from '@/components/business/json-viewer/json-viewer';

const CanvasViewer = () => {
  return (
    <div className="h-full w-full">
      <DynamicDataGrid />
      <DynamicKanban />
      <DynamicGantt />
      {/* <JsonViewer content={content} /> */}
    </div>
  );
};

export default CanvasViewer;
