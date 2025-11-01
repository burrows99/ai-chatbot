// biome-ignore assist/source/organizeImports: <explanation>
import DynamicKanban from '@/components/business/kanban/dynamic-kanban';
import JsonViewer from '@/components/business/json-viewer/json-viewer';
// import { useCallback } from 'react';

const CanvasViewer = ({ content }: { content: string }) => {
    // const extractColumns = useCallback((data: string | any[]) => {
    //     // Check if data array exists and has at least one record
    //     if (!data || !Array.isArray(data) || data.length === 0) {
    //         return [];
    //     }

    //     // Get the first record
    //     const firstRecord = data[0];

    //     // Find the first field with allowedValues
    //     // biome-ignore lint/suspicious/useGuardForIn: <explanation>
    //     for (const fieldKey in firstRecord) {
    //         const field = firstRecord[fieldKey];

    //         if (field.type && Array.isArray(field.type.allowedValues)) {
    //         // Generate random color
    //             const getRandomColor = () => {
    //                 const colors = [
    //                     "#6B7280",
    //                     "#F59E0B",
    //                     "#10B981",
    //                     "#3B82F6",
    //                     "#8B5CF6",
    //                     "#EC4899",
    //                     "#EF4444",
    //                     "#14B8A6",
    //                 ];
    //                 return colors[Math.floor(Math.random() * colors.length)];
    //             };

    //             // Transform allowedValues into columns array
    //             return field.type.allowedValues.map((value: any) => ({
    //                 id: value,
    //                 name: value,
    //                 color: getRandomColor(),
    //             }));
    //         }
    //     }
    //     return [];
    // });
    return (
        <div className="h-full w-full">
            <JsonViewer content={content} />
            <DynamicKanban />
        </div>
    );
};

export default CanvasViewer;