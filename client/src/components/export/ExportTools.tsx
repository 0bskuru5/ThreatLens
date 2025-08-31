import React, { useState } from 'react'
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

interface ExportToolsProps {
  data: any[]
  filename?: string
  title?: string
  formats?: Array<'pdf' | 'csv' | 'xlsx' | 'json'>
  columns?: Array<{
    key: string
    label: string
    format?: (value: any) => string
  }>
  className?: string
}

export default function ExportTools({
  data,
  filename = 'export',
  title = 'Data Export',
  formats = ['csv', 'xlsx', 'json', 'pdf'],
  columns,
  className = ''
}: ExportToolsProps) {
  const [exporting, setExporting] = useState<string | null>(null)

  // Prepare data for export
  const prepareData = () => {
    if (!columns) {
      return data
    }

    return data.map(item =>
      columns.reduce((acc, col) => {
        const value = item[col.key]
        acc[col.label] = col.format ? col.format(value) : value
        return acc
      }, {} as Record<string, any>)
    )
  }

  // Export to CSV
  const exportToCSV = async () => {
    setExporting('csv')
    try {
      const preparedData = prepareData()
      const csv = Papa.unparse(preparedData)

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('CSV export error:', error)
    } finally {
      setExporting(null)
    }
  }

  // Export to Excel
  const exportToExcel = async () => {
    setExporting('xlsx')
    try {
      const preparedData = prepareData()
      const worksheet = XLSX.utils.json_to_sheet(preparedData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

      XLSX.writeFile(workbook, `${filename}.xlsx`)
    } catch (error) {
      console.error('Excel export error:', error)
    } finally {
      setExporting(null)
    }
  }

  // Export to JSON
  const exportToJSON = async () => {
    setExporting('json')
    try {
      const preparedData = prepareData()
      const jsonString = JSON.stringify(preparedData, null, 2)

      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}.json`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('JSON export error:', error)
    } finally {
      setExporting(null)
    }
  }

  // Export to PDF
  const exportToPDF = async () => {
    setExporting('pdf')
    try {
      const preparedData = prepareData()
      const pdf = new jsPDF()

      // Add title
      pdf.setFontSize(20)
      pdf.text(title, 20, 30)

      // Add timestamp
      pdf.setFontSize(10)
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 45)
      pdf.text(`Total records: ${preparedData.length}`, 20, 52)

      // Add table
      const headers = columns ? columns.map(col => col.label) : Object.keys(preparedData[0] || {})
      const rows = preparedData.map(item =>
        columns ? columns.map(col => String(item[col.label] || '')) : Object.values(item).map(String)
      )

      // Simple table implementation
      let yPosition = 70
      const rowHeight = 10
      const colWidth = 190 / headers.length

      // Headers
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      headers.forEach((header, index) => {
        pdf.text(header, 20 + (index * colWidth), yPosition)
      })

      // Rows
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      rows.slice(0, 50).forEach((row, rowIndex) => {
        yPosition += rowHeight
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 30
        }

        row.forEach((cell, colIndex) => {
          const truncatedCell = cell.length > 15 ? cell.substring(0, 15) + '...' : cell
          pdf.text(truncatedCell, 20 + (colIndex * colWidth), yPosition)
        })
      })

      // Add footer
      if (rows.length > 50) {
        pdf.text(`... and ${rows.length - 50} more records`, 20, yPosition + 20)
      }

      pdf.save(`${filename}.pdf`)
    } catch (error) {
      console.error('PDF export error:', error)
    } finally {
      setExporting(null)
    }
  }

  const handleExport = (format: string) => {
    switch (format) {
      case 'csv':
        exportToCSV()
        break
      case 'xlsx':
        exportToExcel()
        break
      case 'json':
        exportToJSON()
        break
      case 'pdf':
        exportToPDF()
        break
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
      case 'xlsx':
        return <FileSpreadsheet className="h-4 w-4" />
      case 'json':
        return <FileJson className="h-4 w-4" />
      case 'pdf':
        return <FileText className="h-4 w-4" />
      default:
        return <Download className="h-4 w-4" />
    }
  }

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'xlsx':
        return 'Excel'
      default:
        return format.toUpperCase()
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600">Export:</span>
      {formats.map(format => (
        <button
          key={format}
          onClick={() => handleExport(format)}
          disabled={exporting !== null}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting === format ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            getFormatIcon(format)
          )}
          <span className="ml-2">{getFormatLabel(format)}</span>
        </button>
      ))}
    </div>
  )
}
