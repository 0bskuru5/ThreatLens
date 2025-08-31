import React, { useState } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Calendar, Filter } from 'lucide-react'
import Card from '../Card'

interface AdvancedChartProps {
  title: string
  data: any[]
  type: 'line' | 'area' | 'bar' | 'pie' | 'scatter'
  dataKeys: string[]
  colors?: string[]
  height?: number
  showTrend?: boolean
  drillDown?: boolean
  onDrillDown?: (data: any) => void
  className?: string
}

const defaultColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
]

export default function AdvancedChart({
  title,
  data,
  type,
  dataKeys,
  colors = defaultColors,
  height = 300,
  showTrend = false,
  drillDown = false,
  onDrillDown,
  className = ''
}: AdvancedChartProps) {
  const [selectedData, setSelectedData] = useState<any>(null)
  const [timeRange, setTimeRange] = useState('24h')

  const handleClick = (data: any) => {
    if (drillDown && onDrillDown) {
      setSelectedData(data)
      onDrillDown(data)
    }
  }

  const renderTrendIndicator = () => {
    if (!showTrend || data.length < 2) return null

    const current = data[data.length - 1]?.[dataKeys[0]] || 0
    const previous = data[data.length - 2]?.[dataKeys[0]] || 0
    const change = ((current - previous) / (previous || 1)) * 100

    const isPositive = change > 0
    const isNegative = change < 0

    return (
      <div className="flex items-center space-x-1 text-sm">
        {isPositive && <TrendingUp className="h-4 w-4 text-success-600" />}
        {isNegative && <TrendingDown className="h-4 w-4 text-danger-600" />}
        {!isPositive && !isNegative && <Minus className="h-4 w-4 text-gray-600" />}
        <span className={`font-medium ${
          isPositive ? 'text-success-600' :
          isNegative ? 'text-danger-600' : 'text-gray-600'
        }`}>
          {Math.abs(change).toFixed(1)}%
        </span>
      </div>
    )
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                onClick={handleClick}
                cursor={drillDown ? 'pointer' : 'default'}
              />
            ))}
          </LineChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
                onClick={handleClick}
                cursor={drillDown ? 'pointer' : 'default'}
              />
            ))}
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                onClick={handleClick}
                cursor={drillDown ? 'pointer' : 'default'}
              />
            ))}
          </BarChart>
        )

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKeys[0]}
              onClick={handleClick}
              cursor={drillDown ? 'pointer' : 'default'}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" name="X" />
            <YAxis dataKey="y" name="Y" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            {dataKeys.map((key, index) => (
              <Scatter
                key={key}
                name={key}
                data={data}
                fill={colors[index % colors.length]}
                onClick={handleClick}
                cursor={drillDown ? 'pointer' : 'default'}
              />
            ))}
          </ScatterChart>
        )

      default:
        return <div>Unsupported chart type</div>
    }
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {showTrend && renderTrendIndicator()}
          </div>

          {drillDown && (
            <div className="flex items-center space-x-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="1h">1 Hour</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {selectedData && drillDown && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Drill-down Details</h4>
            <pre className="text-xs text-gray-600 overflow-x-auto">
              {JSON.stringify(selectedData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Card>
  )
}
