# Enterprise Document Engine

## Overview

The Enterprise Document Engine is a reusable document generation framework for the HST Enterprise Portal. It provides a unified HTML-to-PDF architecture that serves as the single source of truth for all document rendering needs.

## Architecture

```
Database (PostgreSQL)
    ↓
Prisma ORM
    ↓
Template Data Builder
    ↓
HTML Template (Handlebars)
    ↓
Browser Preview / Print / PDF Generation
    ↓
Attachment Storage
```

## Core Principles

1. **Single Source of Truth**: One HTML template per document type
2. **No Duplication**: All outputs (preview, print, PDF) use the same template
3. **Separation of Concerns**: Data building, templating, and rendering are separate
4. **Reusability**: Architecture supports multiple document types
5. **Maintainability**: Easy to update layouts without touching business logic

## Directory Structure

```
documents/
├── document.service.ts           # Main orchestrator
├── document-template.service.ts  # Handlebars template engine
├── pdf.service.ts                # Puppeteer PDF generation
├── print.service.ts              # Browser print optimization
├── index.ts                      # Module exports
├── templates/
│   ├── gate-pass/
│   │   ├── template.html         # Master layout
│   │   ├── template.css          # Print-optimized styles
│   │   ├── helpers/
│   │   │   └── template-data.ts  # Data builder
│   │   ├── partials/             # Reusable components
│   │   │   ├── header.html
│   │   │   ├── footer.html
│   │   │   ├── signature.html
│   │   │   └── helpers/
│   │   └── ...
│   ├── leave-form/
│   ├── purchase-request/
│   └── ...
└── README.md
```

## Components

### 1. Template Data Builder (`template-data.ts`)

Responsible for:
- Fetching data from PostgreSQL via Prisma
- Transforming database records into template-friendly format
- Handling relationships (user, department, approvals, etc.)
- Formatting dates, times, and other display values

**Key Interface:**
```typescript
export interface GatePassTemplateData {
  companyName: string;
  controlNumber: string;
  requesterName: string;
  // ... all document fields
  signatures: SignatureData[];
  qrCodeDataUrl: string;
}
```

### 2. Document Template Service (`document-template.service.ts`)

Responsible for:
- Loading Handlebars templates
- Caching compiled templates
- Rendering HTML from data
- Registering Handlebars helpers

**Key Method:**
```typescript
async renderGatePass(data: GatePassTemplateData): Promise<RenderedDocument>
```

### 3. PDF Service (`pdf.service.ts`)

Responsible for:
- Launching Puppeteer browser instance
- Rendering HTML to PDF
- Managing file storage structure
- PDF generation options (format, margins, etc.)

**Key Method:**
```typescript
async generatePdf(document: RenderedDocument): Promise<PdfResult>
```

**Storage Structure:**
```
uploads/
├── gate-pass/
│   ├── 2026/
│   │   ├── 01/
│   │   │   └── GP-2026-00001.pdf
│   │   ├── 02/
│   │   └── ...
│   └── 2027/
└── ...
```

### 4. Print Service (`print.service.ts`)

Responsible for:
- Creating print-optimized HTML
- Auto-triggering print dialog
- Isolating document from portal UI

**Key Method:**
```typescript
async generatePrintHtml(document: RenderedDocument): Promise<string>
```

### 5. Document Service (`document.service.ts`)

Main orchestrator that:
- Coordinates all other services
- Manages document generation workflow
- Handles audit logging
- Provides high-level API

**Key Methods:**
```typescript
async generateGatePassDocument(requestId: string): Promise<DocumentResult>
async getGatePassPreview(requestId: string): Promise<string>
async regenerateGatePassPdf(requestId: string): Promise<DocumentResult>
```

## Template Engine

### Handlebars Helpers

Pre-registered helpers:
- `{{#if condition}}` - Conditional rendering
- `{{#each array}}` - Iteration
- `{{eq a b}}` - Equality check
- `{{ne a b}}` - Inequality check
- `{{and a b}}` - Logical AND
- `{{or a b}}` - Logical OR
- `{{not a}}` - Logical NOT

### Partial Templates

Reusable components:
- `header.html` - Company logo and info
- `footer.html` - Document metadata
- `signature.html` - Electronic signature block
- `approval-block.html` - Approval workflow section

## API Endpoints

### Document Controller Routes

```
GET    /api/v1/gate-pass/:requestId/preview          # Browser preview (HTML)
GET    /api/v1/gate-pass/:requestId/print            # Print-optimized HTML
POST   /api/v1/gate-pass/:requestId/generate-pdf     # Generate PDF
GET    /api/v1/gate-pass/:requestId/download-pdf     # Download PDF
POST   /api/v1/gate-pass/:requestId/regenerate-pdf   # Regenerate (Super Admin)
```

## Frontend Integration

### DocumentViewer Component

Location: `src/components/enterprise/DocumentViewer.tsx`

Features:
- Live preview in iframe
- Print button (opens print dialog)
- Download PDF button
- Regenerate button (Super Admin only)
- WYSIWYG display

### Usage in Drawer

```typescript
{
  id: "documents",
  label: "Official Documents",
  badge: 1,
  content: (
    <DocumentViewer 
      gatePass={gatePass} 
      workflowStatus={workflowStatus}
      isSuperAdmin={isSuperAdmin()}
      onRefresh={onRefresh}
    />
  ),
}
```

## Styling

### CSS Architecture

- **A4 Portrait**: Standard paper size
- **Print-First**: Styles optimized for printing
- **No Inline CSS**: All styles in external CSS file
- **Professional Typography**: Times New Roman, proper spacing
- **Page Breaks**: Controlled page break support

### Key CSS Features

