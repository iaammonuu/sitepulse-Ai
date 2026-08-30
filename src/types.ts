export type Discipline = 
  | 'CIVIL' 
  | 'PIPING' 
  | 'STATIC_EQUIPMENT' 
  | 'ROTATING_EQUIPMENT' 
  | 'ELECTRICAL' 
  | 'INSTRUMENTATION' 
  | 'HSE';

export type WBSLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';

export type ActivityStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';

export type VerificationStatus = 
  | 'APPROVED' 
  | 'PENDING_REVIEW' 
  | 'CHANGED' 
  | 'REJECTED' 
  | 'UNMATCHED';

export type MatchDecision = 'AUTO_MATCH' | 'PENDING_REVIEW' | 'UNMATCHED';

export type DocumentType = 'PDF' | 'XLSX' | 'TXT' | 'DOCX';

export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type ExecutionEventType = 
  | 'ACTIVITY_STARTED' 
  | 'ACTIVITY_IN_PROGRESS' 
  | 'ACTIVITY_COMPLETED' 
  | 'MATERIAL_DELAY' 
  | 'INSPECTION_HOLD';

export interface Project {
  id: string;
  code: string;
  name: string;
  location: string;
  client: string;
  contractor: string;
  startDate: string;
  plannedCompletionDate: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  progress: number;
  totalActivitiesCount: number;
  pendingReviewsCount: number;
  lastUpdated: string;
  description?: string;
}

export interface ScheduleActivity {
  id: string;
  activity_id: string;
  activity_name: string;
  wbs_level: WBSLevel;
  parent_id?: string | null;
  projectId: string;
  discipline: Discipline;
  area: string;
  planned_start: string;
  planned_finish: string;
  actual_start?: string | null;
  actual_finish?: string | null;
  planned_quantity: number;
  actual_quantity: number;
  unit: string;
  progress: number; // 0 to 100
  status: ActivityStatus;
  critical_path?: boolean;
  match_status?: VerificationStatus;
}

export interface DocumentRecord {
  id: string;
  projectId: string;
  filename: string;
  type: DocumentType;
  uploadedAt: string;
  uploadedBy: string;
  status: DocumentStatus;
  extractedEventsCount: number;
  errorMessage?: string | null;
  fileSize: string;
  rawContent?: string;
  parsedData?: any;
}

export interface CandidateScore {
  candidateActivityId: string;
  candidateActivityName: string;
  candidateWbs: WBSLevel;
  candidateDiscipline: Discipline;
  candidateArea: string;
  semanticScore: number;
  lexicalScore: number;
  disciplineScore: number;
  areaScore: number;
  contextScore: number;
  finalScore: number;
  decision: MatchDecision;
  explanation: string;
}

export interface MatchResult {
  id: string;
  projectId: string;
  executionEventId: string;
  reportedActivityName: string;
  topCandidateActivityId?: string | null;
  topCandidateActivityName?: string | null;
  topCandidateWbs?: WBSLevel | null;
  topCandidateDiscipline?: Discipline | null;
  topCandidateArea?: string | null;
  semanticScore: number;
  lexicalScore: number;
  disciplineScore: number;
  areaScore: number;
  contextScore: number;
  finalScore: number;
  decision: MatchDecision;
  explanation: string;
  alternativeCandidates: CandidateScore[];
  verificationStatus: VerificationStatus;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  verificationReason?: string | null;
  changedToActivityId?: string | null;
  changedToActivityName?: string | null;
  proposedNewActivity?: {
    description: string;
    discipline: Discipline;
    area: string;
    reason: string;
  } | null;
}

export interface ExecutionEvent {
  id: string;
  projectId: string;
  documentId?: string | null;
  documentName?: string | null;
  activityName: string;
  eventType: ExecutionEventType;
  quantity?: number | null;
  unit?: string | null;
  area: string;
  discipline: Discipline;
  timestamp: string;
  evidenceSnippet: string;
  sourceType: 'DOCUMENT' | 'TIME_AGENT' | 'MANUAL';
  matchedActivityId?: string | null;
  confidence: number;
  status: VerificationStatus;
  matchResultId?: string | null;
}

export interface ActualProgress {
  id: string;
  projectId: string;
  activityId: string;
  executionEventId: string;
  recordedDate: string;
  quantityRecorded: number;
  progressPercentage: number;
  statusUpdatedTo: ActivityStatus;
  actualStartDate?: string | null;
  actualFinishDate?: string | null;
  verifiedBy: string;
  pmisSyncStatus: 'SUCCESS' | 'PENDING' | 'FAILED';
  pmisSyncTimestamp: string;
}

