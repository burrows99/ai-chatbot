'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

export type ColumnDef<TData> = {
  id?: string;
  accessorKey?: string;
  accessorFn?: (row: TData) => any;
  header: string | ((context: { column: Column<TData> }) => React.ReactNode);
  cell: string | ((context: { row: Row<TData> }) => React.ReactNode);
  enableSorting?: boolean;
};

export type Column<TData> = {
  id: string;
  columnDef: ColumnDef<TData>;
  getCanSort: () => boolean;
  getIsSorted: () => false | 'asc' | 'desc';
  toggleSorting: (desc?: boolean) => void;
};

export type Cell<TData> = {
  id: string;
  column: Column<TData>;
  row: Row<TData>;
  getValue: () => any;
  renderValue: () => any;
};

export type Row<TData> = {
  id: string;
  original: TData;
  index: number;
  getVisibleCells: () => Cell<TData>[];
};

export type HeaderGroup<TData> = {
  id: string;
  headers: Header<TData>[];
};

export type Header<TData> = {
  id: string;
  column: Column<TData>;
  isPlaceholder: boolean;
  colSpan: number;
  rowSpan: number;
  getContext: () => { column: Column<TData> };
};

type TableContextValue<TData> = {
  columns: ColumnDef<TData>[];
  data: TData[];
  sorting: { id: string; desc: boolean }[];
  setSorting: React.Dispatch<React.SetStateAction<{ id: string; desc: boolean }[]>>;
  getHeaderGroups: () => HeaderGroup<TData>[];
  getRows: () => Row<TData>[];
};

const TableContext = React.createContext<TableContextValue<any> | null>(null);

function useTable<TData>() {
  const context = React.useContext(TableContext);
  if (!context) {
    throw new Error('Table components must be used within TableProvider');
  }
  return context as TableContextValue<TData>;
}

interface TableProviderProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  children: React.ReactNode;
}

export function TableProvider<TData>({
  columns,
  data,
  children,
}: TableProviderProps<TData>) {
  const [sorting, setSorting] = React.useState<{ id: string; desc: boolean }[]>([]);

  const getHeaderGroups = React.useCallback((): HeaderGroup<TData>[] => {
    const headers: Header<TData>[] = columns.map((columnDef, index) => {
      const columnId = columnDef.id || columnDef.accessorKey || `column-${index}`;
      const column: Column<TData> = {
        id: columnId,
        columnDef,
        getCanSort: () => columnDef.enableSorting !== false,
        getIsSorted: () => {
          const sort = sorting.find(s => s.id === columnId);
          return sort ? (sort.desc ? 'desc' : 'asc') : false;
        },
        toggleSorting: (desc?: boolean) => {
          setSorting(prev => {
            const existing = prev.find(s => s.id === columnId);
            if (existing) {
              if (desc === undefined) {
                return prev.filter(s => s.id !== columnId);
              }
              return prev.map(s => s.id === columnId ? { ...s, desc } : s);
            }
            return [...prev, { id: columnId, desc: desc ?? false }];
          });
        },
      };

      return {
        id: columnId,
        column,
        isPlaceholder: false,
        colSpan: 1,
        rowSpan: 1,
        getContext: () => ({ column }),
      };
    });

    return [{ id: 'headerGroup-0', headers }];
  }, [columns, sorting]);

  const getRows = React.useCallback((): Row<TData>[] => {
    let sortedData = [...data];

    if (sorting.length > 0) {
      const sort = sorting[0];
      const column = columns.find(c => (c.id || c.accessorKey) === sort.id);
      if (column) {
        sortedData.sort((a, b) => {
          let aVal: any;
          let bVal: any;

          if (column.accessorFn) {
            aVal = column.accessorFn(a);
            bVal = column.accessorFn(b);
          } else if (column.accessorKey) {
            aVal = (a as any)[column.accessorKey];
            bVal = (b as any)[column.accessorKey];
          }

          if (aVal < bVal) return sort.desc ? 1 : -1;
          if (aVal > bVal) return sort.desc ? -1 : 1;
          return 0;
        });
      }
    }

    return sortedData.map((item, index) => {
      const row: Row<TData> = {
        id: `row-${index}`,
        original: item,
        index,
        getVisibleCells: () => {
          return columns.map((columnDef, colIndex) => {
            const columnId = columnDef.id || columnDef.accessorKey || `column-${colIndex}`;
            const column: Column<TData> = {
              id: columnId,
              columnDef,
              getCanSort: () => columnDef.enableSorting !== false,
              getIsSorted: () => {
                const sort = sorting.find(s => s.id === columnId);
                return sort ? (sort.desc ? 'desc' : 'asc') : false;
              },
              toggleSorting: (desc?: boolean) => {
                setSorting(prev => {
                  const existing = prev.find(s => s.id === columnId);
                  if (existing) {
                    if (desc === undefined) {
                      return prev.filter(s => s.id !== columnId);
                    }
                    return prev.map(s => s.id === columnId ? { ...s, desc } : s);
                  }
                  return [...prev, { id: columnId, desc: desc ?? false }];
                });
              },
            };

            const cell: Cell<TData> = {
              id: `${row.id}-${columnId}`,
              column,
              row,
              getValue: () => {
                if (columnDef.accessorFn) {
                  return columnDef.accessorFn(item);
                } else if (columnDef.accessorKey) {
                  return (item as any)[columnDef.accessorKey];
                }
                return undefined;
              },
              renderValue: () => {
                if (columnDef.accessorFn) {
                  return columnDef.accessorFn(item);
                } else if (columnDef.accessorKey) {
                  return (item as any)[columnDef.accessorKey];
                }
                return undefined;
              },
            };

            return cell;
          });
        },
      };

      return row;
    });
  }, [data, columns, sorting]);

  const value = React.useMemo(
    () => ({
      columns,
      data,
      sorting,
      setSorting,
      getHeaderGroups,
      getRows,
    }),
    [columns, data, sorting, getHeaderGroups, getRows]
  );

  return (
    <TableContext.Provider value={value}>
      <div className="w-full overflow-auto rounded-md border">
        <table className="w-full caption-bottom text-sm">{children}</table>
      </div>
    </TableContext.Provider>
  );
}