```css
@page {
  size: A4 portrait;
  margin: 15mm 15mm 15mm 15mm;
}

.page {
  width: 210mm;
  min-height: 297mm;
  padding: 15mm;
}

@media print {
  .no-print { display: none !important; }
}
```

## Electronic Signatures

### Display Logic

```handlebars
{{#if signatures.[0].signatureImage}}
  <img src="{{signatures.[0].signatureImage}}" class="signature-image">
{{else}}
  <div class="electronic-approval">
    <span>Electronically Approved</span>
  </div>
{{/if}}
<div class="signature-name">{{signatures.[0].name}}</div>
<div class="signature-position">{{signatures.[0].position}}</div>
<div class="signature-date">{{signatures.[0].timestamp}}</div>
```

## QR Code Integration

### Generation

QR codes are generated server-side and stored as base64 in the database:

```typescript
const qrData = {
  controlNumber: gatePass.request.controlNumber,
  requestId,
  purpose: gatePass.purpose,
  destination: gatePass.destination,
  expectedReturn: gatePass.expectedReturn,
  timestamp: new Date().toISOString(),
};

const qrCode = Buffer.from(JSON.stringify(qrData)).toString('base64');
```

### Embedding in Template

```handlebars
{{#if qrCodeDataUrl}}
<div class="qr-section">
  <img src="{{qrCodeDataUrl}}" alt="QR Code" class="qr-code">
</div>
{{/if}}
```

## Audit Logging

All document actions are logged:

```typescript
await auditService.record('generate_pdf', 'gate_pass', {
  entityId: requestId,
  metadata: {
    controlNumber: rendered.controlNumber,
    pdfPath: pdfResult.filePath,
    fileSize: pdfResult.fileSize,
  },
});
```

Logged actions:
- `preview` - Document preview generated
- `generate_pdf` - PDF created
- `regenerate_pdf` - PDF regenerated (Super Admin)

## Document Versioning

Documents support versioning through:
- `printCount` - Number of times printed
- `generatedAt` - Timestamp of generation
- `documentVersion` - Semantic version

Future enhancement: Store PDF paths and versions in database for archival.

## Future Document Types

The architecture supports adding new document types without modifying the core engine:

### Steps to Add New Document Type

1. **Create Template Data Builder**
   ```
   templates/
   └── leave-form/
       └── helpers/
           └── template-data.ts
   ```

2. **Create HTML Template**
   ```
   templates/
   └── leave-form/
       ├── template.html
       └── template.css
   ```

3. **Add Rendering Method**
   ```typescript
   // In document-template.service.ts
   async renderLeaveForm(data: LeaveFormTemplateData): Promise<RenderedDocument>
   ```

4. **Add Service Method**
   ```typescript
   // In document.service.ts
   async generateLeaveFormDocument(requestId: string): Promise<DocumentResult>
   ```

5. **Add API Endpoints**
   ```typescript
   // In document.controller.ts
   async getLeaveFormPreview(req: Request, res: Response)
   ```

## Supported Future Documents

- Leave Form
- Purchase Request
- Material Requisition Form (MRF)
- Visitor Pass
- Vehicle Gate Pass
- Asset Borrow Slip
- Official Memorandum
- Incident Report
- Employee Clearance
- Certificate of Employment

## Dependencies

### Backend

```json
{
  "handlebars": "^4.9.0",      // Template engine
  "puppeteer": "^25.3.0",      // PDF generation
  "qrcode": "^1.5.4"           // QR code generation
}
```

### Frontend

```json
{
  "react": "^19.0.0",           // UI framework
  "lucide-react": "^0.400.0",   // Icons
  "sonner": "^1.0.0"            // Toast notifications
}
```

## Configuration

### Environment Variables

```env
FRONTEND_URL=http://localhost:3000
UPLOADS_DIR=./uploads
```

### Puppeteer Options

```typescript
{
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ]
}
```

## Performance Considerations

1. **Template Caching**: Compiled templates are cached in memory
2. **Browser Instance**: Single Puppeteer instance reused
3. **Lazy Loading**: Preview loaded on-demand
4. **Async Operations**: All I/O operations are async
5. **File Storage**: Organized by year/month for easy archival

## Security

1. **Authentication**: All endpoints require authentication
2. **Authorization**: Super Admin only for regeneration
3. **X-Frame-Options**: SAMEORIGIN for iframe embedding
4. **Input Validation**: Request ID validation on all endpoints
5. **Audit Logging**: All actions logged with user context

## Troubleshooting

### Puppeteer Issues

If Puppeteer fails to launch:
```bash
# Install dependencies (Linux)
sudo apt-get install -y \
  gconf-service \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgconf-2-4 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils
```

### Template Not Found

Ensure template paths are correct:
```typescript
const fullPath = path.join(this.templatesDir, templatePath);
```

### Permission Errors

Check upload directory permissions:
```bash
chmod 755 uploads/
chmod 755 uploads/gate-pass/
```

## Success Criteria

✅ Single HTML template per document type
✅ Browser Preview, Print, and PDF use same source
✅ Document matches official HST paper form
✅ PDF generated using Puppeteer
✅ Preview displayed in iframe
✅ Print produces same layout as PDF
✅ Architecture reusable for future documents
✅ Audit logging for all actions
✅ Electronic signatures supported
✅ QR code embedded in document

## Maintenance

### Updating Templates

1. Edit `template.html` and `template.css`
2. Clear template cache (automatic on restart)
3. Test preview in browser
4. Generate PDF to verify output

### Adding New Fields

1. Update `GatePassTemplateData` interface
2. Update `build()` method in template-data.ts
3. Add field to template.html
4. Style in template.css

## Contact

For questions or issues, contact the HST Enterprise Portal development team.