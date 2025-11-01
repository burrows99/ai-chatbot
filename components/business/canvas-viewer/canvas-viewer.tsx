// biome-ignore assist/source/organizeImports: <explanation>
import DynamicKanban from '@/components/business/kanban/dynamic-kanban';
import JsonViewer from '@/components/business/json-viewer/json-viewer';

const CanvasViewer = ({ content }: { content: string }) => {
    return (
      <div className="h-full w-full">
        <DynamicKanban content={content} />
        <JsonViewer content={content} />
      </div>
    );
};

export default CanvasViewer;