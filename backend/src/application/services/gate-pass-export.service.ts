import ExcelJS from 'exceljs';
import { prisma } from '../../infrastructure/database/prisma.service';
import { authenticate } from '../../interfaces/http/middleware/auth';
import { requirePermission } from '../../infrastructure/auth/rbac.middleware';
import { auditService } from '../../infrastructure/audit/audit.service';

interface ExportRow {
  Requester: string;
  Department: string;
  Purpose: string;
  Destination: string;
  Companions: string;
  'Workflow Status': string;
  'Release Date': string;
  'Release Time': string;
  'Employee Return': string;
  'Trip Duration': string;
  'Released By': string;
  'OB Meal Eligible': string;
  'OB Meal Amount': string;
}

export class GatePassExportService {
  /**
   * Generate Excel export with exactly the specified columns
   * for the currently filtered gate passes
   */
  async exportToExcel(filters: {
    status?: string;
    requesterId?: string;
    departmentId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    currentUserId?: string;
    userRoles?: string[];
    userDepartmentId?: string;
  }): Promise<ExcelJS.Buffer> {
    // Build where conditions - same as gate-pass.repository.ts list
    const where: any = {};
    const andConditions: any[] = [];

    const isSuperAdmin = filters.userRoles?.includes('super_admin');
    const isAdmin = filters.userRoles?.includes('admin') || isSuperAdmin;

    if (!isSuperAdmin && !isAdmin) {
      if (filters.userRoles?.includes('employee')) {
        andConditions.push({ request: { requesterId: filters.currentUserId } });
      } else if (filters.userRoles?.includes('supervisor') || filters.userRoles?.includes('manager')) {
        andConditions.push({
          OR: [
            { request: { requesterId: filters.currentUserId } },
            {
              request: {
                steps: {
                  some: {
                    roleId: { in: filters.userRoles },
                    status: { in: ['current', 'pending'] }
                  }
                }
              }
            }
          ]
        });
      } else if (filters.userRoles?.includes('security')) {
        andConditions.push({
          request: {
            status: { in: ['approved', 'completed', 'released'] }
          }
        });
      } else if (filters.userRoles?.includes('hr')) {
        andConditions.push({
          request: {
            steps: {
              some: { roleId: { in: filters.userRoles } }
            }
          }
        });
      }
    }

    const requestFilter: any = {};
    if (filters.status) requestFilter.status = filters.status;
    if (filters.requesterId) requestFilter.requesterId = filters.requesterId;
    if (filters.departmentId) requestFilter.departmentId = filters.departmentId;

    if (Object.keys(requestFilter).length > 0) {
      andConditions.push({ request: requestFilter });
    }

    if (filters.search) {
      andConditions.push({
        OR: [
          { purpose: { contains: filters.search, mode: 'insensitive' } },
          { destination: { contains: filters.search, mode: 'insensitive' } },
          { request: { controlNumber: { contains: filters.search, mode: 'insensitive' } } },
        ]
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    // Fetch all matching records (no pagination for export)
    const gatePasses = await prisma.gatePass.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        purpose: true,
        destination: true,
        releasedDate: true,
        releasedTime: true,
        releasedBy: true,
        releasedAt: true,
        returnedAt: true,
        tripDuration: true,
        tripDurationMinutes: true,
        obMealEligible: true,
        obMealAmount: true,
        releaseStatus: true,
        request: {
          select: {
            controlNumber: true,
            status: true,
            requester: {
              select: {
                displayName: true,
                employees: {
                  select: {
                    firstName: true,
                    lastName: true,
                    department: { select: { name: true } }
                  }
                }
              }
            }
          }
        },
        companions: {
          select: {
            fullName: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      }
    });

    // Map to export rows
    const rows: ExportRow[] = gatePasses.map(gp => {
      const req = gp.request;
      const emp = req.requester.employees;
      const firstName = emp?.firstName || '';
      const lastName = emp?.lastName || '';
      const requesterName = `${firstName} ${lastName}`.trim() || req.requester.displayName;
      
      const departmentName = emp?.department?.name || 'N/A';
      
      // Release Date & Time
      const releaseDate = gp.releasedDate
        ? new Date(gp.releasedDate).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })
        : gp.releasedAt
        ? new Date(gp.releasedAt).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })
        : '';

      const releaseTime = gp.releasedTime
        ? new Date(gp.releasedTime).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' })
        : gp.releasedAt
        ? new Date(gp.releasedAt).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' })
        : '';

      // Employee Return (returnedAt timestamp)
      const employeeReturn = gp.returnedAt
        ? `${new Date(gp.returnedAt).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })} ${new Date(gp.returnedAt).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' })}`
        : '';

      // Trip Duration
      let tripDuration = '';
      if (gp.tripDurationMinutes && gp.tripDurationMinutes > 0) {
        const hours = Math.floor(gp.tripDurationMinutes / 60);
        const mins = gp.tripDurationMinutes % 60;
        tripDuration = `${hours} hrs ${mins} mins`;
      } else if (gp.tripDuration && gp.tripDuration > 0) {
        const hours = Math.floor(gp.tripDuration);
        const mins = Math.round((gp.tripDuration - hours) * 60);
        tripDuration = `${hours} hrs ${mins} mins`;
      }

      // Released By - display name, not UUID
      const releasedBy = gp.releasedBy || '';

      // OB Meal
      const obMealEligible = gp.obMealEligible ? 'YES' : 'NO';
      const obMealAmount = gp.obMealAmount ? `₱${Number(gp.obMealAmount).toFixed(2)}` : '';

      // Workflow Status
      const workflowStatus = gp.releaseStatus || req.status || '';

      // Companions
      const companionsList = (gp.companions || [])
        .map((c: any) => c.fullName)
        .join('; ');

      return {
        Requester: requesterName,
        Department: departmentName,
        Purpose: gp.purpose || '',
        Destination: gp.destination || '',
        Companions: companionsList,
        'Workflow Status': workflowStatus,
        'Release Date': releaseDate,
        'Release Time': releaseTime,
        'Employee Return': employeeReturn,
        'Trip Duration': tripDuration,
        'Released By': releasedBy,
        'OB Meal Eligible': obMealEligible,
        'OB Meal Amount': obMealAmount,
      };
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HST Portal';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Gate Pass Report');

    // Define columns
    const columns = [
      { header: 'Requester', key: 'Requester', width: 30 },
      { header: 'Department', key: 'Department', width: 25 },
      { header: 'Purpose', key: 'Purpose', width: 35 },
      { header: 'Destination', key: 'Destination', width: 30 },
      { header: 'Companions', key: 'Companions', width: 40 },
      { header: 'Workflow Status', key: 'Workflow Status', width: 20 },
      { header: 'Release Date', key: 'Release Date', width: 18 },
      { header: 'Release Time', key: 'Release Time', width: 15 },
      { header: 'Employee Return', key: 'Employee Return', width: 22 },
      { header: 'Trip Duration', key: 'Trip Duration', width: 18 },
      { header: 'Released By', key: 'Released By', width: 25 },
      { header: 'OB Meal Eligible', key: 'OB Meal Eligible', width: 18 },
      { header: 'OB Meal Amount', key: 'OB Meal Amount', width: 18 },
    ];

    worksheet.columns = columns;

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 20;

    // Add data rows
    rows.forEach(row => {
      worksheet.addRow(row);
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: rows.length + 1, column: columns.length },
    };

    // Return buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}

export const gatePassExportService = new GatePassExportService();