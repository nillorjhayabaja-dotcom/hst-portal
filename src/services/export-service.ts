// Export Service - Uses real backend API
import { toast } from "sonner";
import { API_BASE_URL, getAuthHeaders } from '@/config/environment';

export async function exportToPDF(params: { filename: string; columns: { key: string; header: string }[]; data: Record<string, unknown>[] }): Promise<void> {
  try {
    // Call backend PDF generation endpoint
    const response = await fetch(`${API_BASE_URL}/export/pdf`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('PDF generation failed');
    }

    // Download the PDF blob
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${params.filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success(`PDF "${params.filename}.pdf" has been generated`);
  } catch (error: any) {
    toast.error(error.message || 'Failed to generate PDF');
    throw error;
  }
}

export async function exportToExcel(params: { filename: string; columns: { key: string; header: string }[]; data: Record<string, unknown>[] }): Promise<void> {
  try {
    // Call the gate-pass export endpoint which generates Excel on the backend
    const queryParams = new URLSearchParams();
    queryParams.append('filename', params.filename);
    
    const response = await fetch(`${API_BASE_URL}/gate-pass/export/excel?${queryParams.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Excel generation failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${params.filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success(`Excel "${params.filename}.xlsx" has been generated`);
  } catch (error: any) {
    toast.error(error.message || 'Failed to generate Excel');
    throw error;
  }
}

export function printTable(title: string): void {
  // Print table using browser print
  window.print();
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