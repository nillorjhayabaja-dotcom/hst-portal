// Display helpers for rendering nested Prisma objects
// These utilities prevent "Objects are not valid as a React child" errors

export interface EmployeeSummary {
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
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Position {
  id: string;
  title: string;
}

export interface Workflow {
  id: string;
  name: string;
}

/**
 * Safely get employee display name
 */
export function getEmployeeDisplayName(employee?: EmployeeSummary | null): string {
  if (!employee) return "-";
  
  return employee.displayName || 
         `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 
         "-";
}

/**
 * Safely get employee number
 */
export function getEmployeeNumber(employee?: EmployeeSummary | null): string {
  if (!employee?.employeeNumber) return "-";
  return employee.employeeNumber;
}

/**
 * Safely get department name
 */
export function getDepartmentName(department?: Department | null): string {
  if (!department?.name) return "-";
  return department.name;
}

/**
 * Safely get department code
 */
export function getDepartmentCode(department?: Department | null): string {
  if (!department?.code) return "-";
  return department.code;
}

/**
 * Safely get position title
 */
export function getPositionName(position?: Position | null): string {
  if (!position?.title) return "-";
  return position.title;
}

/**
 * Safely get workflow name
 */
export function getWorkflowName(workflow?: Workflow | null): string {
  if (!workflow?.name) return "-";
  return workflow.name;
}

/**
 * Get user label for display (combines name and employee number)
 */
export function getUserLabel(employee?: EmployeeSummary | null): string {
  if (!employee) return "-";
  
  const name = getEmployeeDisplayName(employee);
  const empNo = getEmployeeNumber(employee);
  
  if (empNo !== "-") {
    return `${name} (${empNo})`;
  }
  
  return name;
}

/**
 * Safely get employee email
 */
export function getEmployeeEmail(employee?: EmployeeSummary | null): string {
  if (!employee?.email) return "-";
  return employee.email;
}

/**
 * Format a value for display with fallback
 */
export function displayValue(value: unknown, fallback: string = "-"): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    // If it's an object with a name property, use that
    if ("name" in value && typeof (value as any).name === "string") {
      return (value as any).name;
    }
    if ("displayName" in value && typeof (value as any).displayName === "string") {
      return (value as any).displayName;
    }
    if ("title" in value && typeof (value as any).title === "string") {
      return (value as any).title;
    }
  }
  return fallback;
}