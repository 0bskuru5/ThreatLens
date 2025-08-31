import React, { useState, useEffect } from 'react'
import { Search, Filter, X, Calendar, MapPin, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

interface FilterOption {
  key: string
  label: string
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
}

interface AdvancedFiltersProps {
  filters: FilterOption[]
  onFilterChange: (filters: Record<string, any>) => void
  onReset: () => void
  className?: string
}

export default function AdvancedFilters({
  filters,
  onFilterChange,
  onReset,
  className = ''
}: AdvancedFiltersProps) {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  // Count active filters
  useEffect(() => {
    const count = Object.values(filterValues).filter(value =>
      value !== '' && value !== null && value !== undefined &&
      (Array.isArray(value) ? value.length > 0 : true)
    ).length
    setActiveFiltersCount(count)
  }, [filterValues])

  const handleFilterChange = (key: string, value: any) => {
    const newValues = { ...filterValues, [key]: value }
    setFilterValues(newValues)
    onFilterChange(newValues)
  }

  const handleRemoveFilter = (key: string) => {
    const newValues = { ...filterValues }
    delete newValues[key]
    setFilterValues(newValues)
    onFilterChange(newValues)
  }

  const handleDateRangeChange = (key: string, startDate: string, endDate: string) => {
    const value = startDate && endDate ? { start: startDate, end: endDate } : null
    handleFilterChange(key, value)
  }

  const renderFilterInput = (filter: FilterOption) => {
    switch (filter.type) {
      case 'text':
        return (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={filter.placeholder || `Search ${filter.label}`}
              value={filterValues[filter.key] || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
        )

      case 'select':
        return (
          <select
            value={filterValues[filter.key] || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          >
            <option value="">{`All ${filter.label}`}</option>
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        return (
          <div className="space-y-2">
            {filter.options?.map(option => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={(filterValues[filter.key] || []).includes(option.value)}
                  onChange={(e) => {
                    const current = filterValues[filter.key] || []
                    const updated = e.target.checked
                      ? [...current, option.value]
                      : current.filter((v: string) => v !== option.value)
                    handleFilterChange(filter.key, updated)
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )

      case 'date':
        return (
          <input
            type="date"
            value={filterValues[filter.key] || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        )

      case 'daterange':
        const dateRange = filterValues[filter.key] || {}
        return (
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">From</label>
              <input
                type="date"
                value={dateRange.start || ''}
                onChange={(e) => handleDateRangeChange(filter.key, e.target.value, dateRange.end || '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">To</label>
              <input
                type="date"
                value={dateRange.end || ''}
                onChange={(e) => handleDateRangeChange(filter.key, dateRange.start || '', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getActiveFilterLabels = () => {
    return Object.entries(filterValues).map(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return null

      const filter = filters.find(f => f.key === key)
      if (!filter) return null

      let label = filter.label + ': '

      if (Array.isArray(value)) {
        label += value.join(', ')
      } else if (typeof value === 'object' && value.start && value.end) {
        label += `${format(new Date(value.start), 'MMM dd')} - ${format(new Date(value.end), 'MMM dd')}`
      } else if (filter.type === 'select' && filter.options) {
        const option = filter.options.find(opt => opt.value === value)
        label += option ? option.label : value
      } else {
        label += String(value)
      }

      return { key, label }
    }).filter(Boolean)
  }

  const activeFilterLabels = getActiveFilterLabels()

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Filter Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {activeFiltersCount}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={onReset}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Active filters */}
        {activeFilterLabels.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {activeFilterLabels.map(({ key, label }) => (
              <span
                key={key}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800"
              >
                {label}
                <button
                  onClick={() => handleRemoveFilter(key)}
                  className="ml-1 hover:bg-primary-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Filter Controls */}
      {isExpanded && (
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map(filter => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {filter.label}
                </label>
                {renderFilterInput(filter)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
