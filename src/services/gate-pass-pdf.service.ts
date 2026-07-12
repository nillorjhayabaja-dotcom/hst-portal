// Gate Pass PDF Generation Service - HST Official Form
export interface GatePassPDFData {
  controlNumber: string;
  requester: {
    name: string;
    department: string;
    position?: string;
  };
  destination: string;
  purpose: string;
  transportation: string;
  isOfficialBusiness: boolean;
  isPersonal: boolean;
  withCar: boolean;
  withoutCar: boolean;
  plateNumber?: string;
  driverName?: string;
  remarks?: string;
  dateFrom: string;
  dateTo: string;
  timeFrom: string;
  timeTo: string;
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
}

export function generateGatePassPDF(data: GatePassPDFData): string {
  // Generate HTML for the gate pass that matches HST paper form - A4 portrait
  const html = `<!DOCTYPE html>
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
  .no-print { text-align: center; margin-bottom: 15px; }
  .no-print button {
    padding: 8px 20px;
    font-size: 12pt;
    cursor: pointer;
    background: #1a73e8;
    color: #fff;
    border: none;
    border-radius: 4px;
  }
  @media print {
    body { padding: 0; }
    .gate-pass { border: 2px solid #000; box-shadow: none; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="no-print">
  <button onclick="window.print()">🖨 Print Gate Pass</button>
  <button onclick="window.close()" style="margin-left:8px;background:#666;">✕ Close</button>
</div>

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
      <div class="value" style="flex:0.5;">${data.dateFrom}</div>
      <div class="label" style="min-width:70px;margin-left:10px;">Time Out:</div>
      <div class="value" style="flex:0.4;">${data.timeFrom}</div>
      <div class="label" style="min-width:60px;margin-left:10px;">Time In:</div>
      <div class="value" style="flex:0.4;">${data.timeTo}</div>
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

  return html;
}

export function printGatePass(data: GatePassPDFData): void {
  const html = generateGatePassPDF(data);
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 300);
    };
  } else {
    alert('Please allow popups to print the gate pass');
  }
}