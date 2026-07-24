import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';

export interface GatePassTemplateData {
  // Companions
  companions: Array<{ fullName: string; department?: string }>;

  // Company Information
  companyName: string;
  companyLegalName: string;
  companyAddress?: string;
  companyContact?: string;
  companyLogo?: string;

  // Document Control
  controlNumber: string;
  documentTitle: string;
  generatedDate: string;
  generatedTime: string;
  documentVersion: string;

  // Requester Information
  requesterName: string;
  requesterEmployeeId: string;
  requesterDepartment: string;
  requesterPosition: string;

  // Gate Pass Details
  purpose: string;
  destination: string;
  transportation: string;
  plateNumber?: string;
  vehicleType?: string;
  driverName?: string;
  items?: any;
  departureDate: string;
  departureTime: string;
  expectedReturn: string;
  remarks?: string;

  // Approval Information
  approvalDate?: string;
  workflowNumber: string;
  recommendedBy?: string;
  recommendedAt?: string;
  notedBy?: string;
  notedAt?: string;
  approvedBy?: string;
  approvedAt?: string;

  // Security Information
  kmReadingStart?: number;
  timeOut?: string;
  kmReadingEnd?: number;
  timeIn?: string;
  checkedBy?: string;
  withMeal?: boolean;
  mealAmount?: number;

  // QR Code
  qrCodeDataUrl: string;

  // Electronic Signatures
  signatures: SignatureData[];

  // Additional Metadata
  requestId: string;
  status: string;
  printCount: number;
}

export interface SignatureData {
  name: string;
  position: string;
  role: string;
  timestamp?: string;
  signatureImage?: string; // base64 data URL of the uploaded signature image
  isElectronic: boolean;
}

export class GatePassTemplateDataBuilder {
  constructor(private prisma: PrismaClient) {}

