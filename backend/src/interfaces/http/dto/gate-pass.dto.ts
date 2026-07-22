export interface GatePassListItem {
  id: string;
  requestId: string;
  controlNumber: string;
  title: string;
  status: string;
  priority: string;
  purpose: string;
  destination?: string;
  transportation?: string;
  requester: {
    id: string;
    displayName: string;
    email: string;
    firstName?: string;
    lastName?: string;
    employeeNumber?: string;
    department?: {
      id: string;
      name: string;
      code: string;
    };
    position?: {
      title: string;
    };
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
  // Security release fields - using full names not UUIDs
  releasedBy?: string;
  releasedById?: string; // UUID for database integrity
  releasedAt?: string;
  releasedDate?: string;
  releasedTime?: string;
  vehiclePlate?: string;
  driverNameSecurity?: string;
  kmReadingStart?: number;
  kmReadingEnd?: number;
  timeOut?: string;
  timeIn?: string;
  securityRemarks?: string;
  returnRemarks?: string;
  releaseStatus?: string;
  gateStatus?: string;
  // Return fields
  returnedBy?: string;
  returnedAt?: string;
  employeeReturn?: string; // Timestamp when employee returned
  tripDurationDisplay?: string; // Human-readable trip duration (e.g. "2 hrs 35 mins")
  completedBy?: string;
  completedAt?: string;
  // OB Meal fields
  obMealEnabled?: boolean;
  obMealAmount?: number;
  obMealEligible?: boolean;
  obMealEligibleDisplay?: 'YES' | 'NO'; // Display value for export
  tripDuration?: number;
  tripDurationMinutes?: number;
  // Legacy mapped fields
  securityReleasedBy?: string;
  securityReleasedAt?: string;
  isUsed?: boolean;
  isVerified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  currentStep?: {
    stepOrder: number;
    name: string;
    role: {
      id: string;
      name: string;
    };
    status: string;
  };
  lastUpdated: string;
  createdAt: string;
  vehicle?: {
    id: string;
    plateNumber: string;
    brand?: string;
    model?: string;
    vehicleType?: string;
  };
}

export interface GatePassDetail extends GatePassListItem {
  items?: any;
  transportationAssignment?: {
    id?: string;
    transportationType?: string;
    vehicleId?: string;
    vehiclePlate?: string;
    driverName?: string;
    assignedBy?: string;
    assignedAt?: string;
    remarks?: string;
  };
  expectedReturn?: string;
  actualReturn?: string;
  qrCode?: string;
  printCount?: number;
  steps: Array<{
    id: string;
    stepOrder: number;
    name: string;
    role: {
      id: string;
      name: string;
    };
    status: string;
    actor?: {
      id: string;
      displayName: string;
    };
    assignedAt?: string;
    actedAt?: string;
  }>;
  actions: Array<{
    id: string;
    action: string;
    actor: {
      id: string;
      displayName: string;
    };
    note?: string;
    createdAt: string;
  }>;
}

export function mapGatePassToListItem(gp: any): GatePassListItem {
  const request = gp.request;
  const currentStep = request.steps?.find((s: any) => s.status === 'current') || request.steps?.[0];
  
  // Build requester name from employee record or fallback to displayName
  const firstName = request.requester.employees?.firstName || '';
  const lastName = request.requester.employees?.lastName || '';
  const requesterName = `${firstName} ${lastName}`.trim() || request.requester.displayName;

  // releasedBy is always the security guard's display name (stored by the service layer on release)
  const releasedByName = gp.releasedBy || undefined;
  // securityReleasedBy remains as the UUID for database integrity (joins with Users table)
  const securityReleasedById = gp.securityReleasedBy || undefined;

  // Calculate trip duration display string
  let tripDurationDisplay: string | undefined;
  if (gp.tripDurationMinutes != null && gp.tripDurationMinutes > 0) {
    const hours = Math.floor(gp.tripDurationMinutes / 60);
    const mins = gp.tripDurationMinutes % 60;
    tripDurationDisplay = `${hours} hrs ${mins} mins`;
  } else if (gp.tripDuration != null && gp.tripDuration > 0) {
    const hours = Math.floor(gp.tripDuration);
    const mins = Math.round((gp.tripDuration - hours) * 60);
    tripDurationDisplay = `${hours} hrs ${mins} mins`;
  }

  // Employee Return - use returnedAt timestamp
  const employeeReturn = gp.returnedAt?.toISOString?.() || gp.returnedAt || undefined;

  return {
    id: gp.id,
    requestId: request.id,
    controlNumber: request.controlNumber,
    title: request.title,
    status: request.status,
    priority: request.priority,
    purpose: gp.purpose,
    destination: gp.destination,
    transportation: gp.transportation,
    requester: {
      id: request.requester.id,
      displayName: requesterName,
      email: request.requester.email,
      firstName,
      lastName,
      employeeNumber: request.requester.employees?.employeeNumber,
      department: request.requester.employees?.department,
      position: request.requester.employees?.position,
    },
    department: request.department,
    // Security release fields with full names (NOT UUIDs)
    releasedBy: releasedByName,
    releasedById: securityReleasedById,
    releasedAt: gp.releasedAt?.toISOString?.() || gp.releasedAt || undefined,
    releasedDate: gp.releasedDate?.toISOString?.() || gp.releasedDate || undefined,
    releasedTime: gp.releasedTime?.toISOString?.() || gp.releasedTime || undefined,
    vehiclePlate: gp.vehiclePlate || undefined,
    driverNameSecurity: gp.driverNameSecurity || undefined,
    kmReadingStart: gp.kmReadingStart ?? undefined,
    kmReadingEnd: gp.kmReadingEnd ?? undefined,
    timeOut: gp.timeOut?.toISOString?.() || gp.timeOut || undefined,
    timeIn: gp.timeIn?.toISOString?.() || gp.timeIn || undefined,
    securityRemarks: gp.securityRemarks || undefined,
    returnRemarks: gp.returnRemarks || undefined,
    releaseStatus: gp.releaseStatus || undefined,
    gateStatus: gp.gateStatus || undefined,
    // Return fields
    returnedBy: gp.returnedBy || undefined,
    returnedAt: gp.returnedAt?.toISOString?.() || gp.returnedAt || undefined,
    employeeReturn,
    tripDurationDisplay,
    completedBy: gp.completedBy || undefined,
    completedAt: gp.completedAt?.toISOString?.() || gp.completedAt || undefined,
    // OB Meal fields
    obMealEnabled: gp.obMealEnabled ?? undefined,
    obMealAmount: gp.obMealAmount ? Number(gp.obMealAmount) : undefined,
    obMealEligible: gp.obMealEligible ?? undefined,
    tripDuration: gp.tripDuration ?? undefined,
    tripDurationMinutes: gp.tripDurationMinutes ?? undefined,
    // Legacy mapped fields - keep UUID for internal use
    securityReleasedBy: securityReleasedById,
    securityReleasedAt: gp.securityReleasedAt?.toISOString?.() || gp.securityReleasedAt || undefined,
    isUsed: gp.isUsed ?? undefined,
    isVerified: gp.isVerified ?? undefined,
    verifiedBy: gp.verifiedBy || undefined,
    verifiedAt: gp.verifiedAt?.toISOString?.() || gp.verifiedAt || undefined,
    currentStep: currentStep ? {
      stepOrder: currentStep.stepOrder,
      name: currentStep.name,
      role: currentStep.role,
      status: currentStep.status,
    } : undefined,
    lastUpdated: gp.updatedAt,
    createdAt: gp.createdAt,
    vehicle: gp.vehicle,
    // OB Meal eligibility display
    obMealEligibleDisplay: gp.obMealEligible ? 'YES' : (gp.obMealEligible === false ? 'NO' : undefined),
  };
}

export function mapGatePassToDetail(gp: any): GatePassDetail {
  const listItem = mapGatePassToListItem(gp);
  const request = gp.request;

  return {
    ...listItem,
    items: gp.items,
    transportationAssignment: gp.transportationAssignment
      ? {
          id: gp.transportationAssignment.id,
          transportationType:
            gp.transportationAssignment.transportationType,
          vehicleId: gp.transportationAssignment.vehicleId,
          vehiclePlate: gp.transportationAssignment.vehiclePlate,
          driverName: gp.transportationAssignment.driverName,
          assignedBy: gp.transportationAssignment.assignedBy,
          assignedAt:
            gp.transportationAssignment.assignedAt?.toISOString(),
          remarks: gp.transportationAssignment.remarks,
        }
      : undefined,
    expectedReturn: gp.expectedReturn?.toISOString(),
    actualReturn: gp.actualReturn?.toISOString(),
    qrCode: gp.qrCode,
    securityReleasedBy: gp.securityReleasedBy,
    securityReleasedAt: gp.securityReleasedAt?.toISOString(),
    printCount: gp.printCount,
    steps: (request.steps || []).map((step: any) => ({
      id: step.id,
      stepOrder: step.stepOrder,
      name: step.name,
      role: step.role,
      status: step.status,
      actor: step.actor,
      assignedAt: step.assignedAt?.toISOString(),
      actedAt: step.actedAt?.toISOString(),
    })),
    actions: (request.actions || []).map((action: any) => ({
      id: action.id,
      action: action.action,
      actor: action.actor,
      note: action.note,
      createdAt: action.createdAt.toISOString(),
    })),
  };
}