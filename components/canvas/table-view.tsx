"use client";

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderGroup,
  TableProvider,
  TableRow,
} from "@/components/ui/shadcn-io/table";
import type { TableTransformedData } from "@/lib/types";

type CanvasTableViewProps = {
  transformedData: TableTransformedData;
};

export function CanvasTableView({ transformedData }: CanvasTableViewProps) {
  const { columns, data } = transformedData;

  return (
    <TableProvider columns={columns} data={data}>
      <TableHeader>
        {({ headerGroup }) => (
          <TableHeaderGroup headerGroup={headerGroup} key={headerGroup.id}>
            {({ header }) => <TableHead header={header} key={header.id} />}
          </TableHeaderGroup>
        )}
      </TableHeader>
      <TableBody>
        {({ row }) => (
          <TableRow key={row.id} row={row}>
            {({ cell }) => <TableCell cell={cell} key={cell.id} />}
          </TableRow>
        )}
      </TableBody>
    </TableProvider>
  );
}
