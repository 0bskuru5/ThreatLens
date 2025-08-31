import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'

interface Column {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
  width?: string
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  loading?: boolean
  pageSize?: number
  searchable?: boolean
  selectable?: boolean
  onRowClick?: (row: any) => void
  onSelectionChange?: (selectedRows: any[]) => void
  className?: string
}

type SortDirection = 'asc' | 'desc' | null

export default function DataTable({
  data,
  columns,
  loading = false,
  pageSize = 10,
  searchable = false,
  selectable = false,
  onRowClick,
  onSelectionChange,
  className = ''
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data

    // Apply search filter
    if (searchTerm && searchable) {
      filtered = data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply sorting
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [data, searchTerm, sortColumn, sortDirection])

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return processedData.slice(startIndex, startIndex + pageSize)
  }, [processedData, currentPage, pageSize])

  const totalPages = Math.ceil(processedData.length / pageSize)

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (!columns.find(col => col.key === columnKey)?.sortable) return

    if (sortColumn === columnKey) {
      // Cycle through sort directions: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortColumn(null)
      }
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  // Handle row selection
  const handleRowSelect = (rowIndex: number, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(rowIndex)
    } else {
      newSelected.delete(rowIndex)
    }
    setSelectedRows(newSelected)
    onSelectionChange?.(Array.from(newSelected).map(index => processedData[index]))
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIndices = new Set(paginatedData.map((_, index) => (currentPage - 1) * pageSize + index))
      setSelectedRows(allIndices)
      onSelectionChange?.(paginatedData)
    } else {
      setSelectedRows(new Set())
      onSelectionChange?.([])
    }
  }

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) return null

    if (sortDirection === 'asc') return <ChevronUp className="h-4 w-4" />
    if (sortDirection === 'desc') return <ChevronDown className="h-4 w-4" />
    return null
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Search bar */}
      {searchable && (
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && paginatedData.every((_, index) =>
                      selectedRows.has((currentPage - 1) * pageSize + index)
                    )}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const actualIndex = (currentPage - 1) * pageSize + index
                const isSelected = selectedRows.has(actualIndex)

                return (
                  <tr
                    key={actualIndex}
                    className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''} ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleRowSelect(actualIndex, e.target.checked)
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    {columns.map(column => (
                      <td
                        key={column.key}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : String(row[column.key] || '')
                        }
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} results
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