export interface AuditLog {
  id: string;
  projectId: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: 
    | 'DOCUMENT_UPLOADED'
    | 'DOCUMENT_PROCESSED'
    | 'DOCUMENT_DELETED'
    | 'EXECUTION_EVENT_EXTRACTED'
    | 'MATCH_CREATED'
    | 'MATCH_APPROVED'
    | 'MATCH_CHANGED'
    | 'MATCH_REJECTED'
    | 'NEW_ACTIVITY_PROPOSED'
    | 'VERIFIED_PROGRESS_CREATED'
    | 'SCHEDULE_ACTUAL_UPDATED'
    | 'SCHEDULE_CHANGE_APPROVED'
    | 'RESOURCE_ASSIGNED'
    | 'PMIS_UPDATE_SENT'
    | 'TIME_AGENT_EVENT_CREATED'
    | 'DEMO_DATA_RESET'
    | 'DEMO_DATA_SEEDED';
  details: string;
  entityType: 'DOCUMENT' | 'MATCH' | 'ACTIVITY' | 'SCHEDULE' | 'EVENT' | 'SYSTEM' | 'RESOURCE';
  entityId?: string;
  pmisAdapterStatus?: 'SUCCESS' | 'SIMULATED' | 'SYNCED_PRIMAVERA_P6' | 'NONE';
  metadata?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'Supervisor' | 'Planner' | 'Project Manager' | 'Administrator';
  email: string;
  avatar?: string;
  status: 'ACTIVE' | 'OFFLINE';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'REVIEW_REQUIRED' | 'DOCUMENT_PROCESSED' | 'ALERT' | 'PMIS_SYNC';
  linkTarget: string;
}

export interface InstitutionalMemoryBenchmark {
  id: string;
  activityType: string;
  discipline: Discipline;
  historicalActivitiesCount: number;
  averagePlannedDurationDays: number;
  averageActualDurationDays: number;
  averageDeviationDays: number;
  deviationPercentage: number;
  confidenceScore: number;
  commonBottlenecks: string[];
  recommendedBufferDays: number;
}

export interface DashboardMetrics {
  totalActivities: number;
  scheduleProgress: number; // percentage
  pendingVerificationCount: number;
  averageAiConfidence: number; // percentage
  documentsCount: number;
  executionEventsCount: number;
  approvedCount: number;
  changedCount: number;
  rejectedCount: number;
  unmatchedCount: number;
  criticalPathDelayDays: number;
  lastPmisSyncTime: string;
}

export interface CrewResource {
  id: string;
  name: string;
  trade: string;
  discipline: Discipline;
  headcount: number;
  availableCount: number;
  leadSupervisor: string;
  certifications: string[];
  assignedWbsId?: string | null;
  assignedWbsLevel?: WBSLevel;
  assignedActivityName?: string;
  assignedArea: string;
  shift: 'DAY' | 'NIGHT' | 'SWING';
  status: 'AVAILABLE' | 'DEPLOYED' | 'OVERALLOCATED' | 'OFF_SHIFT';
  productivityScore: number;
  contactPhone?: string;
}

export interface EquipmentResource {
  id: string;
  code: string;
  name: string;
  category: 'HEAVY_LIFT' | 'EARTHMOVING' | 'PIPING_WELDING' | 'TRANSPORT' | 'ACCESS_SCAFFOLD' | 'INSPECTION_TESTING' | 'CIVIL' | 'CONCRETE';
  discipline: Discipline;
  operatorName: string;
  assignedWbsId?: string | null;
  assignedWbsLevel?: WBSLevel;
  assignedActivityName?: string;
  assignedArea: string;
  status: 'OPERATIONAL' | 'STANDBY' | 'IN_MAINTENANCE' | 'OVERALLOCATED';
  fuelLevel: number;
  telemetryStatus: 'CONNECTED' | 'OFFLINE';
  hourlyBurnRate: number;
  utilizationRate: number;
  nextInspectionDate: string;
  safetyCertValid: boolean;
}

export interface ResourceClashAlert {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: 'CREW' | 'EQUIPMENT';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  wbsLevel: WBSLevel;
  activityId: string;
  activityName: string;
  recommendedAction: string;
}

export interface AtRiskActivityAnalysis {
  id: string;
  activityId: string;
  activity_id: string;
  name: string;
  discipline: Discipline;
  area: string;
  wbs_level: WBSLevel;
  plannedProgress: number;
  actualProgress: number;
  progressDelta: number;
  plannedStart: string;
  plannedFinish: string;
  forecastFinish: string;
  slippageDays: number;
  criticalPath: boolean;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  riskScore: number;
  velocityTrend: 'ACCELERATING' | 'STABLE' | 'DECELERATING' | 'STALLED';
  aiRootCause: string;
  aiMitigation: string;
  resourceBottleneck?: string;
  historicalComparison?: string;
  lastReportedDate?: string;
}

export interface ResourceSummaryMetrics {
  totalCrews: number;
  activeCrews: number;
  totalHeadcount: number;
  deployedHeadcount: number;
  totalEquipment: number;
  operationalEquipment: number;
  averageEquipmentUtilization: number;
  activeClashesCount: number;
  highSeverityClashesCount: number;
}
