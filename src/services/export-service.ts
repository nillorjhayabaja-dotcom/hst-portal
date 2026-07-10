// Enterprise Export Service - Mock implementations for Excel, PDF, and Print
import { toast } from "sonner";

interface ExportData {
  filename: string;
  columns: { key: string; header: string }[];
  data: Record<string, unknown>[];
}

export function exportToExcel(config: ExportData) {
  const { filename, columns, data } = config;
  // Mock Excel export - in production this would use a library like xlsx
  const csvContent = [
    columns.map((c) => `"${c.header}"`).join(","),
    ...data.map((row) => columns.map((c) => `"${String(row[c.key] ?? "")}"`).join(",")),
  ].join("\n");

  downloadFile(csvContent, `${filename}.csv`, "text/csv;charset=utf-8;");
  toast.success(`Exported "${filename}.csv"`);
}

export function exportToPDF(config: ExportData) {
  const { filename } = config;
  // Mock PDF export - in production this would use jsPDF or similar
  toast.success(`PDF "${filename}.pdf" has been generated (mock)`);
}

export function printTable(title: string) {
  // Trigger browser print dialog
  window.print();
  toast.success(`Printing "${title}"`);
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
