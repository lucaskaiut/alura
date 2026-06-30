import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  priority: 1 | 2 | 3;
  render?: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td className="px-4 py-3">
        <div className="skeleton h-4 w-6" />
      </td>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "Nenhum registro encontrado.",
  onRowClick,
}: DataTableProps<T>) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleExpand = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg/50">
              <th className="w-10 px-4 py-3" />
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider ${
                    col.priority >= 3 ? "hidden lg:table-cell" : col.priority === 2 ? "hidden md:table-cell" : ""
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonRow key={i} cols={columns.length} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border p-12 text-center">
        <p className="text-text-muted text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg/50">
              <th className="w-10 px-4 py-3" />
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider ${
                    col.priority >= 3 ? "hidden lg:table-cell" : col.priority === 2 ? "hidden md:table-cell" : ""
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item, idx) => {
              const isExpanded = expanded.has(idx);
              return (
                <>
                  <tr
                    key={idx}
                    className={`hover:bg-bg/50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                    onClick={() => onRowClick?.(item)}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(idx);
                        }}
                        className="p-1 rounded-lg hover:bg-border/50 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-text-muted" />
                        ) : (
                          <ChevronRight size={16} className="text-text-muted" />
                        )}
                      </button>
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-sm ${
                          col.priority >= 3 ? "hidden lg:table-cell" : col.priority === 2 ? "hidden md:table-cell" : ""
                        }`}
                      >
                        {col.render
                          ? col.render(item)
                          : String(item[col.key as keyof T] ?? "—")}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && (
                    <tr className="md:hidden bg-bg/30">
                      <td colSpan={columns.length + 1} className="px-4 py-3">
                        <div className="space-y-2 animate-fade-in">
                          {columns
                            .filter((c) => c.priority >= 2)
                            .map((col) => (
                              <div key={col.key} className="flex justify-between text-sm">
                                <span className="text-text-muted font-medium">{col.label}</span>
                                <span className="text-text">
                                  {col.render
                                    ? col.render(item)
                                    : String(item[col.key as keyof T] ?? "—")}
                                </span>
                              </div>
                            ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