  async build(requestId: string): Promise<GatePassTemplateData> {
    const gatePass = await this.prisma.gatePass.findUnique({
      where: { requestId },
      include: {
        request: {
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
            steps: {
              where: { status: 'approved' },
              orderBy: { stepOrder: 'asc' },
              include: {
                actor: {
                  include: {
                    employees: {
                      include: {
                        department: true,
                        position: true,
                      },
                    },
                  },
                },
                role: true,
              },
            },
            actions: {
              orderBy: { createdAt: 'desc' },
              include: {
                actor: {
                  include: {
                    employees: {
                      include: {
                        department: true,
                        position: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        vehicle: {
          include: {
            assignedDriver: {
              include: {
                user: true,
                department: true,
                position: true,
              },
            },
          },
        },
        verifications: true,
      },
    }) as any;

    if (!gatePass) {
      throw new Error('Gate pass not found');
    }

    const company = await this.prisma.companyProfile.findFirst();
    const companyName = company?.name || 'HS TECHNOLOGIES (PHILS.), INC.';
    const companyLegalName = company?.legalName || 'HS Technologies (Phils.), Inc.';
    const companyAddress = company?.address || '';
    const companyContact = company?.contactNumber || '';
    const companyLogo = company?.logoUrl || '';

    const requesterEmployee = gatePass.request.requester?.employees;
    const requesterName = requesterEmployee
      ? `${requesterEmployee.firstName || ''} ${requesterEmployee.lastName || ''}`.trim() || requesterEmployee.displayName
      : gatePass.request.requester?.displayName || 'Unknown';
    const requesterEmployeeId = requesterEmployee?.employeeNumber || requesterEmployee?.id || gatePass.request.requester?.id || 'N/A';
    const requesterDepartment = requesterEmployee?.department?.name || '';
    const requesterPosition = requesterEmployee?.position?.title || '';

    const now = new Date();
    const generatedDate = this.formatDate(now);
    const generatedTime = this.formatTime(now);
    const documentVersion = '1.0';

    const departureDate = gatePass.createdAt ? this.formatDate(gatePass.createdAt) : generatedDate;
    const departureTime = gatePass.createdAt ? this.formatTime(gatePass.createdAt) : generatedTime;
    const expectedReturn = gatePass.expectedReturn ? this.formatDateTime(gatePass.expectedReturn) : '';

    const approvalStep = gatePass.request.steps.find((s: any) => s.status === 'approved');
    const approvalDate = approvalStep?.actedAt ? this.formatDateTime(approvalStep.actedAt) : undefined;

    const signatures = await this.buildSignatures(gatePass);

    const qrCodeDataUrl = gatePass.qrCode 
      ? `data:image/png;base64,${gatePass.qrCode}`
      : '';

    const plateNumber = gatePass.plateNumber || gatePass.vehicle?.plateNumber || undefined;
    const vehicleType = gatePass.vehicle?.vehicleType || undefined;
    const driverName = gatePass.driverName || (gatePass.vehicle?.assignedDriver 
      ? `${gatePass.vehicle.assignedDriver.user?.firstName || ''} ${gatePass.vehicle.assignedDriver.user?.lastName || ''}`.trim() || undefined
      : undefined);

    return {
      companyName,
      companyLegalName,
      companyAddress,
      companyContact,
      companyLogo,
      controlNumber: gatePass.request.controlNumber,
      documentTitle: 'GATE PASS / OB ALLOWANCE / REQUEST FOR CAR',
      generatedDate,
      generatedTime,
      documentVersion,
      requesterName,
      requesterEmployeeId,
      requesterDepartment,
      requesterPosition,
      purpose: gatePass.purpose,
      destination: gatePass.destination || '',
      transportation: gatePass.transportation || '',
      plateNumber,
      vehicleType,
      driverName,
      items: gatePass.items,
      departureDate,
      departureTime,
      expectedReturn,
      remarks: gatePass.request.description,
      approvalDate,
      workflowNumber: gatePass.request.workflowId || '',
      recommendedBy: gatePass.recommendedBy || undefined,
      recommendedAt: gatePass.recommendedAt ? this.formatDateTime(gatePass.recommendedAt) : undefined,
      notedBy: gatePass.notedBy || undefined,
      notedAt: gatePass.notedAt ? this.formatDateTime(gatePass.notedAt) : undefined,
      approvedBy: gatePass.approvedBy || undefined,
      approvedAt: gatePass.approvedAt ? this.formatDateTime(gatePass.approvedAt) : undefined,
      kmReadingStart: gatePass.verifications?.[0]?.kmReadingStart,
      timeOut: gatePass.securityReleasedAt ? this.formatDateTime(gatePass.securityReleasedAt) : undefined,
      kmReadingEnd: gatePass.verifications?.[0]?.kmReadingEnd,
      timeIn: gatePass.actualReturn ? this.formatDateTime(gatePass.actualReturn) : undefined,
      // Companions
      companions: await this.buildCompanions(gatePass),

      // Resolve security guard name from userId - NEVER display UUID
      checkedBy: gatePass.releasedBy || await this.resolveUserName(gatePass.securityReleasedBy) || undefined,
      withMeal: false,
      mealAmount: 0,
      qrCodeDataUrl,
      signatures,
      requestId: gatePass.requestId,
      status: gatePass.request.status,
      printCount: gatePass.printCount,
    };
  }

  private async buildCompanions(gatePass: any): Promise<Array<{ fullName: string; department?: string }>> {
    try {
      const companions = await this.prisma.gatePassCompanion.findMany({
        where: { gatePassId: gatePass.id },
        include: {
          employee: {
            select: {
              department: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
      return companions.map((c: any) => ({
        fullName: c.fullName,
        department: c.employee?.department?.name || undefined,
      }));
    } catch (err) {
      console.error('[GatePassTemplate] Failed to load companions:', err);
      return [];
    }
  }

  private async buildSignatures(gatePass: any): Promise<SignatureData[]> {
    const signatures: SignatureData[] = [];

    // Get all approved steps ordered by stepOrder
    const approvedSteps = (gatePass.request.steps || []).sort((a: any, b: any) => a.stepOrder - b.stepOrder);

    // Map step names to signature role labels
    const getRoleLabel = (stepName: string): string => {
      const name = stepName?.toLowerCase() || '';
      if (name.includes('recommend')) return 'Recommended by';
      if (name.includes('noted') || name.includes('note')) return 'Noted by';
      if (name.includes('approve') || name.includes('gado') || name.includes('final')) return 'Approved by';
      return 'Approved by'; // fallback
    };

    // Helper to get employee info from an action's actor
    const getActorInfo = (actor: any) => {
      const employee = actor?.employees;
      const displayName = employee?.displayName ||
        `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim() ||
        actor?.displayName ||
        'Unknown';
      const position = employee?.position?.title || 'Employee';
      return { displayName, position };
    };

    for (const step of approvedSteps) {
      // Find the matching action for this step by stepId OR by matching step name in metadata
      const action = gatePass.request.actions.find((a: any) => {
        // All actions from gate-pass-workflow.service.ts store action='approve' with metadata.stepName
        if (a.stepId === step.id) return true;
        if (a.metadata?.stepName && a.metadata.stepName === step.name) return true;
        return false;
      });

      if (action) {
        const roleLabel = getRoleLabel(step.name);
        const actorInfo = getActorInfo(action.actor);
        signatures.push({
          name: actorInfo.displayName,
          position: actorInfo.position,
          role: roleLabel,
          timestamp: this.formatDateTime(action.createdAt),
          signatureImage: await this.readSignatureFile(action.signaturePath),
          isElectronic: true,
        });
      }
    }

    return signatures;
  }

  /**
   * Read the actual uploaded signature file from disk and convert to base64 data URL.
   * The signaturePath from approval_action stores the full file path.
   */
  private async readSignatureFile(signaturePath?: string): Promise<string | undefined> {
    if (!signaturePath) return undefined;

    try {
      // signaturePath is the storage path from fileStorageService, relative to cwd
      // Try resolving it relative to process.cwd()
      const fullPath = path.isAbsolute(signaturePath)
        ? signaturePath
        : path.join(process.cwd(), signaturePath);

      const imageBuffer = await fs.readFile(fullPath);
      const ext = path.extname(fullPath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : 
                       ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                       ext === '.gif' ? 'image/gif' : 'image/png';
      return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
    } catch (err) {
      console.error(`[GatePassTemplate] Failed to read signature file: ${signaturePath}`, err);
      return undefined;
    }
  }

  /**
   * Resolve user display name from userId - NEVER return UUID
   */
  private async resolveUserName(userId?: string): Promise<string | undefined> {
    if (!userId) return undefined;
    
    // Check if it's already a display name (not a UUID format)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) {
      return userId; // Already a display name
    }
    
    // It's a UUID - look up user
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { 
          displayName: true,
          employees: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      
      if (user) {
        if (user.employees?.firstName && user.employees?.lastName) {
          return `${user.employees.firstName} ${user.employees.lastName}`;
        }
        return user.displayName;
      }
    } catch (err) {
      console.error(`[GatePassTemplate] Failed to resolve user name for ${userId}:`, err);
    }
    
    return undefined;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  private formatDateTime(date: Date): string {
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
  }
}