// Gate Pass API Service - Communicates with backend
import { API_BASE_URL, getAuthHeaders, STORAGE_KEYS } from '@/config/environment';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    if (response.status === 401) {
      // Session expired - do NOT auto-logout or redirect
      // User can manually login again when needed
      throw new Error('Your session has expired. Please log in again.');
    }
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;
}

export interface UserInfo {
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

export interface TransportationAssignment {
  id?: string;
  transportationType?: string;
  vehiclePlate?: string;
  driverName?: string;
  remarks?: string;
  assignedAt?: string;
  assignedBy?: {
    id?: string;
    displayName?: string;
  };
}

export interface GatePass {
  id: string;
  requestId: string;
  controlNumber: string;
  purpose: string;
  destination?: string;
  transportation?: string;
  plateNumber?: string;
  driverName?: string;
  transportationAssignment?: TransportationAssignment;
  items?: any;
  expectedReturn?: string;
  actualReturn?: string;
  status: string;
  requester: UserInfo;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  vehicle?: {
    id: string;
    plateNumber: string;
    brand?: string;
    model?: string;
  };
  qrCode?: string;
  qrToken?: string;
  qrGeneratedAt?: string;
  isVerified?: boolean;
  isUsed?: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  expiresAt?: string;
  completedAt?: string;
  securityReleasedBy?: string;
  securityReleasedAt?: string;
  printCount: number;
  createdAt: string;
  updatedAt: string;
  currentStep?: {
    stepOrder: number;
    name: string;
    role: {
      id: string;
      name: string;
    };
    status: string;
  };
  // Security release fields
  releasedAt?: string;
  releasedDate?: string;
  releasedTime?: string;
  releasedBy?: string;
  releasedBySignature?: string;
  vehiclePlate?: string;
  driverNameSecurity?: string;
  transportationTypeSecurity?: string;
  kmReadingStart?: number;
  kmReadingEnd?: number;
  timeOut?: string;
  timeIn?: string;
  securityRemarks?: string;
  returnRemarks?: string;
  releaseStatus?: string;
  verificationStatus?: string;
  returnedBy?: string;
  returnedAt?: string;
  verifiedBySignature?: string;
  completedBySignature?: string;
  obMealEnabled?: boolean;
  obMealAmount?: number;
  obMealEligible?: boolean;
  tripDuration?: number;
  tripDurationMinutes?: number;
  gateStatus?: string;
  driverIn?: string;
}

export interface QRScanReleaseResponse {
  success: boolean;
  code?: string;
  message?: string;
  request: {
    controlNumber?: string;
    requester?: {
      id?: string;
      displayName?: string;
      employees?: Array<{
        firstName?: string;
        lastName?: string;
        department?: { id?: string; name?: string; code?: string };
      }>;
    };
    department?: {
      id?: string;
      name?: string;
      code?: string;
    };
  };
  verification: {
    status: string;
    releasedAt?: string;
    releasedBy?: string;
  };
  gatePass?: {
    destination?: string;
    purpose?: string;
    transportationMode?: string;
    vehiclePlate?: string;
    driverName?: string;
    transportationAssignment?: {
      id?: string;
      transportationType?: string;
      vehiclePlate?: string;
      driverName?: string;
      remarks?: string;
      assignedAt?: string;
      assignedBy?: { id?: string; displayName?: string };
      vehicle?: {
        id?: string;
        plateNumber?: string;
        brand?: string;
        model?: string;
        vehicleType?: string;
        status?: string;
      };
    };
  };
}

export interface WorkflowStatus {
  requestId: string;
  controlNumber: string;
  status: string;
  currentStepIndex: number;
  workflow: {
    id: string;
    name: string;
    steps: Array<{
      id: string;
      name: string;
      stepOrder: number;
      status: string;
      role: {
        id: string;
        name: string;
      };
      actor?: {
        id: string;
        displayName: string;
        signaturePath?: string;
      };
      actedAt?: string;
      note?: string;
    }>;
  };
  steps: any[];
  actions: Array<{
    id: string;
    action: string;
    stepId?: string;
    actor: UserInfo;
    note?: string;
    signaturePath?: string;
    createdAt: string;
    metadata?: any;
  }>;
  gatePass: GatePass;
}

export interface UserSignature {
  signaturePath?: string;
  signatureUploadedAt?: string;
  signatureMimeType?: string;
}

export interface CommentItem {
  id: string;
  author: UserInfo;
  content: string;
  createdAt: string;
}

export interface AttachmentItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  uploadedBy?: string;
  createdAt: string;
}

