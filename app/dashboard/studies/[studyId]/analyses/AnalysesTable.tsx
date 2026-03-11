"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

export type AnalysisRow = {
  analysisId: number;
  analysisPmid: string | null;
  analysisDesc: string | null;
  fileName: string | null;
};

function getColumns(studyId: number): ColumnDef<AnalysisRow>[] {
  return [
    {
      accessorKey: "analysisPmid",
      header: "Analysis PMID",
      cell: ({ getValue }) => (
        <span className="tabular-nums">{String(getValue() ?? "—")}</span>
      ),
      filterFn: "includesString",
    },
    {
      accessorKey: "analysisDesc",
      header: "Description",
      cell: ({ getValue }) => (
        <span className="max-w-2xl block text-zinc-700 dark:text-zinc-300">
          {String(getValue() ?? "—")}
        </span>
      ),
      filterFn: "includesString",
    },
    {
      id: "linkToFiles",
      header: "Link to Files",
      cell: ({ row }) => {
        const fileName = row.original.fileName;
        const analysisId = row.original.analysisId;
        const viewHref = `/dashboard/studies/${studyId}/analyses/${analysisId}`;
        return (
          <span className="flex flex-wrap items-center gap-2">
            {/*{fileName ? (
              <a
                href={fileName}
                className="font-medium text-zinc-900 underline hover:no-underline dark:text-zinc-50"
              >
                Download
              </a>
            ) : (
              <span className="text-zinc-500 dark:text-zinc-400">Download</span>
            )}
            <span className="text-zinc-400 dark:text-zinc-500">|</span>*/}
            <a
              href={viewHref}
              className="font-medium text-zinc-900 underline hover:no-underline dark:text-zinc-50"
            >
              View
            </a>
          </span>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ];
}

export function AnalysesTable({
  data,
  studyId,
}: {
  data: AnalysisRow[];
  studyId: number;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns: getColumns(studyId),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const pageCount = table.getPageCount();
  const canPrev = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search..."
          value={globalFilter ?? ""}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm shadow-sm placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:placeholder:text-zinc-400"
        />
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span>Rows per page</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-zinc-200 dark:border-zinc-700"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50"
                  >
                    <div
                      className={
                        header.column.getCanSort()
                          ? "flex cursor-pointer select-none items-center gap-1"
                          : ""
                      }
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: " ↑",
                        desc: " ↓",
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
            <tr className="border-b border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/30">
              {table.getHeaderGroups()[0]?.headers.map((header) => (
                <th key={header.id} className="px-4 py-2">
                  {header.column.getCanFilter() ? (
                    <input
                      type="text"
                      value={(header.column.getFilterValue() as string) ?? ""}
                      onChange={(e) =>
                        header.column.setFilterValue(
                          e.target.value || undefined
                        )
                      }
                      placeholder={`Filter...`}
                      className="w-full min-w-0 rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:placeholder:text-zinc-500"
                    />
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getAllColumns().length}
                  className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
                >
                  No analyses found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-zinc-700 dark:text-zinc-300"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Page {table.getState().pagination.pageIndex + 1} of {pageCount || 1}{" "}
          ({table.getFilteredRowModel().rows.length} rows)
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!canPrev}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!canNext}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