interface TableHeaderProps {
  children: (context: { headerGroup: HeaderGroup<any> }) => React.ReactNode;
}

export function TableHeader({ children }: TableHeaderProps) {
  const { getHeaderGroups } = useTable();
  const headerGroups = getHeaderGroups();

  return <thead className="[&_tr]:border-b">{headerGroups.map(headerGroup => children({ headerGroup }))}</thead>;
}

interface TableHeaderGroupProps {
  headerGroup: HeaderGroup<any>;
  children: (context: { header: Header<any> }) => React.ReactNode;
}

export function TableHeaderGroup({ headerGroup, children }: TableHeaderGroupProps) {
  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      {headerGroup.headers.map(header => children({ header }))}
    </tr>
  );
}

interface TableHeadProps {
  header: Header<any>;
}

export function TableHead({ header }: TableHeadProps) {
  const { column } = header;
  const { columnDef } = column;

  return (
    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
      {typeof columnDef.header === 'function' ? columnDef.header({ column }) : columnDef.header}
    </th>
  );
}

interface TableColumnHeaderProps {
  column: Column<any>;
  title: string;
}

export function TableColumnHeader({ column, title }: TableColumnHeaderProps) {
  if (!column.getCanSort()) {
    return <span>{title}</span>;
  }

  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => {
        if (sorted === 'asc') {
          column.toggleSorting(true);
        } else if (sorted === 'desc') {
          column.toggleSorting(false);
        } else {
          column.toggleSorting(false);
        }
      }}
    >
      <span>{title}</span>
      {sorted === 'desc' ? (
        <ChevronDown className="ml-2 h-4 w-4" />
      ) : sorted === 'asc' ? (
        <ChevronUp className="ml-2 h-4 w-4" />
      ) : null}
    </Button>
  );
}

interface TableBodyProps {
  children: (context: { row: Row<any> }) => React.ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  const { getRows } = useTable();
  const rows = getRows();

  return (
    <tbody className="[&_tr:last-child]:border-0">
      {rows.map(row => children({ row }))}
    </tbody>
  );
}

interface TableRowProps {
  row: Row<any>;
  children: (context: { cell: Cell<any> }) => React.ReactNode;
}

export function TableRow({ row, children }: TableRowProps) {
  const cells = row.getVisibleCells();

  return (
    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
      {cells.map(cell => children({ cell }))}
    </tr>
  );
}

interface TableCellProps {
  cell: Cell<any>;
}

export function TableCell({ cell }: TableCellProps) {
  const { column, row } = cell;
  const { columnDef } = column;

  return (
    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
      {typeof columnDef.cell === 'function' ? columnDef.cell({ row }) : cell.renderValue()}
    </td>
  );
}
