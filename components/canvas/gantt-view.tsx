"use client";
import groupBy from "lodash.groupby";
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
  GanttMarker,
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttToday,
} from "@/components/ui/shadcn-io/gantt";

export type GanttStatus = {
  id: string;
  name: string;
  color: string;
};

export type GanttUser = {
  id: string;
  name: string;
  image: string;
};

export type GanttGroup = {
  id: string;
  name: string;
};

export type GanttProduct = {
  id: string;
  name: string;
};

export type GanttInitiative = {
  id: string;
  name: string;
};

export type GanttRelease = {
  id: string;
  name: string;
};

export type GanttFeature = {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status: GanttStatus;
  owner: GanttUser;
  group: GanttGroup;
  product?: GanttProduct;
  initiative?: GanttInitiative;
  release?: GanttRelease;
};

export type GanttMarkerType = {
  id: string;
  date: Date;
  label: string;
  className: string;
};

export type GanttTransformedData = {
  statuses: GanttStatus[];
  users: GanttUser[];
  groups: GanttGroup[];
  products: GanttProduct[];
  initiatives: GanttInitiative[];
  releases: GanttRelease[];
  features: GanttFeature[];
  markers: GanttMarkerType[];
};

type GanttViewProps = {
  statuses: GanttStatus[];
  users: GanttUser[];
  groups: GanttGroup[];
  products: GanttProduct[];
  initiatives: GanttInitiative[];
  releases: GanttRelease[];
  features: GanttFeature[];
  markers: GanttMarkerType[];
};

const GanttView = ({ features, markers }: GanttViewProps) => {
  const [featuresState, setFeaturesState] = useState(features);
  const groupedFeatures = groupBy(featuresState, "group.name");
  const sortedGroupedFeatures = Object.fromEntries(
    Object.entries(groupedFeatures).sort(([nameA], [nameB]) =>
      nameA.localeCompare(nameB)
    )
  );
  const handleViewFeature = (id: string) =>
    console.log(`Feature selected: ${id}`);
  const handleCopyLink = (id: string) => console.log(`Copy link: ${id}`);
  const handleRemoveFeature = (id: string) =>
    setFeaturesState((prev) => prev.filter((feature) => feature.id !== id));
  const handleRemoveMarker = (id: string) =>
    console.log(`Remove marker: ${id}`);
  const handleCreateMarker = (date: Date) =>
    console.log(`Create marker: ${date.toISOString()}`);
  const handleMoveFeature = (id: string, startAt: Date, endAt: Date | null) => {
    if (!endAt) {
      return;
    }
    setFeaturesState((prev) =>
      prev.map((feature) =>
        feature.id === id ? { ...feature, startAt, endAt } : feature
      )
    );
    console.log(`Move feature: ${id} from ${startAt} to ${endAt}`);
  };
  const handleAddFeature = (date: Date) =>
    console.log(`Add feature: ${date.toISOString()}`);
  return (
    <GanttProvider
      className="border"
      onAddItem={handleAddFeature}
      range="monthly"
      zoom={100}
    >
      <GanttSidebar>
        {Object.entries(sortedGroupedFeatures).map(([group, groupFeatures]) => (
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
          {Object.entries(sortedGroupedFeatures).map(
            ([group, groupFeatures]) => (
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
                          <EyeIcon
                            className="text-muted-foreground"
                            size={16}
                          />
                          View feature
                        </ContextMenuItem>
                        <ContextMenuItem
                          className="flex items-center gap-2"
                          onClick={() => handleCopyLink(feature.id)}
                        >
                          <LinkIcon
                            className="text-muted-foreground"
                            size={16}
                          />
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
            )
          )}
        </GanttFeatureList>
        {markers.map((marker) => (
          <GanttMarker
            key={marker.id}
            {...marker}
            onRemove={handleRemoveMarker}
          />
        ))}
        <GanttToday />
        <GanttCreateMarkerTrigger onCreateMarker={handleCreateMarker} />
      </GanttTimeline>
    </GanttProvider>
  );
};
export default GanttView;
