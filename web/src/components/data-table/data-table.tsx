import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Button } from '../ui/button'
import { EmptyState } from '../shared/ui'

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = 'Tìm kiếm trong danh sách...',
  pageSize = 6,
  searchable = true,
}: {
  data: T[]
  columns: ColumnDef<T>[]
  searchPlaceholder?: string
  pageSize?: number
  searchable?: boolean
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })
  return (
    <div className="data-table">
      {searchable && (
        <div className="table-toolbar">
          <label className="search-input">
            <Search size={16} />
            <input
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(event) => {
                setGlobalFilter(event.target.value)
                table.setPageIndex(0)
              }}
            />
          </label>
          <span className="muted">{table.getFilteredRowModel().rows.length} kết quả</span>
        </div>
      )}
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Bảng dữ liệu có thể cuộn ngang"
      >
        <table>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    aria-sort={
                      header.column.getIsSorted() === 'asc'
                        ? 'ascending'
                        : header.column.getIsSorted() === 'desc'
                          ? 'descending'
                          : undefined
                    }
                  >
                    {header.column.getCanSort() ? (
                      <button
                        className="sort-button"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() ? (
                          <ArrowDown size={12} />
                        ) : (
                          <ArrowUpDown size={12} />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!table.getFilteredRowModel().rows.length && <EmptyState />}
      <div className="table-footer">
        <span>
          Hiển thị{' '}
          {table.getFilteredRowModel().rows.length
            ? table.getState().pagination.pageIndex * pageSize + 1
            : 0}
          –
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * pageSize,
            table.getFilteredRowModel().rows.length,
          )}{' '}
          / {table.getFilteredRowModel().rows.length} kết quả
        </span>
        <div className="pagination">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Trang trước"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft size={16} />
          </Button>
          {Array.from({ length: table.getPageCount() }, (_, i) => (
            <button
              key={i}
              aria-label={`Trang ${i + 1}`}
              aria-current={table.getState().pagination.pageIndex === i ? 'page' : undefined}
              onClick={() => table.setPageIndex(i)}
            >
              {i + 1}
            </button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Trang sau"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
