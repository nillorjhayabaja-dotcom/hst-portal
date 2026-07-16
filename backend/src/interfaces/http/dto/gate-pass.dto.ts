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
  securityReleasedBy?: string;
  securityReleasedAt?: string;
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
    currentStep: currentStep ? {
      stepOrder: currentStep.stepOrder,
      name: currentStep.name,
      role: currentStep.role,
      status: currentStep.status,
    } : undefined,
    lastUpdated: gp.updatedAt,
    createdAt: gp.createdAt,
    vehicle: gp.vehicle,
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