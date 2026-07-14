import { Request, Response } from 'express';
import { documentService } from '../../../infrastructure/documents/document.service';
import { NotFoundError, ValidationError } from '../../../shared/errors';

class DocumentController {
  async getPreview(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      
      if (!requestId) {
        throw new ValidationError('Request ID is required');
      }

      const previewHtml = await documentService.getGatePassPreview(requestId);
      
      // Set headers for iframe display
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.send(previewHtml);
    } catch (error) {
      console.error('Error generating preview:', error);
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to generate preview' });
    }
  }

  async getPrintHtml(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      
      if (!requestId) {
        throw new ValidationError('Request ID is required');
      }

      const printHtml = await documentService.getGatePassPrintHtml(requestId);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(printHtml);
    } catch (error) {
      console.error('Error generating print HTML:', error);
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to generate print HTML' });
    }
  }

  async generatePdf(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      
      if (!requestId) {
        throw new ValidationError('Request ID is required');
      }

      const result = await documentService.generateGatePassDocument(requestId, {
        generatePdf: true,
      });

      if (!result.pdf) {
        throw new Error('PDF generation failed');
      }

      // Return PDF file info
      res.json({
        success: true,
        data: {
          filePath: result.pdf.filePath,
          fileName: result.pdf.fileName,
          fileSize: result.pdf.fileSize,
          controlNumber: result.controlNumber,
          generatedAt: result.generatedAt,
        },
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }

  async downloadPdf(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      
      if (!requestId) {
        throw new ValidationError('Request ID is required');
      }

      const result = await documentService.generateGatePassDocument(requestId, {
        generatePdf: true,
      });

      if (!result.pdf) {
        throw new Error('PDF generation failed');
      }

      // Send the PDF file
      res.download(result.pdf.filePath, result.pdf.fileName);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to download PDF' });
    }
  }

  async regeneratePdf(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      
      if (!requestId) {
        throw new ValidationError('Request ID is required');
      }

      const result = await documentService.regenerateGatePassPdf(requestId);

      res.json({
        success: true,
        data: {
          controlNumber: result.controlNumber,
          requestId: result.requestId,
          generatedAt: result.generatedAt,
          pdf: result.pdf,
        },
      });
    } catch (error) {
      console.error('Error regenerating PDF:', error);
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to regenerate PDF' });
    }
  }
}

const documentController = new DocumentController();

export { documentController };