'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type Column = {
  id: string;
  name: string;
  color?: string;
};

type KanbanContextValue = {
  columns: Column[];
  data: any[];
  onDataChange?: (data: any[]) => void;
};

const KanbanContext = React.createContext<KanbanContextValue | null>(null);

function useKanban() {
  const context = React.useContext(KanbanContext);
  if (!context) {
    throw new Error('Kanban components must be used within KanbanProvider');
  }
  return context;
}

interface KanbanProviderProps {
  columns: Column[];
  data: any[];
  onDataChange?: (data: any[]) => void;
  children: (column: Column) => React.ReactNode;
}

export function KanbanProvider({
  columns,
  data,
  onDataChange,
  children,
}: KanbanProviderProps) {
  return (
    <KanbanContext.Provider value={{ columns, data, onDataChange }}>
      <div className="flex h-full gap-4 overflow-x-auto p-4">
        {columns.map((column) => children(column))}
      </div>
    </KanbanContext.Provider>
  );
}

interface KanbanBoardProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  children: React.ReactNode;
}

export function KanbanBoard({
  id,
  className,
  children,
  ...props
}: KanbanBoardProps) {
  return (
    <div
      className={cn('w-80 flex-shrink-0', className)}
      data-column-id={id}
      {...props}
    >
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {children}
      </div>
    </div>
  );
}

interface KanbanHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function KanbanHeader({
  className,
  children,
  ...props
}: KanbanHeaderProps) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-4 pb-3', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface KanbanCardsProps {
  id: string;
  children: (item: any) => React.ReactNode;
}

export function KanbanCards({ id, children }: KanbanCardsProps) {
  const { data } = useKanban();
  const columnData = data.filter((item) => item.column === id);

  return (
    <div className="p-4 pt-0">
      <div className="max-h-[600px] space-y-3 overflow-y-auto">
        {columnData.map((item) => children(item))}
      </div>
    </div>
  );
}

interface KanbanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  column: string;
  name: string;
  children: React.ReactNode;
}

export function KanbanCard({
  id,
  column,
  name,
  className,
  children,
  ...props
}: KanbanCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-3 text-card-foreground shadow-sm hover:shadow-md transition-shadow',
        className
      )}
      data-card-id={id}
      data-column-id={column}
      {...props}
    >
      {children}
    </div>
  );
}