export const gatePassApi = {
  async submit(data: {
    purpose: string;
    destination?: string;
    items?: any;
    departureTime?: string;
    expectedReturn?: string;
    notes?: string;
    departmentId?: string;
  }) {
    return fetchApi<any>('/gate-pass/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAll(filters: {
    status?: string;
    requesterId?: string;
    departmentId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.requesterId) params.append('requesterId', filters.requesterId);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.pageSize) params.append('pageSize', String(filters.pageSize));

    const url = `${API_BASE_URL}/gate-pass?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    // Return the full response object with data, total, page, pageSize
    return {
      data: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    };
  },

  async getById(id: string) {
    return fetchApi<GatePass>(`/gate-pass/${id}`);
  },

  async getByRequestId(requestId: string) {
    return fetchApi<GatePass>(`/gate-pass/request/${requestId}`);
  },

  async approve(requestId: string, note?: string, signature?: File) {
    const formData = new FormData();
    formData.append('requestId', requestId);
    if (note) formData.append('note', note);
    if (signature) formData.append('signature', signature);

    const url = `${API_BASE_URL}/gate-pass/${requestId}/approve`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: getAuthHeaders(false),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  },

  // Step-specific approval endpoints
  async recommend(requestId: string, note?: string, signature?: File) {
    const formData = new FormData();
    formData.append('requestId', requestId);
    if (note) formData.append('note', note);
    if (signature) formData.append('signature', signature);

    const url = `${API_BASE_URL}/gate-pass/${requestId}/recommend`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: getAuthHeaders(false),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  },

  async noted(
    requestId: string,
    note?: string,
    signature?: File,
    transportationAssignment?: {
      transportationType?: string;
      vehiclePlate?: string;
      driverName?: string;
      remarks?: string;
    }
  ) {
    const formData = new FormData();
    formData.append('requestId', requestId);

    if (note) {
      formData.append('note', note);
    }

    if (signature) {
      formData.append('signature', signature);
    }

    if (transportationAssignment) {
      formData.append(
        'transportationAssignment',
        JSON.stringify(transportationAssignment)
      );
    }

    const url = `${API_BASE_URL}/gate-pass/${requestId}/noted`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: getAuthHeaders(false),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  },

  async gadoApprove(requestId: string, note?: string, signature?: File) {
    const formData = new FormData();
    formData.append('requestId', requestId);
    if (note) formData.append('note', note);
    if (signature) formData.append('signature', signature);

    const url = `${API_BASE_URL}/gate-pass/${requestId}/gado-approve`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: getAuthHeaders(false),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  },

  async reject(requestId: string, reason: string) {
    return fetchApi<any>(`/gate-pass/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ requestId, reason }),
    });
  },

  async returnRequest(requestId: string, note: string) {
    return fetchApi<any>(`/gate-pass/${requestId}/return`, {
      method: 'POST',
      body: JSON.stringify({ requestId, note }),
    });
  },

  async release(requestId: string, data: {
    transportationType?: string;
    vehiclePlate?: string;
    driverName?: string;
    remarks?: string;
    kmReadingStart?: number;
    kmReadingEnd?: number;
    withMeal?: boolean;
    mealAmount?: number;
    timeOut?: string;
    timeIn?: string;
  }) {
    return fetchApi<any>(`/gate-pass/${requestId}/release`, {
      method: 'POST',
      body: JSON.stringify({ requestId, ...data }),
    });
  },

  async getWorkflowStatus(requestId: string) {
    return fetchApi<WorkflowStatus>(`/gate-pass/${requestId}/workflow`);
  },

  async generateQRCode(requestId: string) {
    return fetchApi<{ qrCode: string }>(`/gate-pass/${requestId}/qr-code`);
  },

  async uploadSignature(signature: File) {
    const formData = new FormData();
    formData.append('signature', signature);

    const url = `${API_BASE_URL}/gate-pass/signature/upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  },

  async getUserSignature() {
    return fetchApi<UserSignature>('/gate-pass/signature/my');
  },

  async recordSecurityCheck(requestId: string, data: {
    kmReadingStart?: number;
    timeOut?: string;
    kmReadingEnd?: number;
    timeIn?: string;
    withMeal?: boolean;
    mealAmount?: number;
  }) {
    return fetchApi<any>(`/gate-pass/${requestId}/security-check`, {
      method: 'POST',
      body: JSON.stringify({ requestId, ...data }),
    });
  },

  async incrementPrintCount(requestId: string) {
    return fetchApi<any>(`/gate-pass/${requestId}/print`, {
      method: 'POST',
    });
  },

  async scanAndRelease(token: string) {
    return fetchApi<QRScanReleaseResponse>(`/verification/verify/${token}/release`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async getComments(entityType: string, entityId: string) {
    // Backend comment routes use path params: /comments/:entityType/:entityId
    return fetchApi<CommentItem[]>(`/comments/${entityType}/${entityId}`);
  },

  async addComment(entityType: string, entityId: string, content: string) {
    return fetchApi<CommentItem>(`/comments/${entityType}/${entityId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async getAttachments(entityType: string, entityId: string) {
    // Backend attachment routes: /attachments/:entityType/:entityId
    return fetchApi<AttachmentItem[]>(`/attachments/${entityType}/${entityId}`);
  },

  async printGatePass(requestId: string) {
    return fetchApi<{ printCount?: number }>(`/gate-pass/${requestId}/print`, {
      method: 'POST',
    });
  },

  async verifyQRToken(token: string) {
    return fetchApi<any>(`/verification/verify/${token}`, {
      method: 'GET',
    });
  },

  async confirmQRVerification(token: string, data: {
    kmReadingStart?: number;
    kmReadingEnd?: number;
    plateNumber?: string;
    driverName?: string;
    withMeal?: boolean;
    mealAmount?: number;
    timeOut?: string;
    timeIn?: string;
    remarks?: string;
  }) {
    return fetchApi<any>(`/verification/verify/${token}/release`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getQRScanHistory(requestId: string) {
    return fetchApi<any[]>(`/qr-scanner/history/${requestId}`);
  },

  /**
   * Process employee return - called when security scans QR on return
   * @route   POST /api/v1/verify/:token/return
   * @desc    Process employee return with trip duration and OB meal calculation
   * @access  Private (Security or Super Admin only)
   */
  async processReturn(token: string, data: {
    kmReadingEnd?: number;
    returnRemarks?: string;
    obMealEnabled?: boolean;
    obMealAmount?: number;
  }) {
    return fetchApi<any>(`/verification/verify/${token}/return`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
