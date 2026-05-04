/**
 * Export utility functions for NavTrack Pro
 * Provides CSV export and print functionality with Spanish locale support
 */

/**
 * Escapes a CSV cell value for proper formatting
 * Handles quotes, commas, newlines, and special characters (Spanish accents, etc.)
 */
function escapeCSVCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // If the string contains quotes, commas, or newlines, wrap in quotes and escape inner quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Converts an array of objects to CSV format string
 * @param data - Array of objects to convert
 * @param headers - Optional custom headers (key->label mapping or array of labels)
 * @returns CSV formatted string with BOM prefix for Excel compatibility
 */
export function exportToCSV(
  filename: string,
  data: Record<string, unknown>[],
  headers?: Record<string, string> | string[]
): void {
  if (!data || data.length === 0) return

  // Determine column keys from the first data object
  const keys = Object.keys(data[0])

  // Build header row
  let headerRow: string[]
  if (Array.isArray(headers)) {
    headerRow = headers.map(escapeCSVCell)
  } else if (headers && typeof headers === 'object') {
    headerRow = keys.map((key) => escapeCSVCell(headers[key] || key))
  } else {
    headerRow = keys.map(escapeCSVCell)
  }

  // Build data rows
  const dataRows = data.map((row) =>
    keys.map((key) => escapeCSVCell(row[key])).join(',')
  )

  // Combine with BOM for Excel UTF-8 compatibility
  const csvContent = '\uFEFF' + [headerRow.join(','), ...dataRows].join('\n')

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Opens a print dialog with a formatted table
 * Includes NavTrack Pro branding header and export date/time
 * @param title - Title for the printed document
 * @param columns - Array of column definitions
 * @param data - Array of row data
 */
export function printTable(
  title: string,
  columns: { key: string; label: string }[],
  data: Record<string, unknown>[]
): void {
  const now = new Date()
  const exportDate = now.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const exportTime = now.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const headerCells = columns.map((col) => `<th>${col.label}</th>`).join('')
  const dataRows = data
    .map(
      (row) =>
        `<tr>${columns.map((col) => `<td>${row[col.key] ?? ''}</td>`).join('')}</tr>`
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${title} - NavTrack Pro</title>
      <style>
        @page {
          size: landscape;
          margin: 15mm;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1a1a2e;
          margin: 0;
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #0d9488;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-logo {
          width: 36px;
          height: 36px;
          background: #0d9488;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 18px;
        }
        .brand-name {
          font-size: 20px;
          font-weight: 700;
          color: #0d9488;
        }
        .brand-sub {
          font-size: 11px;
          color: #64748b;
        }
        .export-info {
          text-align: right;
          font-size: 11px;
          color: #64748b;
        }
        .export-info .date {
          font-weight: 600;
          color: #334155;
        }
        h1 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 12px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        thead th {
          background: #0d9488;
          color: white;
          padding: 8px 10px;
          text-align: left;
          font-weight: 600;
          white-space: nowrap;
        }
        tbody td {
          padding: 6px 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        tbody tr:nth-child(even) {
          background: #f8fafc;
        }
        tbody tr:hover {
          background: #f0fdfa;
        }
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          font-size: 10px;
          color: #94a3b8;
          text-align: center;
        }
        @media print {
          body { padding: 0; }
          .header { break-after: avoid; }
          thead { display: table-header-group; }
          tr { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">
          <div class="brand-logo">⚓</div>
          <div>
            <div class="brand-name">NavTrack Pro</div>
            <div class="brand-sub">Plataforma de Gestión Marítima</div>
          </div>
        </div>
        <div class="export-info">
          <div>Exportado: <span class="date">${exportDate}</span></div>
          <div>Hora: <span class="date">${exportTime}</span></div>
          <div>Registros: ${data.length}</div>
        </div>
      </div>
      <h1>${title}</h1>
      <table>
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${dataRows}</tbody>
      </table>
      <div class="footer">
        Documento generado por NavTrack Pro — ${exportDate} ${exportTime}
      </div>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank', 'width=1000,height=700')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}
