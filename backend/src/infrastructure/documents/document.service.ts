import { PrismaClient } from '@prisma/client';
import { GatePassTemplateDataBuilder } from './templates/gate-pass/helpers/template-data';
import { DocumentTemplateService } from './document-template.service';
import { PdfService } from './pdf.service';
import { PrintService } from './print.service';
import { RenderedDocument } from './document-template.service';
import { auditService } from '../audit/audit.service';
import { prisma } from '../database/prisma.service';

export interface DocumentGenerationOptions {
  generatePdf?: boolean;
  generatePreview?: boolean;
  pdfOptions?: any;
}

export interface DocumentResult {
  html?: string;
  pdf?: {
    filePath: string;
    fileName: string;
    fileSize: number;
  };
  controlNumber: string;
  requestId: string;
  generatedAt: Date;
}

export class DocumentService {
  private templateDataBuilder: GatePassTemplateDataBuilder;
  private templateService: DocumentTemplateService;
  private pdfService: PdfService;
  private printService: PrintService;

  constructor(private prisma: PrismaClient) {
    this.templateDataBuilder = new GatePassTemplateDataBuilder(prisma);
    this.templateService = new DocumentTemplateService();
    this.pdfService = new PdfService();
    this.printService = new PrintService();
  }

  async generateGatePassDocument(
    requestId: string,
    options: DocumentGenerationOptions = {}
  ): Promise<DocumentResult> {
    // Build template data from database
    const templateData = await this.templateDataBuilder.build(requestId);

    // Render HTML
    const rendered = await this.templateService.renderGatePass(templateData);

    const result: DocumentResult = {
      html: rendered.html,
      controlNumber: rendered.controlNumber,
      requestId,
      generatedAt: rendered.generatedAt,
    };

    // Generate PDF if requested
    if (options.generatePdf) {
      const pdfResult = await this.pdfService.generatePdf(rendered, options.pdfOptions);
      result.pdf = {
        filePath: pdfResult.filePath,
        fileName: pdfResult.fileName,
        fileSize: pdfResult.fileSize,
      };

      // Update gate pass with PDF path and increment version
      await this.prisma.gatePass.update({
        where: { requestId },
        data: {
          printCount: { increment: 1 },
        },
      });

      // Audit log
      await auditService.record('generate_pdf', 'gate_pass', {
        entityId: requestId,
        metadata: {
          controlNumber: rendered.controlNumber,
          pdfPath: pdfResult.filePath,
          fileSize: pdfResult.fileSize,
        },
      });
    }

    // Audit log for preview generation
    if (options.generatePreview) {
      await auditService.record('preview', 'gate_pass', {
        entityId: requestId,
        metadata: {
          controlNumber: rendered.controlNumber,
        },
      });
    }

    return result;
  }

  async getGatePassPreview(requestId: string): Promise<string> {
    const result = await this.generateGatePassDocument(requestId, {
      generatePreview: true,
    });

    if (!result.html) {
      throw new Error('Failed to generate preview HTML');
    }

    // Return standalone HTML for iframe display
    return this.printService.generatePrintHtml(
      { html: result.html, controlNumber: result.controlNumber, generatedAt: result.generatedAt },
      process.env.FRONTEND_URL || 'http://localhost:3000'
    );
  }

  async getGatePassPrintHtml(requestId: string): Promise<string> {
    const result = await this.generateGatePassDocument(requestId, {
      generatePreview: true,
    });

    if (!result.html) {
      throw new Error('Failed to generate print HTML');
    }

    return this.printService.generatePrintHtml(
      { html: result.html, controlNumber: result.controlNumber, generatedAt: result.generatedAt },
      process.env.FRONTEND_URL || 'http://localhost:3000'
    );
  }

  async regenerateGatePassPdf(requestId: string): Promise<DocumentResult> {
    // Delete old PDF if exists
    const existingGatePass = await this.prisma.gatePass.findUnique({
      where: { requestId },
    });

    if (existingGatePass?.qrCode) {
      // Old PDF path logic would go here if we stored it
      // For now, we just generate a new one
    }

    // Generate new PDF
    return this.generateGatePassDocument(requestId, {
      generatePdf: true,
      pdfOptions: {},
    });
  }

  async close() {
    await this.pdfService.close();
  }
}

// Singleton instance
export const documentService = new DocumentService(prisma);