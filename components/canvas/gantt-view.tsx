"use client";

import { EyeIcon, LinkIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  GanttCreateMarkerTrigger,
  GanttFeatureItem,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttHeader,
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttToday,
} from "@/components/ui/shadcn-io/gantt";
import type { GanttTransformedData } from "@/lib/types";

type CanvasGanttViewProps = {
  transformedData: GanttTransformedData;
};

export function CanvasGanttView({ transformedData }: CanvasGanttViewProps) {
  const { groups } = transformedData;
  const [_features, setFeatures] = useState(transformedData.features);

  const handleViewFeature = (id: string) => {
    console.log(`Feature selected: ${id}`);
  };

  const handleCopyLink = (id: string) => {
    console.log(`Copy link: ${id}`);
  };

  const handleRemoveFeature = (id: string) => {
    setFeatures((prev) => prev.filter((feature) => feature.id !== id));
  };

  const handleMoveFeature = (id: string, startAt: Date, endAt: Date | null) => {
    if (!endAt) {
      return;
    }
    setFeatures((prev) =>
      prev.map((feature) =>
        feature.id === id ? { ...feature, startAt, endAt } : feature
      )
    );
    console.log(`Move feature: ${id} from ${startAt} to ${endAt}`);
  };

  const handleAddFeature = (date: Date) => {
    console.log(`Add feature: ${date.toISOString()}`);
  };

  const handleCreateMarker = (date: Date) => {
    console.log(`Create marker: ${date.toISOString()}`);
  };

  return (
    <GanttProvider
      className="border"
      onAddItem={handleAddFeature}
      range="monthly"
      zoom={100}
    >
      <GanttSidebar>
        {Object.entries(groups).map(([group, groupFeatures]) => (
          <GanttSidebarGroup key={group} name={group}>
            {groupFeatures.map((feature) => (
              <GanttSidebarItem
                feature={feature}
                key={feature.id}
                onSelectItem={handleViewFeature}
              />
            ))}
          </GanttSidebarGroup>
        ))}
      </GanttSidebar>
      <GanttTimeline>
        <GanttHeader />
        <GanttFeatureList>
          {Object.entries(groups).map(([group, groupFeatures]) => (
            <GanttFeatureListGroup key={group}>
              {groupFeatures.map((feature) => (
                <div className="flex" key={feature.id}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <button
                        onClick={() => handleViewFeature(feature.id)}
                        type="button"
                      >
                        <GanttFeatureItem
                          onMove={handleMoveFeature}
                          {...feature}
                        >
                          <p className="flex-1 truncate text-xs">
                            {feature.name}
                          </p>
                          {feature.owner && (
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={feature.owner.image} />
                              <AvatarFallback>
                                {feature.owner.name?.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </GanttFeatureItem>
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        className="flex items-center gap-2"
                        onClick={() => handleViewFeature(feature.id)}
                      >
                        <EyeIcon className="text-muted-foreground" size={16} />
                        View feature
                      </ContextMenuItem>
                      <ContextMenuItem
                        className="flex items-center gap-2"
                        onClick={() => handleCopyLink(feature.id)}
                      >
                        <LinkIcon className="text-muted-foreground" size={16} />
                        Copy link
                      </ContextMenuItem>
                      <ContextMenuItem
                        className="flex items-center gap-2 text-destructive"
                        onClick={() => handleRemoveFeature(feature.id)}
                      >
                        <TrashIcon size={16} />
                        Remove from roadmap
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </div>
              ))}
            </GanttFeatureListGroup>
          ))}
        </GanttFeatureList>
        <GanttToday />
        <GanttCreateMarkerTrigger onCreateMarker={handleCreateMarker} />
      </GanttTimeline>
    </GanttProvider>
  );
}
