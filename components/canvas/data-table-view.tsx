"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
// biome-ignore lint/performance/noNamespaceImport: React namespace import required for hooks and memo
import * as React from "react";
import { JsonViewer } from "@/components/json-viewer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type TableRowData = Record<string, string> & {
  viewDetails?: Record<string, unknown> | null;
};

export type TableTransformedData = {
  columns: ColumnDef<TableRowData, string>[];
  data: TableRowData[];
};

type DataTableDemoProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
};

export function DataTableView<TData extends TableRowData, TValue>({
  columns: baseColumns,
  data,
}: DataTableDemoProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedRowDetails, setSelectedRowDetails] = React.useState<Record<
    string,
    unknown
  > | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Enhance columns with select, sorting, and actions
  const columns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    const enhanced: ColumnDef<TData, TValue>[] = [
      // Select column
      {
        id: "select",
        header: ({ table: tableInstance }) => (
          <Checkbox
            aria-label="Select all"
            checked={
              tableInstance.getIsAllPageRowsSelected() ||
              (tableInstance.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              tableInstance.toggleAllPageRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label="Select row"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ];

    // Add base columns with sorting capability
    const enhancedBaseColumns = baseColumns.map((col) => {
      const enhancedCol = { ...col };

      // If column has accessorKey and no custom header, add sorting button
      if (
        "accessorKey" in col &&
        col.accessorKey &&
        typeof col.header === "string"
      ) {
        enhancedCol.header = ({ column }) => (
          <Button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            variant="ghost"
          >
            {col.header as string}
            <ArrowUpDown />
          </Button>
        );
      }

      return enhancedCol;
    });

    enhanced.push(...enhancedBaseColumns);

    // Actions column
    enhanced.push({
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const record = row.original as TableRowData;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 w-8 p-0" variant="ghost">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {record.id && (
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(record.id)}
                >
                  Copy ID
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!record.viewDetails}
                onClick={() => {
                  if (record.viewDetails) {
                    setSelectedRowDetails(record.viewDetails);
                    setIsDialogOpen(true);
                  }
                }}
              >
                View details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    } as ColumnDef<TData, TValue>);

    return enhanced;
  }, [baseColumns]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Get the first filterable column for the search input
  const firstFilterableColumn = React.useMemo(() => {
    return table.getAllColumns().find((column) => column.getCanFilter());
  }, [table]);

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        {firstFilterableColumn && (
          <Input
            className="max-w-sm"
            onChange={(event) =>
              firstFilterableColumn.setFilterValue(event.target.value)
            }
            placeholder={`Filter ${firstFilterableColumn.id}...`}
            value={(firstFilterableColumn.getFilterValue() as string) ?? ""}
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="ml-auto" variant="outline">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    checked={column.getIsVisible()}
                    className="capitalize"
                    key={column.id}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            size="sm"
            variant="outline"
          >
            Previous
          </Button>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            size="sm"
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Row Details</DialogTitle>
            <DialogDescription>
              Detailed information from the tool result for this record.
            </DialogDescription>
          </DialogHeader>
          {selectedRowDetails && (
            <div className="mt-4">
              <JsonViewer data={selectedRowDetails} defaultExpanded={true} rootName="" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
