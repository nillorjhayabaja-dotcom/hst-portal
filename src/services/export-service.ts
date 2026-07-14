// Export Service - Uses real backend API
import { toast } from "sonner";
import { API_BASE_URL, getAuthHeaders } from '@/config/environment';

export async function exportToPDF(data: any, filename: string): Promise<void> {
  try {
    // Call backend PDF generation endpoint
    const response = await fetch(`${API_BASE_URL}/export/pdf`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ data, filename }),
    });

    if (!response.ok) {
      throw new Error('PDF generation failed');
    }

    // Download the PDF blob
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success(`PDF "${filename}.pdf" has been generated`);
  } catch (error: any) {
    toast.error(error.message || 'Failed to generate PDF');
    throw error;
  }
}

export async function exportToExcel(data: any, filename: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/export/excel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ data, filename }),
    });

    if (!response.ok) {
      throw new Error('Excel generation failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success(`Excel "${filename}.xlsx" has been generated`);
  } catch (error: any) {
    toast.error(error.message || 'Failed to generate Excel');
    throw error;
  }
}

export function printTable(data: any[], filename: string): void {
  // Print table using the backend or browser print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const html = `
      <html>
        <head><title>${filename}</title></head>
        <body>
          <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>
              ${data.map(row => `<tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

export async function exportToCSV(data: any, filename: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/export/csv`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ data, filename }),
    });

    if (!response.ok) {
      throw new Error('CSV generation failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success(`CSV "${filename}.csv" has been generated`);
  } catch (error: any) {
    toast.error(error.message || 'Failed to generate CSV');
    throw error;
  }
}