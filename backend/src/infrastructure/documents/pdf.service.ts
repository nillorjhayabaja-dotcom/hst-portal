import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { RenderedDocument } from './document-template.service';

export interface PdfGenerationOptions {
  format?: 'a4' | 'letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
  landscape?: boolean;
}

export interface PdfResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  controlNumber: string;
  generatedAt: Date;
}

export class PdfService {
  private browser: any = null;
  private uploadsDir: string;

  constructor(uploadsDir?: string) {
    this.uploadsDir = uploadsDir || path.join(process.cwd(), 'uploads');
  }

  private async getBrowser(): Promise<any> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  async generatePdf(
    document: RenderedDocument,
    options: PdfGenerationOptions = {}
  ): Promise<PdfResult> {
    const {
      format = 'a4',
      margin = { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground = true,
      landscape = false,
    } = options;

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Set content
      await page.setContent(document.html, {
        waitUntil: 'networkidle0',
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format,
        margin,
        printBackground,
        landscape,
      });

      // Create directory structure: uploads/gate-pass/YYYY/MM/
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const fileName = `${document.controlNumber}.pdf`;
      const relativePath = path.join('gate-pass', year, month, fileName);
      const fullPath = path.join(this.uploadsDir, relativePath);

      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Write PDF file
      await fs.writeFile(fullPath, pdfBuffer);

      const fileStats = await fs.stat(fullPath);

      return {
        filePath: fullPath,
        fileName,
        fileSize: fileStats.size,
        controlNumber: document.controlNumber,
        generatedAt: new Date(),
      };
    } finally {
      await page.close();
    }
  }

  async generatePdfFromHtml(
    html: string,
    controlNumber: string,
    options: PdfGenerationOptions = {}
  ): Promise<PdfResult> {
    const document: RenderedDocument = {
      html,
      controlNumber,
      generatedAt: new Date(),
    };

    return this.generatePdf(document, options);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}