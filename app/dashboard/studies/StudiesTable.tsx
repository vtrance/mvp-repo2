"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useState } from "react";

export type StudyCollectionRow = {
  studyId: number | null;
  studyName: string | null;
  updatedAt: string | null;
  collections: string | null;
  piNames: string | null;
};

function parseCollectionNames(collections: string | null): string[] {
  if (collections == null || collections === "") return [];
  return collections
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function getCollectionCounts(rows: StudyCollectionRow[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const name of parseCollectionNames(row.collections)) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const filterInputClass =
  "w-full min-w-0 rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:placeholder:text-zinc-500";

const columns: ColumnDef<StudyCollectionRow>[] = [
  {
    accessorKey: "studyId",
    header: "Study ID",
    cell: ({ getValue }) => (
      <span className="tabular-nums">{String(getValue() ?? "—")}</span>
    ),
    filterFn: "includesString",
  },
  {
    accessorKey: "studyName",
    header: "Study Name",
    cell: ({ getValue, row }) => {
      const studyId = row.original.studyId;
      const name = String(getValue() ?? "—");
      if (studyId != null) {
        return (
          <Link
            href={`/dashboard/studies/${studyId}/analyses`}
            className="font-medium text-zinc-900 underline hover:no-underline dark:text-zinc-50"
          >
            {name}
          </Link>
        );
      }
      return <span className="font-medium">{name}</span>;
    },
    filterFn: "includesString",
  },
  /*{
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ getValue }) => String(getValue() ?? "—"),
    filterFn: "includesString",
  },*/
  {
    accessorKey: "collections",
    header: "Collections",
    cell: ({ getValue }) => (
      <span className="max-w-xs truncate block" title={String(getValue() ?? "")}>
        {String(getValue() ?? "—")}
      </span>
    ),
    filterFn: (row, columnId, filterValue: unknown) => {
      const selected = Array.isArray(filterValue) ? filterValue : [];
      if (selected.length === 0) return true;
      const rowCollections = parseCollectionNames(row.getValue(columnId) as string | null);
      return selected.some((name) => rowCollections.includes(name));
    },
  },
  {
    accessorKey: "piNames",
    header: "PI Names",
    cell: ({ getValue }) => (
      <span className="max-w-xs truncate block" title={String(getValue() ?? "")}>
        {String(getValue() ?? "—")}
      </span>
    ),
    filterFn: "includesString",
  },
];

export function StudiesTable({ data }: { data: StudyCollectionRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const pageCount = table.getPageCount();
  const canPrev = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();

  const collectionCounts = getCollectionCounts(data);
  const selectedCollections =
    (table.getColumn("collections")?.getFilterValue() as string[] | undefined) ?? [];

  const setCollectionsFilter = (next: string[]) => {
    table.getColumn("collections")?.setFilterValue(next.length === 0 ? undefined : next);
  };

  const toggleCollection = (name: string) => {
    const next = selectedCollections.includes(name)
      ? selectedCollections.filter((c) => c !== name)
      : [...selectedCollections, name];
    setCollectionsFilter(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        <aside className="shrink-0 w-48 space-y-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <p className="font-bold text-zinc-900 dark:text-zinc-50">
            Filter Results
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Collection:
          </p>
          <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            {collectionCounts.length === 0 ? (
              <li className="pl-4 text-zinc-500 dark:text-zinc-400">—</li>
            ) : (
              collectionCounts.map(({ name, count }) => (
                <li key={name} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`col-${name}`}
                    checked={selectedCollections.includes(name)}
                    onChange={() => toggleCollection(name)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-500"
                  />
                  <label htmlFor={`col-${name}`} className="cursor-pointer">
                    {name}: {count}
                  </label>
                </li>
              ))
            )}
          </ul>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              placeholder="Search all columns..."
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
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-zinc-200 dark:border-zinc-700">
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
                  {header.column.id === "collections" ? (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Use sidebar
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={(header.column.getFilterValue() as string) ?? ""}
                      onChange={(e) =>
                        header.column.setFilterValue(
                          e.target.value || undefined
                        )
                      }
                      placeholder={`Filter ${header.column.columnDef.header?.toString()?.toLowerCase() ?? ""}...`}
                      className={filterInputClass}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
                >
                  No studies found.
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
      </div>
    </div>
  );
}
