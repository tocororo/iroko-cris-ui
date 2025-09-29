// src/app/services/export.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  exportToCSV(data: any[], filename: string = 'data.csv'): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Handle values that might contain commas or quotes
            if (typeof value === 'object') {
              return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            }
            return `"${String(value || '').replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\n');

    this.downloadFile(csvContent, filename, 'text/csv');
  }

  exportToJSON(data: any, filename: string = 'data.json'): void {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, filename, 'application/json');
  }

  exportTableToCSV(
    tableElement: HTMLTableElement,
    filename: string = 'table.csv'
  ): void {
    const rows = Array.from(tableElement.querySelectorAll('tr'));
    const csvContent = rows
      .map((row) =>
        Array.from(row.querySelectorAll('th, td'))
          .map((cell) => `"${cell.textContent?.replace(/"/g, '""') || ''}"`)
          .join(',')
      )
      .join('\n');

    this.downloadFile(csvContent, filename, 'text/csv');
  }

  private downloadFile(
    content: string,
    filename: string,
    mimeType: string
  ): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}
