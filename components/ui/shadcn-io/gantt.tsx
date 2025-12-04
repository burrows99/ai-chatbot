'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type GanttRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

type GanttContextValue = {
  range: GanttRange;
  zoom: number;
  onAddItem?: (date: Date) => void;
};

const GanttContext = React.createContext<GanttContextValue | null>(null);

function useGantt() {
  const context = React.useContext(GanttContext);
  if (!context) {
    throw new Error('Gantt components must be used within GanttProvider');
  }
  return context;
}

interface GanttProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  range: GanttRange;
  zoom: number;
  onAddItem?: (date: Date) => void;
  children: React.ReactNode;
}

export function GanttProvider({
  range,
  zoom,
  onAddItem,
  className,
  children,
  ...props
}: GanttProviderProps) {
  return (
    <GanttContext.Provider value={{ range, zoom, onAddItem }}>
      <div className={cn('flex h-full', className)} {...props}>
        {children}
      </div>
    </GanttContext.Provider>
  );
}

interface GanttSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GanttSidebar({
  className,
  children,
  ...props
}: GanttSidebarProps) {
  return (
    <div
      className={cn('w-80 flex-shrink-0 border-r bg-background', className)}
      {...props}
    >
      <ScrollArea className="h-full">
        <div className="p-4">{children}</div>
      </ScrollArea>
    </div>
  );
}

interface GanttSidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  children: React.ReactNode;
}

export function GanttSidebarGroup({
  name,
  className,
  children,
  ...props
}: GanttSidebarGroupProps) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      <h3 className="mb-2 font-semibold text-sm">{name}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

interface GanttSidebarItemProps {
  feature: any;
  onSelectItem?: (id: string) => void;
}

export function GanttSidebarItem({ feature, onSelectItem }: GanttSidebarItemProps) {
  return (
    <button
      type="button"
      className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
      onClick={() => onSelectItem?.(feature.id)}
    >
      <div className="truncate font-medium">{feature.name}</div>
      {feature.status && (
        <div className="mt-1 flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: feature.status.color }}
          />
          <span className="text-muted-foreground text-xs">{feature.status.name}</span>
        </div>
      )}
    </button>
  );
}

interface GanttTimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GanttTimeline({
  className,
  children,
  ...props
}: GanttTimelineProps) {
  return (
    <div className={cn('relative flex-1 overflow-hidden', className)} {...props}>
      <ScrollArea className="h-full">
        <div className="relative">{children}</div>
      </ScrollArea>
    </div>
  );
}

export function GanttHeader() {
  const { range } = useGantt();

  const getDateRange = () => {
    const today = new Date();
    const dates: Date[] = [];
    const monthsToShow = 12;

    for (let i = -6; i < monthsToShow - 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      dates.push(date);
    }

    return dates;
  };

  const dates = getDateRange();

  return (
    <div className="sticky top-0 z-10 border-b bg-background">
      <div className="flex">
        {dates.map((date, index) => (
          <div
            key={index}
            className="flex-shrink-0 border-r px-4 py-2 text-center text-sm"
            style={{ width: '120px' }}
          >
            <div className="font-semibold">
              {date.toLocaleDateString('en-US', { month: 'short' })}
            </div>
            <div className="text-muted-foreground text-xs">
              {date.getFullYear()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface GanttFeatureListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GanttFeatureList({
  className,
  children,
  ...props
}: GanttFeatureListProps) {
  return (
    <div className={cn('relative', className)} {...props}>
      {children}
    </div>
  );
}

interface GanttFeatureListGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GanttFeatureListGroup({
  className,
  children,
  ...props
}: GanttFeatureListGroupProps) {
  return (
    <div className={cn('space-y-1', className)} {...props}>
      {children}
    </div>
  );
}

interface GanttFeatureItemProps {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status?: { name: string; color: string };
  owner?: { name: string; image: string };
  onMove?: (id: string, startAt: Date, endAt: Date | null) => void;
  children?: React.ReactNode;
}

export function GanttFeatureItem({
  id,
  name,
  startAt,
  endAt,
  status,
  owner,
  onMove,
  children,
}: GanttFeatureItemProps) {
  const calculatePosition = () => {
    const today = new Date();
    const startOfView = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const daysSinceStart = Math.floor(
      (startAt.getTime() - startOfView.getTime()) / (1000 * 60 * 60 * 24)
    );
    const duration = Math.floor(
      (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const left = (daysSinceStart / 30) * 120;
    const width = Math.max((duration / 30) * 120, 40);

    return { left, width };
  };

  const { left, width } = calculatePosition();

  return (
    <div className="relative h-12 border-b">
      <div
        className="absolute top-2 flex items-center gap-2 rounded-md px-3 py-1 shadow-sm"
        style={{
          left: `${left}px`,
          width: `${width}px`,
          backgroundColor: status?.color || '#6B7280',
          color: 'white',
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface GanttMarkerProps {
  id: string;
  date: Date;
  label: string;
  className?: string;
  onRemove?: (id: string) => void;
}

export function GanttMarker({
  id,
  date,
  label,
  className,
  onRemove,
}: GanttMarkerProps) {
  const calculatePosition = () => {
    const today = new Date();
    const startOfView = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const daysSinceStart = Math.floor(
      (date.getTime() - startOfView.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (daysSinceStart / 30) * 120;
  };

  const left = calculatePosition();

  return (
    <div
      className="absolute top-0 bottom-0 w-px bg-border"
      style={{ left: `${left}px` }}
    >
      <div className={cn('absolute top-2 -translate-x-1/2 rounded-md px-2 py-1 text-xs', className)}>
        {label}
      </div>
    </div>
  );
}

export function GanttToday() {
  const today = new Date();

  const calculatePosition = () => {
    const startOfView = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const daysSinceStart = Math.floor(
      (today.getTime() - startOfView.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (daysSinceStart / 30) * 120;
  };

  const left = calculatePosition();

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-primary"
      style={{ left: `${left}px` }}
    />
  );
}

interface GanttCreateMarkerTriggerProps {
  onCreateMarker?: (date: Date) => void;
}

export function GanttCreateMarkerTrigger({
  onCreateMarker,
}: GanttCreateMarkerTriggerProps) {
  return null;
}
