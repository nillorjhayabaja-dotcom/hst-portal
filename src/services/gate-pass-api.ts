// Gate Pass API Service - Communicates with backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  // Get access token from localStorage
  const accessToken = localStorage.getItem('hst.auth.accessToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    if (response.status === 401) {
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

export interface GatePass {
  id: string;
  requestId: string;
  controlNumber: string;
  purpose: string;
  destination?: string;
  transportation?: string;
  plateNumber?: string;
  driverName?: string;
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
  approvalStage?: string;
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
    transportation?: string;
    plateNumber?: string;
    vehicleId?: string;
    driverName?: string;
    items?: any;
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

    const url = `${API_BASE}/gate-pass?${params.toString()}`;
    
    // Get access token from localStorage
    const accessToken = localStorage.getItem('hst.auth.accessToken');
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
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

    const url = `${API_BASE}/gate-pass/${requestId}/approve`;
    const accessToken = localStorage.getItem('hst.auth.accessToken');
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
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

    const url = `${API_BASE}/gate-pass/${requestId}/recommend`;
    const accessToken = localStorage.getItem('hst.auth.accessToken');
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  },

  async noted(requestId: string, note?: string, signature?: File) {
    const formData = new FormData();
    formData.append('requestId', requestId);
    if (note) formData.append('note', note);
    if (signature) formData.append('signature', signature);

    const url = `${API_BASE}/gate-pass/${requestId}/noted`;
    const accessToken = localStorage.getItem('hst.auth.accessToken');
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
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

    const url = `${API_BASE}/gate-pass/${requestId}/gado-approve`;
    const accessToken = localStorage.getItem('hst.auth.accessToken');
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
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

    const url = `${API_BASE}/gate-pass/signature/upload`;
    const accessToken = localStorage.getItem('hst.auth.accessToken');
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
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
};
