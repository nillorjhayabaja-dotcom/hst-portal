import { prisma } from '../../infrastructure/database/prisma.service';
import { fileStorageService } from '../../infrastructure/storage/file-storage.service';
import { auditService } from '../../infrastructure/audit/audit.service';

export interface GatePassPDFData {
  controlNumber: string;
  requester: {
    name: string;
    department: string;
    position?: string;
    employeeNumber?: string;
  };
  destination: string;
  purpose: string;
  transportation: string;
  transportationAssignedBy?: string;
  transportationAssignedAt?: string;
  isOfficialBusiness: boolean;
  isPersonal: boolean;
  withCar: boolean;
  withoutCar: boolean;
  plateNumber?: string;
  driverName?: string;
  remarks?: string;
  // Departure comes from Request Form (timeOut from security release)
  departureDate: string;
  departureTime: string;
  // Arrival is auto-generated when employee returns (timeIn)
  arrivalDate?: string;
  arrivalTime?: string;
  recommendedBy?: {
    name: string;
    signature?: string;
    date: string;
  };
  notedBy?: {
    name: string;
    signature?: string;
    date: string;
  };
  approvedBy?: {
    name: string;
    signature?: string;
    date: string;
  };
  qrCode?: string;
  status: string;
  // Security release fields
  releasedBy?: string;
  releasedByPosition?: string;
  releasedDate?: string;
  releasedTime?: string;
  verifiedBy?: string;
  verifiedByPosition?: string;
  verifiedDate?: string;
  completedBy?: string;
  completedByPosition?: string;
  completedDate?: string;
  vehiclePlate?: string;
  driverNameSecurity?: string;
  transportationTypeSecurity?: string;
  kmReadingStart?: number;
  kmReadingEnd?: number;
  timeOut?: string;
  timeIn?: string;
  securityRemarks?: string;
  returnRemarks?: string;
}

export class GatePassPDFService {
  /**
   * Generate Gate Pass PDF and save as attachment
   */
  async generateGatePassPDF(requestId: string): Promise<string> {
    const request = await (prisma.approvalRequest.findUnique as any)({
      where: { id: requestId },
      include: {
        requester: {
          include: {
            employees: {
              include: {
                department: true,
                position: true,
              },
            },
          },
        },
        gatePass: true,
        steps: {
          where: { status: 'approved' },
          orderBy: { stepOrder: 'asc' },
          include: {
            actor: {
              select: {
                displayName: true,
                signaturePath: true,
              },
            },
          },
        },
      },
    }) as any;

    if (!request || !request.gatePass) {
      throw new Error('Gate pass not found');
    }

    const gatePass = request.gatePass as any;
    const employee = request.requester?.employees;

    // Transportation data is saved directly to gatePass table
    const assignedTransportation =
      gatePass.transportation || 'Official Business';

    const assignedPlateNumber =
      gatePass.plateNumber;

    const assignedDriverName =
      gatePass.driverName;

    // Determine transportation type
    const isOfficialBusiness =
      assignedTransportation === 'official' ||
      assignedTransportation === 'Official Business';

    const isPersonal =
      assignedTransportation === 'personal' ||
      assignedTransportation === 'Personal Vehicle';

    const withCar =
      assignedTransportation === 'Company Vehicle' ||
      assignedTransportation === 'Personal Vehicle';

    const withoutCar = !withCar;

    // Departure comes from timeOut (filled by Security during release)
    // This was originally filled by the Requestor during Request Form
    const departureDate = gatePass.timeOut 
      ? new Date(gatePass.timeOut).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const departureTime = gatePass.timeOut
      ? new Date(gatePass.timeOut).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })
      : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Arrival is auto-generated when employee returns (timeIn)
    // NEVER manually entered - system generated only
    const arrivalDate = gatePass.timeIn
      ? new Date(gatePass.timeIn).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : undefined;
    
    const arrivalTime = gatePass.timeIn
      ? new Date(gatePass.timeIn).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : undefined;

    // Extract approval signatures
    const recommendedBy = this.extractApprovalSignature(request.steps, 'Recommend');
    const notedBy = this.extractApprovalSignature(request.steps, 'Note');
    const approvedBy = this.extractApprovalSignature(request.steps, 'Approve');

