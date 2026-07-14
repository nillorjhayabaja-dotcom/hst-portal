import { RenderedDocument } from './document-template.service';

export interface PrintOptions {
  title?: string;
  silent?: boolean;
  showPrintDialog?: boolean;
}

export class PrintService {
  async generatePrintHtml(document: RenderedDocument, baseUrl?: string): Promise<string> {
    // Create a standalone HTML document optimized for printing
    const printHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.controlNumber} - Gate Pass</title>
  <style>
    /* Inline critical print styles */
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.3;
      color: #000;
      background: #fff;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      margin: 0 auto;
      background: #fff;
      position: relative;
    }
    
    /* Add all other styles from template.css here */
    /* For brevity, we'll link to the external CSS in production */
  </style>
  <link rel="stylesheet" href="${baseUrl || ''}/templates/gate-pass/template.css">
</head>
<body>
  <div class="page">
    ${document.html}
  </div>
  
  <script>
    // Auto-trigger print dialog when page loads
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;

    return printHtml;
  }

  async printDocument(document: RenderedDocument, baseUrl?: string): Promise<string> {
    return this.generatePrintHtml(document, baseUrl);
  }
}