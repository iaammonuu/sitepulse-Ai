import {
  Project,
  ScheduleActivity,
  DocumentRecord,
  ExecutionEvent,
  MatchResult,
  AuditLog,
  UserProfile,
  AppNotification,
  InstitutionalMemoryBenchmark,
  DashboardMetrics,
  CrewResource,
  EquipmentResource,
  ResourceClashAlert,
  ResourceSummaryMetrics,
  AtRiskActivityAnalysis,
  WBSLevel,
  TimeAgentChatResponse
} from './types.ts';

const BASE_URL = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Projects
  getProjects: () => fetchJson<Project[]>(`${BASE_URL}/projects`),
  getProject: (id: string) => fetchJson<Project>(`${BASE_URL}/projects/${id}`),
  
  // Dashboard
  getDashboardMetrics: (projectId: string) => fetchJson<DashboardMetrics>(`${BASE_URL}/projects/${projectId}/dashboard`),
  
  // Activities
  getActivities: (projectId: string, filters?: { discipline?: string; area?: string; status?: string; wbs?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'ALL') params.append(k, v);
      });
    }
    return fetchJson<ScheduleActivity[]>(`${BASE_URL}/projects/${projectId}/activities?${params.toString()}`);
  },
  getActivityDetail: (projectId: string, activityId: string) => 
    fetchJson<{ activity: ScheduleActivity; events: ExecutionEvent[]; matches: MatchResult[]; auditLogs: AuditLog[] }>(`${BASE_URL}/projects/${projectId}/activities/${activityId}`),

  // Documents
  getDocuments: (projectId: string) => fetchJson<DocumentRecord[]>(`${BASE_URL}/projects/${projectId}/documents`),
  getDocumentDetail: (projectId: string, docId: string) => fetchJson<{ document: DocumentRecord; extractedEvents: ExecutionEvent[] }>(`${BASE_URL}/projects/${projectId}/documents/${docId}`),
  uploadDocument: (projectId: string, data: { filename: string; type: string; fileSize?: string; rawContent?: string; autoProcess?: boolean }) =>
    fetchJson<{ document?: DocumentRecord; events?: ExecutionEvent[] } | DocumentRecord>(`${BASE_URL}/projects/${projectId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  processDocument: (projectId: string, docId: string) => 
    fetchJson<{ success: boolean; document: DocumentRecord; events: ExecutionEvent[] }>(`${BASE_URL}/projects/${projectId}/documents/${docId}/process`, {
      method: 'POST'
    }),
  deleteDocument: (projectId: string, docId: string) =>
    fetchJson<{ success: boolean }>(`${BASE_URL}/projects/${projectId}/documents/${docId}`, {
      method: 'DELETE'
    }),

  // Matches & Review Queue
  getMatches: (projectId: string, status?: string) => {
    const url = status && status !== 'ALL' 
      ? `${BASE_URL}/projects/${projectId}/matches?status=${status}`
      : `${BASE_URL}/projects/${projectId}/matches`;
    return fetchJson<MatchResult[]>(url);
  },
  getMatchDetail: (projectId: string, matchId: string) =>
    fetchJson<{ match: MatchResult; event?: ExecutionEvent; candidateActivity?: ScheduleActivity }>(`${BASE_URL}/projects/${projectId}/matches/${matchId}`),
  approveMatch: (projectId: string, matchId: string, verifiedBy?: string, reason?: string) =>
    fetchJson<{ success: boolean; match: MatchResult; activity?: ScheduleActivity }>(`${BASE_URL}/projects/${projectId}/matches/${matchId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ verifiedBy, reason })
    }),
  rejectMatch: (projectId: string, matchId: string, reason: string) =>
    fetchJson<{ success: boolean; match: MatchResult }>(`${BASE_URL}/projects/${projectId}/matches/${matchId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),
  changeMatch: (projectId: string, matchId: string, newActivityId: string, reason: string) =>
    fetchJson<{ success: boolean; match: MatchResult }>(`${BASE_URL}/projects/${projectId}/matches/${matchId}/change`, {
      method: 'POST',
      body: JSON.stringify({ newActivityId, reason })
    }),
  markNewActivity: (projectId: string, matchId: string, proposal: { description: string; discipline: string; area: string; reason: string }) =>
    fetchJson<{ success: boolean; match: MatchResult }>(`${BASE_URL}/projects/${projectId}/matches/${matchId}/mark-new`, {
      method: 'POST',
      body: JSON.stringify(proposal)
    }),

  // Execution Events
  getExecutionEvents: (projectId: string) => fetchJson<ExecutionEvent[]>(`${BASE_URL}/projects/${projectId}/execution-events`),

  // Audit Logs
  getAuditLogs: (projectId: string, filters?: { user?: string; action?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'ALL') params.append(k, v);
      });
    }
    return fetchJson<AuditLog[]>(`${BASE_URL}/projects/${projectId}/audit?${params.toString()}`);
  },

  // Institutional Memory
  getInstitutionalMemory: (projectId: string) => fetchJson<InstitutionalMemoryBenchmark[]>(`${BASE_URL}/projects/${projectId}/memory`),

  // Resource Allocation & Clashes
  getCrews: (filters?: { discipline?: string; status?: string; shift?: string; wbsLevel?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'ALL') params.append(k, v);
      });
    }
    return fetchJson<CrewResource[]>(`${BASE_URL}/resources/crews?${params.toString()}`);
  },
  getEquipment: (filters?: { category?: string; discipline?: string; status?: string; wbsLevel?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'ALL') params.append(k, v);
      });
    }
    return fetchJson<EquipmentResource[]>(`${BASE_URL}/resources/equipment?${params.toString()}`);
  },
  getResourceClashes: () => fetchJson<ResourceClashAlert[]>(`${BASE_URL}/resources/clashes`),
  getResourceMetrics: () => fetchJson<ResourceSummaryMetrics>(`${BASE_URL}/resources/metrics`),
  assignCrew: (crewId: string, payload: { activityId: string; activityName: string; wbsLevel: WBSLevel; area: string; shift?: 'DAY' | 'NIGHT' | 'SWING' }) =>
    fetchJson<CrewResource>(`${BASE_URL}/resources/crews/${crewId}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  assignEquipment: (eqpId: string, payload: { activityId: string; activityName: string; wbsLevel: WBSLevel; area: string }) =>
    fetchJson<EquipmentResource>(`${BASE_URL}/resources/equipment/${eqpId}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  resolveClash: (clashId: string, resolutionAction?: string) =>
    fetchJson<{ success: boolean; message: string }>(`${BASE_URL}/resources/clashes/${clashId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolutionAction })
    }),

  // At-Risk Activities & AI Trajectory Analysis
  getAtRiskActivities: (projectId: string) => fetchJson<AtRiskActivityAnalysis[]>(`${BASE_URL}/projects/${projectId}/at-risk-activities`),

  // Time Agent
  sendTimeAgentMessage: (projectId: string, message: string) =>
    fetchJson<TimeAgentChatResponse>(`${BASE_URL}/projects/${projectId}/time-agent/chat`, {
      method: 'POST',
      body: JSON.stringify({ message })
    }),
  confirmTimeAgentEvent: (projectId: string, eventData: any) =>
    fetchJson<{ success: boolean; event: ExecutionEvent }>(`${BASE_URL}/projects/${projectId}/time-agent/events`, {
      method: 'POST',
      body: JSON.stringify({ eventData })
    }),

  // Search
  search: (projectId: string, query: string) =>
    fetchJson<{ projects: Project[]; activities: ScheduleActivity[]; documents: DocumentRecord[]; events: ExecutionEvent[] }>(
      `${BASE_URL}/search?projectId=${projectId}&q=${encodeURIComponent(query)}`
    ),

  // Users
  getUsers: () => fetchJson<{ users: UserProfile[]; currentUser: UserProfile }>(`${BASE_URL}/users`),
  setCurrentUser: (userId: string) => fetchJson<UserProfile>(`${BASE_URL}/users/current`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  }),

  // Notifications
  getNotifications: () => fetchJson<AppNotification[]>(`${BASE_URL}/notifications`),
  markNotificationRead: (id: string) => fetchJson<{ success: boolean }>(`${BASE_URL}/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => fetchJson<{ success: boolean }>(`${BASE_URL}/notifications/read-all`, { method: 'POST' }),

  // Demo Controls
  resetDemo: () => fetchJson<{ success: boolean; message: string }>(`${BASE_URL}/demo/reset`, { method: 'POST' }),
  seedDemo: () => fetchJson<{ success: boolean; message: string }>(`${BASE_URL}/demo/seed`, { method: 'POST' })
};