// Get security guard name for PDF - NEVER display UUID
    // Look up the security guard's full name and position
    let releasedByName = gatePass.releasedBy;
    let releasedByPosition = 'Security Guard';
    
    if (gatePass.securityReleasedBy) {
      const securityUser = await prisma.user.findUnique({
        where: { id: gatePass.securityReleasedBy },
        select: { 
          displayName: true,
          employees: {
            select: {
              firstName: true,
              lastName: true,
              position: { select: { title: true } },
            },
          },
        },
      });
      
      if (securityUser) {
        // Use employee full name from Employee record if available
        if (securityUser.employees?.firstName && securityUser.employees?.lastName) {
          releasedByName = `${securityUser.employees.firstName} ${securityUser.employees.lastName}`;
        } else {
          releasedByName = securityUser.displayName;
        }
        releasedByPosition = securityUser.employees?.position?.title || 'Security Guard';
      }
    }
    
    // Also get verifiedBy name
    let verifiedByName: string | undefined;
    let verifiedByPosition: string | undefined;
    if (gatePass.verifiedBy) {
      const verifiedUser = await prisma.user.findUnique({
        where: { id: gatePass.verifiedBy },
        select: { 
          displayName: true,
          employees: {
            select: {
              firstName: true,
              lastName: true,
              position: { select: { title: true } },
            },
          },
        },
      });
      if (verifiedUser) {
        if (verifiedUser.employees?.firstName && verifiedUser.employees?.lastName) {
          verifiedByName = `${verifiedUser.employees.firstName} ${verifiedUser.employees.lastName}`;
        } else {
          verifiedByName = verifiedUser.displayName;
        }
        verifiedByPosition = verifiedUser.employees?.position?.title || 'Security Guard';
      }
    }
    
    // Get completedBy name
    let completedByName: string | undefined;
    let completedByPosition: string | undefined;
    if (gatePass.returnedBy && gatePass.securityReleasedBy) {
      // If returnedBy is a display name, use it; if it's a UUID, look it up
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gatePass.returnedBy);
      if (!isUuid) {
        completedByName = gatePass.returnedBy;
      } else {
        const completedUser = await prisma.user.findUnique({
          where: { id: gatePass.returnedBy },
          select: { 
            displayName: true,
            employees: {
              select: {
                firstName: true,
                lastName: true,
                position: { select: { title: true } },
              },
            },
          },
        });
        if (completedUser) {
          if (completedUser.employees?.firstName && completedUser.employees?.lastName) {
            completedByName = `${completedUser.employees.firstName} ${completedUser.employees.lastName}`;
          } else {
            completedByName = completedUser.displayName;
          }
          completedByPosition = completedUser.employees?.position?.title || 'Security Guard';
        }
      }
    }

    // Build QR code data
    const qrCodeData = gatePass.qrCode || null;

    const pdfData: GatePassPDFData = {
      controlNumber: request.controlNumber,
      requester: {
        name: `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim() || request.requester.displayName,
        department: employee?.department?.name || 'N/A',
        position: employee?.position?.title,
        employeeNumber: employee?.employeeNumber || undefined,
      },
      destination: gatePass.destination || 'N/A',
      purpose: gatePass.purpose,
      transportation: assignedTransportation,
      isOfficialBusiness,
      isPersonal,
      withCar,
      withoutCar,
      plateNumber: assignedPlateNumber || undefined,
      driverName: assignedDriverName || undefined,
      remarks: request.description || undefined,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      recommendedBy,
      notedBy,
      approvedBy,
      qrCode: qrCodeData || undefined,
      status: request.status.toUpperCase(),
      // Security release fields
      releasedBy: releasedByName || undefined,
      releasedByPosition: releasedByPosition || undefined,
      releasedDate: gatePass.releasedDate || undefined,
      releasedTime: gatePass.releasedTime || undefined,
      verifiedBy: verifiedByName || undefined,
      verifiedByPosition: verifiedByPosition || undefined,
      completedBy: completedByName || undefined,
      completedByPosition: completedByPosition || undefined,
      vehiclePlate: gatePass.vehiclePlate || undefined,
      driverNameSecurity: gatePass.driverNameSecurity || undefined,
      transportationTypeSecurity: gatePass.transportationTypeSecurity || undefined,
      kmReadingStart: gatePass.kmReadingStart || undefined,
      kmReadingEnd: gatePass.kmReadingEnd || undefined,
      timeOut: gatePass.timeOut ? new Date(gatePass.timeOut).toLocaleString() : undefined,
      timeIn: gatePass.timeIn ? new Date(gatePass.timeIn).toLocaleString() : undefined,
      securityRemarks: gatePass.securityRemarks || undefined,
      returnRemarks: gatePass.returnRemarks || undefined,
    };

    // Generate HTML
    const html = this.generateHTML(pdfData);

    // Convert HTML to PDF using a simple approach (browser print or puppeteer)
    // For now, we'll save as HTML and convert later
    const fileName = `gatepass_${request.controlNumber.replace(/\//g, '_')}.html`;
    const buffer = Buffer.from(html, 'utf-8');

    // Upload to storage - convert buffer to readable stream
    const { Readable } = require('stream');
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);

    const uploadedFile = await fileStorageService.upload(
      {
        originalname: fileName,
        mimetype: 'text/html',
        size: buffer.length,
        stream: bufferStream,
      },
      'gate-passes',
      request.requesterId,
      request.requesterId
    );

    // Create attachment record
    await prisma.attachment.create({
      data: {
        entityType: 'gate_pass',
        entityId: gatePass.id,
        fileName: fileName.replace('.html', '.pdf'),
        fileSize: buffer.length,
        mimeType: 'application/pdf',
        storagePath: uploadedFile.storagePath,
        storageType: 'local',
        uploadedBy: request.requesterId,
      },
    });

    // Audit log
    await auditService.record('generate_pdf', 'gate_pass', {
      actorId: request.requesterId,
      entityId: gatePass.id,
      metadata: {
        controlNumber: request.controlNumber,
        fileName: fileName,
        storagePath: uploadedFile.storagePath,
      },
    });

    return uploadedFile.storagePath;
  }

  /**
   * Extract approval signature from steps
   */
  private extractApprovalSignature(
    steps: any[],
    stepType: string
  ): { name: string; signature?: string; date: string } | undefined {
    const step = steps.find((s) => s.name.toLowerCase().includes(stepType.toLowerCase()));
    if (!step || !step.actor) {
      return undefined;
    }

    return {
      name: step.actor.displayName || '___________________________',
      signature: step.actor.signaturePath,
      date: step.actedAt 
        ? new Date(step.actedAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : '',
    };
  }

  /**
   * Generate HTML for the gate pass that matches HST paper form - A4 portrait
   */
  private generateHTML(data: GatePassPDFData): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Gate Pass - ${data.controlNumber}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 15mm;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    color: #000;
    background: white;
    width: 210mm;
    min-height: 297mm;
    padding: 20px;
  }
  .gate-pass {
    width: 100%;
    border: 2px solid #000;
    padding: 20px;
  }
  .header {
    text-align: center;
    border-bottom: 2px solid #000;
    padding-bottom: 10px;
    margin-bottom: 15px;
  }
  .header h1 {
    font-size: 16pt;
    font-weight: bold;
    letter-spacing: 1px;
    margin-bottom: 2px;
  }
  .header h2 {
    font-size: 13pt;
    font-weight: bold;
    margin-bottom: 5px;
  }
  .control-number {
    text-align: right;
    font-size: 11pt;
    margin-top: 5px;
  }
  .control-number span {
    font-weight: bold;
    color: #c00;
    font-size: 13pt;
    border-bottom: 1px solid #c00;
  }
  .section { margin-bottom: 12px; }
  .row {
    display: flex;
    margin-bottom: 6px;
    align-items: baseline;
    min-height: 24px;
  }
  .label {
    font-weight: bold;
    min-width: 100px;
    font-size: 11pt;
  }
  .value {
    flex: 1;
    border-bottom: 1px solid #000;
    padding: 2px 4px;
    min-height: 22px;
    font-size: 11pt;
  }
  .checkbox-row {
    display: flex;
    gap: 15px;
    margin: 8px 0;
    align-items: center;
  }
  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11pt;
  }
  .checkbox-box {
    width: 16px; height: 16px;
    border: 2px solid #000;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }
  .signatures {
    display: flex;
    justify-content: space-between;
    margin-top: 25px;
    gap: 15px;
  }
  .sig-box {
    flex: 1;
    text-align: center;
    min-height: 140px;
  }
  .sig-title {
    font-weight: bold;
    font-size: 11pt;
    margin-bottom: 2px;
  }
  .sig-sub {
    font-size: 9pt;
    font-style: italic;
    margin-bottom: 30px;
    color: #444;
  }
  .sig-image {
    max-width: 120px;
    max-height: 60px;
    margin: 0 auto 8px;
    display: block;
  }
  .sig-line {
    border-top: 1px solid #000;
    padding-top: 4px;
    margin-top: 35px;
  }
  .sig-name { font-weight: bold; font-size: 10pt; }
  .sig-date { font-size: 9pt; color: #444; }
  .footer {
    margin-top: 20px;
    padding-top: 10px;
    border-top: 2px solid #000;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .qr-code img {
    width: 90px;
    height: 90px;
  }
  .status-badge {
    display: inline-block;
    padding: 3px 12px;
    background: #4caf50;
    color: white;
    font-weight: bold;
    font-size: 10pt;
    border: 1px solid #388e3c;
  }
  .status-badge.pending { background: #ff9800; border-color: #f57c00; }
  .status-badge.rejected { background: #f44336; border-color: #d32f2f; }
  .status-badge.released { background: #2196f3; border-color: #1976d2; }
</style>
</head>
<body>
<div class="gate-pass">
  <div class="header">
    <h1>HS TECHNOLOGIES (PHILS.), INC.</h1>
    <h2>GATE PASS / OFFICIAL BUSINESS ALLOWANCE / REQUEST FOR CAR</h2>
    <div class="control-number">
      Control No.: <span>${data.controlNumber}</span>
    </div>
  </div>

  <div class="section">
    <div class="row">
      <div class="label">Employee:</div>
      <div class="value">${data.requester.name}</div>
      <div class="label" style="min-width:90px;margin-left:10px;">Department:</div>
      <div class="value">${data.requester.department}</div>
    </div>
<div class="row">
      <div class="label">Date:</div>
      <div class="value" style="flex:0.5;">${data.departureDate}</div>
      <div class="label" style="min-width:70px;margin-left:10px;">Time Out:</div>
      <div class="value" style="flex:0.4;">${data.departureTime}</div>
      <div class="label" style="min-width:60px;margin-left:10px;">Arrival:</div>
      <div class="value" style="flex:0.4;">${data.arrivalTime || 'Pending'}</div>
    </div>
  </div>

  <div class="section">
    <div class="row">
      <div class="label">Destination:</div>
      <div class="value">${data.destination}</div>
    </div>
    <div class="row">
      <div class="label">Purpose:</div>
      <div class="value">${data.purpose}</div>
    </div>
  </div>

  <div class="section">
    <div class="checkbox-row">
      <div class="checkbox-item">
        <span class="checkbox-box">${data.isOfficialBusiness ? '✓' : ''}</span>
        <span>OFFICIAL BUSINESS</span>
      </div>
      <div class="checkbox-item">
        <span class="checkbox-box">${data.isPersonal ? '✓' : ''}</span>
        <span>PERSONAL</span>
      </div>
      <div class="checkbox-item">
        <span class="checkbox-box">${data.withCar ? '✓' : ''}</span>
        <span>WITH CAR</span>
      </div>
      <div class="checkbox-item">
        <span class="checkbox-box">${data.withoutCar ? '✓' : ''}</span>
        <span>WITHOUT CAR</span>
      </div>
    </div>
    <div class="row">
      <div class="label">Vehicle:</div>
      <div class="value" style="flex:0.8;">${data.plateNumber || ''}</div>
      <div class="label" style="min-width:70px;margin-left:10px;">Driver:</div>
      <div class="value" style="flex:0.8;">${data.driverName || ''}</div>
    </div>
    <div class="row">
      <div class="label">Transportation:</div>
      <div class="value" style="flex:0.8;">${data.transportation}</div>
    </div>
    <div class="row">
      <div class="label">Remarks:</div>
      <div class="value">${data.remarks || ''}</div>
    </div>
  </div>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-title">RECOMMENDED BY:</div>
      <div class="sig-sub">(Supervisor)</div>
      ${data.recommendedBy?.signature
        ? `<img src="${data.recommendedBy.signature}" class="sig-image" alt="Signature" />`
        : '<div style="height:60px;"></div>'
      }
      <div class="sig-line">
        <div class="sig-name">${data.recommendedBy?.name || '___________________________'}</div>
        <div class="sig-date">${data.recommendedBy?.date || ''}</div>
      </div>
    </div>

    <div class="sig-box">
      <div class="sig-title">NOTED BY:</div>
      <div class="sig-sub">(Car Assignee)</div>
      ${data.notedBy?.signature
        ? `<img src="${data.notedBy.signature}" class="sig-image" alt="Signature" />`
        : '<div style="height:60px;"></div>'
      }
      <div class="sig-line">
        <div class="sig-name">${data.notedBy?.name || '___________________________'}</div>
        <div class="sig-date">${data.notedBy?.date || ''}</div>
      </div>
    </div>

    <div class="sig-box">
      <div class="sig-title">APPROVED BY:</div>
      <div class="sig-sub">(General Administration)</div>
      ${data.approvedBy?.signature
        ? `<img src="${data.approvedBy.signature}" class="sig-image" alt="Signature" />`
        : '<div style="height:60px;"></div>'
      }
      <div class="sig-line">
        <div class="sig-name">${data.approvedBy?.name || '___________________________'}</div>
        <div class="sig-date">${data.approvedBy?.date || ''}</div>
      </div>
    </div>
  </div>

  ${data.releasedBy ? `
  <div style="margin-top:20px;padding-top:15px;border-top:2px solid #000;">
    <div style="font-weight:bold;font-size:12pt;margin-bottom:10px;text-align:center;">SECURITY RELEASE INFORMATION</div>
    <div class="row">
      <div class="label">Released By:</div>
      <div class="value">${data.releasedBy}</div>
      <div class="label" style="min-width:90px;margin-left:10px;">Released Date:</div>
      <div class="value">${data.releasedDate || ''}</div>
      <div class="label" style="min-width:80px;margin-left:10px;">Released Time:</div>
      <div class="value">${data.releasedTime || ''}</div>
    </div>
    <div class="row">
      <div class="label">Vehicle Plate:</div>
      <div class="value" style="flex:0.6;">${data.vehiclePlate || ''}</div>
      <div class="label" style="min-width:100px;margin-left:10px;">Transportation:</div>
      <div class="value" style="flex:0.6;">${data.transportationTypeSecurity || ''}</div>
    </div>
    <div class="row">
      <div class="label">Driver:</div>
      <div class="value" style="flex:0.6;">${data.driverNameSecurity || ''}</div>
      <div class="label" style="min-width:100px;margin-left:10px;">KM Reading Start:</div>
      <div class="value" style="flex:0.4;">${data.kmReadingStart !== undefined ? data.kmReadingStart : ''}</div>
      <div class="label" style="min-width:100px;margin-left:10px;">KM Reading End:</div>
      <div class="value" style="flex:0.4;">${data.kmReadingEnd !== undefined ? data.kmReadingEnd : ''}</div>
    </div>
    <div class="row">
      <div class="label">Time Out:</div>
      <div class="value" style="flex:0.6;">${data.timeOut || ''}</div>
      <div class="label" style="min-width:80px;margin-left:10px;">Time In:</div>
      <div class="value" style="flex:0.6;">${data.timeIn || ''}</div>
    </div>
    ${data.securityRemarks ? `
    <div class="row">
      <div class="label">Security Remarks:</div>
      <div class="value">${data.securityRemarks}</div>
    </div>
    ` : ''}
    ${data.returnRemarks ? `
    <div class="row">
      <div class="label">Return Remarks:</div>
      <div class="value">${data.returnRemarks}</div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <div class="footer">
    <div>
      <strong>Status:</strong>
      <span class="status-badge ${data.status.toLowerCase()}">${data.status.toUpperCase()}</span>
    </div>
    ${data.qrCode ? `
      <div class="qr-code" style="text-align:center;">
        <img src="data:image/png;base64,${data.qrCode}" alt="QR Code" />
        <div style="font-size:8pt;margin-top:2px;">Scan to verify</div>
      </div>
    ` : ''}
  </div>
</div>
</body>
</html>`;
  }
}