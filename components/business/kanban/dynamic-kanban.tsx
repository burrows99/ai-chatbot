/** biome-ignore-all lint/correctness/useHookAtTopLevel: <explanation> */
/** biome-ignore-all lint/nursery/noShadow: <explanation> */
"use client";

import { useCallback, useState, useMemo, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    KanbanBoard,
    KanbanCard,
    KanbanCards,
    KanbanHeader,
    KanbanProvider,
} from "@/components/ui/shadcn-io/kanban";
import { useAIContext } from "@/lib/ai/context/ai-context";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
});

const getRandomColor = (): string => {
    const colors = [
        "#6B7280",
        "#F59E0B",
        "#10B981",
        "#3B82F6",
        "#8B5CF6",
        "#EC4899",
        "#EF4444",
        "#14B8A6",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

type KanbanColumn = {
    id: string;
    name: string;
    color: string;
};

type KanbanFeature = {
    id: string;
    name: string;
    startAt: Date;
    endAt: Date;
    column: string;
    owner: {
        name: string;
        image: string;
    };
};

const DynamicKanban = () => {
    const { contextData, setArtifactData } = useAIContext();
    const dataRef = useRef<any[]>([]);
    
    const parseResult = useMemo(() => {
        try {
            const artifactData = contextData?.artifact?.canvasArtifact?.data;
            
            // The data might be directly in artifactData or nested under a 'data' property
            const data = artifactData?.data || artifactData;
            const dataArray = Array.isArray(data) ? data : [];
            
            // Only update ref if data actually changed
            if (JSON.stringify(dataArray) !== JSON.stringify(dataRef.current)) {
                dataRef.current = dataArray;
            }
            
            return {
                success: true,
                data: dataRef.current,
                error: null,
            };
        } catch (error) {
            return {
                success: false,
                data: [],
                error: error instanceof Error ? error.message : "Invalid format",
            };
        }
    }, [contextData?.artifact?.canvasArtifact?.data]);

    const { data, error } = parseResult;
    const firstRecord = data[0] ?? {};
    const extractColumns = useCallback((dataArray: any[]): KanbanColumn[] => {
        if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
            return [];
        }
        try {
            for (const fieldKey in firstRecord) {
                if (Object.hasOwn(firstRecord, fieldKey)) {
                    const field = firstRecord[fieldKey];
                    if (
                        field &&
                        typeof field === "object" &&
                        field.type &&
                        Array.isArray(field.type.allowedValues)
                    ) {
                        return field.type.allowedValues.map((value: any) => ({
                            id: String(value),
                            name: String(value),
                            color: getRandomColor(),
                        }));
                    }
                }
            }
        } catch (error) {
            console.warn("Error extracting columns from data:", error);
        }
        return [];
    }, [firstRecord]);

    const detectFieldMappings = useCallback((firstRecord: any): {
        idField: string;
        dateField: string;
        columnField: string;
    } => {
        const idField =
            Object.keys(firstRecord).find(
            (fieldNumber) => firstRecord[fieldNumber]?.type?.name === "text"
            ) ||
            Object.keys(firstRecord)[0] ||
            "field1";

        const dateField =
            Object.keys(firstRecord).find(
                (fieldNumber) => firstRecord[fieldNumber]?.type?.name === "date"
            ) ||
            Object.keys(firstRecord).find(
                (fieldNumber) => firstRecord[fieldNumber]?.type?.name === "text"
            ) ||
            Object.keys(firstRecord)[1] ||
            "field4";

        const columnField =
            Object.keys(firstRecord).find(
                (fieldNumber) => firstRecord[fieldNumber]?.type?.name === "dropdown"
            ) ||
            Object.keys(firstRecord).find(
                (fieldNumber) =>
                    Array.isArray(firstRecord[fieldNumber]?.type?.allowedValues)
            ) ||
            "field3";
            return { idField, dateField, columnField };
        }, []);

    const fieldMappings = useMemo(() => detectFieldMappings(firstRecord), [detectFieldMappings, firstRecord]);
    const { idField, dateField, columnField } = fieldMappings;
    const newColumns = useMemo(() => extractColumns(data), [data, extractColumns]);
    const initialFeatures = useMemo(() => {
        if (!data || data.length === 0) { return []; }

        try {
            return data.map((item: any, index: number) => {
                const idValue = item[idField]?.value || `item-${index}`;
                const nameValue = item[idField]?.value || `Item ${index + 1}`;
                const dateValue = item[dateField]?.value || new Date().toISOString().split("T")[0];
                const columnValue = item[columnField]?.value || newColumns[0]?.id || "Default";
                return {
                    id: String(idValue),
                    name: String(nameValue),
                    startAt: new Date(dateValue),
                    endAt: new Date(dateValue),
                    column: String(columnValue),
                    owner: {
                        name: item.owner?.value || "Unassigned",
                        image: item.owner?.image || "",
                    },
                };
            });
        } catch (error) {
            console.error("Error mapping data to features:", error);
            return [];
        }
    }, [data, idField, dateField, columnField, newColumns]);

    const [newFeatures, setNewFeatures] = useState<KanbanFeature[]>(initialFeatures);

    const getUpdatedContentData = useCallback((
        originalContent: any,
        updatedFeatures: KanbanFeature[],
        fieldMappings: {
            idField: string;
            dateField: string;
            columnField: string;
        }
    ): any => {
        const { columnField } = fieldMappings;

        // Work with the original data structure
        const updatedData = JSON.parse(JSON.stringify(originalContent));

        const featureMap = new Map<string, KanbanFeature>();
        updatedFeatures.map((feature) => {
            featureMap.set(feature.id, feature);
            return null;
        });

        // Update the data array if it exists
        if (Array.isArray(updatedData)) {
            return updatedData.map((record, index) => {
                const recordId = String(record[idField]?.value || `item-${index}`);
                const feature = featureMap.get(recordId);
                if (!feature) {
                    return record;
                }
                const updatedRecord = { ...record };
                if (updatedRecord[columnField]) {
                    updatedRecord[columnField] = {
                        ...updatedRecord[columnField],
                        value: feature.column,
                    };
                }

                return updatedRecord;
            });
        }

        return updatedData;
    }, [idField]);

    const onDataChange = useCallback((updatedFeatures: KanbanFeature[]) => {
        setNewFeatures(updatedFeatures);
        const currentArtifactData = contextData?.artifact?.canvasArtifact?.data;
        const updatedData = getUpdatedContentData(
            currentArtifactData?.data || currentArtifactData,
            updatedFeatures,
            fieldMappings
        );
        setArtifactData("canvasArtifact", { data: updatedData });
    }, [fieldMappings, getUpdatedContentData, contextData?.artifact?.canvasArtifact?.data, setArtifactData]);

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center p-8">
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                <h3 className="mb-2 font-semibold text-lg text-red-800">
                    Invalid JSON for Kanban
                </h3>
                <p className="text-red-600">Error parsing JSON data: {error}</p>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center p-8">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
                <h3 className="mb-2 font-semibold text-gray-800 text-lg">
                    No Data Available
                </h3>
                <p className="text-gray-600">
                    No data found to display in Kanban board.
                </p>
                </div>
            </div>
        );
    }

    try {
        return (
            <div className="w-full p-4">
                <KanbanProvider
                columns={newColumns}
                data={newFeatures}
                onDataChange={onDataChange}
                >
                {(column) => (
                    <KanbanBoard id={column.id} key={column.id}>
                    <KanbanHeader>
                        <div className="flex items-center gap-2">
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: column.color as string }}
                        />
                        <span>{column.name}</span>
                        </div>
                    </KanbanHeader>
                    <KanbanCards id={column.id}>
                        {(feature: (typeof newFeatures)[number]) => (
                        <KanbanCard
                            column={column.id}
                            id={feature.id}
                            key={feature.id}
                            name={feature.name}
                        >
                            <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-1">
                                <p className="m-0 flex-1 font-medium text-sm">
                                {feature.name}
                                </p>
                            </div>
                            {feature.owner && (
                                <Avatar className="h-4 w-4 shrink-0">
                                <AvatarImage src={feature.owner?.image} />
                                <AvatarFallback>
                                    {feature.owner?.name?.slice(0, 2)}
                                </AvatarFallback>
                                </Avatar>
                            )}
                            </div>
                            <p className="m-0 text-muted-foreground text-xs">
                            {(() => {
                                try {
                                const startDate =
                                    feature.startAt instanceof Date &&
                                    !Number.isNaN(feature.startAt.getTime())
                                    ? shortDateFormatter.format(feature.startAt)
                                    : "N/A";
                                const endDate =
                                    feature.endAt instanceof Date &&
                                    !Number.isNaN(feature.endAt.getTime())
                                    ? dateFormatter.format(feature.endAt)
                                    : "N/A";
                                return `${startDate} - ${endDate}`;
                                } catch (_error) {
                                return "Invalid date";
                                }
                            })()}
                            </p>
                        </KanbanCard>
                        )}
                    </KanbanCards>
                    </KanbanBoard>
                )}
                </KanbanProvider>
            </div>
        );
    } catch (error) {
        console.error("Error rendering Kanban board:", error);
        return (
            <div className="flex h-full w-full items-center justify-center p-8">
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                <h3 className="mb-2 font-semibold text-lg text-red-800">
                    Kanban Rendering Error
                </h3>
                <p className="text-red-600">
                    Error rendering Kanban board:{" "}
                    {error instanceof Error ? error.message : "Unknown error"}
                </p>
                </div>
            </div>
        );
    }
};

export default DynamicKanban;