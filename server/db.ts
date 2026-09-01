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
  Discipline,
  WBSLevel,
  CandidateScore,
  CrewResource,
  EquipmentResource,
  ResourceClashAlert,
  AtRiskActivityAnalysis,
  ResourceSummaryMetrics,
  TimeAgentChatResponse
} from '../src/types.ts';
import { answerTimeAgentQueryWithGemini } from './geminiService.ts';
import {
  INITIAL_PROJECTS,
  INITIAL_SCHEDULE_ACTIVITIES,
  INITIAL_DOCUMENTS,
  INITIAL_MATCH_RESULTS,
  INITIAL_EXECUTION_EVENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_INSTITUTIONAL_MEMORY,
  INITIAL_USERS
} from '../src/data/seedData.ts';
import {
  INITIAL_CREWS,
  INITIAL_EQUIPMENT,
  INITIAL_RESOURCE_CLASHES
} from '../src/data/resourceData.ts';

// Deep clone helper
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

class InMemoryDatabase {
  private projects: Project[] = [];
  private activities: ScheduleActivity[] = [];
  private documents: DocumentRecord[] = [];
  private matchResults: MatchResult[] = [];
  private executionEvents: ExecutionEvent[] = [];
  private auditLogs: AuditLog[] = [];
  private notifications: AppNotification[] = [];
  private memoryBenchmarks: InstitutionalMemoryBenchmark[] = [];
  private users: UserProfile[] = [];
  private currentUser: UserProfile = INITIAL_USERS[0];
  private crews: CrewResource[] = [];
  private equipment: EquipmentResource[] = [];
  private resourceClashes: ResourceClashAlert[] = [];

  constructor() {
    this.seed();
  }

  public seed(): void {
    this.projects = deepClone(INITIAL_PROJECTS);
    this.activities = deepClone(INITIAL_SCHEDULE_ACTIVITIES);
    this.documents = deepClone(INITIAL_DOCUMENTS);
    this.matchResults = deepClone(INITIAL_MATCH_RESULTS);
    this.executionEvents = deepClone(INITIAL_EXECUTION_EVENTS);
    this.auditLogs = deepClone(INITIAL_AUDIT_LOGS);
    this.notifications = deepClone(INITIAL_NOTIFICATIONS);
    this.memoryBenchmarks = deepClone(INITIAL_INSTITUTIONAL_MEMORY);
    this.users = deepClone(INITIAL_USERS);
    this.currentUser = this.users[0];
    this.crews = deepClone(INITIAL_CREWS);
    this.equipment = deepClone(INITIAL_EQUIPMENT);
    this.resourceClashes = deepClone(INITIAL_RESOURCE_CLASHES);
  }

  public reset(): void {
    this.seed();
    this.addAuditLog({
      projectId: 'proj-pep-001',
      user: this.currentUser.name,
      userRole: this.currentUser.role,
      action: 'DEMO_DATA_RESET',
      details: 'All project datasets, execution events, schedule actuals and audit trails restored to baseline demo state.',
      entityType: 'SYSTEM',
      pmisAdapterStatus: 'SIMULATED'
    });
  }

  // ================= USERS =================
  public getUsers(): UserProfile[] {
    return this.users;
  }

  public getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  public setCurrentUser(userId: string): UserProfile {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      this.currentUser = user;
    }
    return this.currentUser;
  }

  // ================= PROJECTS =================
  public getProjects(): Project[] {
    return this.projects.map(p => {
      const pActivities = this.activities.filter(a => a.projectId === p.id);
      const pendingMatches = this.matchResults.filter(m => m.projectId === p.id && m.verificationStatus === 'PENDING_REVIEW');
      
      // Calculate real overall progress from activities
      let calculatedProgress = p.progress;
      if (pActivities.length > 0) {
        const l6Activities = pActivities.filter(a => a.wbs_level === 'L6');
        const targetActivities = l6Activities.length > 0 ? l6Activities : pActivities;
        const totalProgress = targetActivities.reduce((acc, curr) => acc + (curr.progress || 0), 0);
        calculatedProgress = Math.round((totalProgress / targetActivities.length) * 10) / 10;
      }

      return {
        ...p,
        totalActivitiesCount: pActivities.length,
        pendingReviewsCount: pendingMatches.length,
        progress: calculatedProgress
      };
    });
  }

  public getProjectById(id: string): Project | undefined {
    const project = this.projects.find(p => p.id === id || p.code === id);
    if (!project) return undefined;
    
    const pActivities = this.activities.filter(a => a.projectId === project.id);
    const pendingMatches = this.matchResults.filter(m => m.projectId === project.id && m.verificationStatus === 'PENDING_REVIEW');
    
    let calculatedProgress = project.progress;
    if (pActivities.length > 0) {
      const l6Activities = pActivities.filter(a => a.wbs_level === 'L6');
      const targetActivities = l6Activities.length > 0 ? l6Activities : pActivities;
      const totalProgress = targetActivities.reduce((acc, curr) => acc + (curr.progress || 0), 0);
      calculatedProgress = Math.round((totalProgress / targetActivities.length) * 10) / 10;
    }

    return {
      ...project,
      totalActivitiesCount: pActivities.length,
      pendingReviewsCount: pendingMatches.length,
      progress: calculatedProgress
    };
  }

  // ================= DASHBOARD METRICS =================
  public getDashboardMetrics(projectId: string): DashboardMetrics {
    const project = this.getProjectById(projectId);
    const projActivities = this.activities.filter(a => a.projectId === projectId);
    const projMatches = this.matchResults.filter(m => m.projectId === projectId);
    const projEvents = this.executionEvents.filter(e => e.projectId === projectId);
    const projDocs = this.documents.filter(d => d.projectId === projectId);

    const pending = projMatches.filter(m => m.verificationStatus === 'PENDING_REVIEW').length;
    const approved = projMatches.filter(m => m.verificationStatus === 'APPROVED').length;
    const changed = projMatches.filter(m => m.verificationStatus === 'CHANGED').length;
    const rejected = projMatches.filter(m => m.verificationStatus === 'REJECTED').length;
    const unmatched = projMatches.filter(m => m.verificationStatus === 'UNMATCHED').length;

    // Calculate dynamic average AI confidence
    let avgConfidence = 91.4;
    if (projMatches.length > 0) {
      const sum = projMatches.reduce((acc, curr) => acc + (curr.finalScore || 0), 0);
      avgConfidence = Math.round((sum / projMatches.length) * 1000) / 10;
    }

    // Schedule progress dynamically calculated
    let calculatedProgress = project ? project.progress : 34.2;
    if (projActivities.length > 0) {
      const l6 = projActivities.filter(a => a.wbs_level === 'L6');
      const sample = l6.length > 0 ? l6 : projActivities;
      const sum = sample.reduce((acc, curr) => acc + (curr.progress || 0), 0);
      calculatedProgress = Math.round((sum / sample.length) * 10) / 10;
    }

    return {
      totalActivities: projActivities.length,
      scheduleProgress: calculatedProgress,
      pendingVerificationCount: pending,
      averageAiConfidence: avgConfidence,
      documentsCount: projDocs.length,
      executionEventsCount: projEvents.length,
      approvedCount: approved,
      changedCount: changed,
      rejectedCount: rejected,
      unmatchedCount: unmatched,
      criticalPathDelayDays: 0,
      lastPmisSyncTime: new Date().toISOString()
    };
  }

  // ================= SCHEDULE ACTIVITIES =================
  public getActivities(projectId: string, filters?: {
    discipline?: string;
    area?: string;
    status?: string;
    wbs?: string;
    search?: string;
  }): ScheduleActivity[] {
    let result = this.activities.filter(a => a.projectId === projectId);

    if (filters) {
      if (filters.discipline && filters.discipline !== 'ALL') {
        result = result.filter(a => a.discipline === filters.discipline);
      }
      if (filters.area && filters.area !== 'ALL') {
        result = result.filter(a => a.area.toLowerCase().includes(filters.area!.toLowerCase()));
      }
      if (filters.status && filters.status !== 'ALL') {
        result = result.filter(a => a.status === filters.status);
      }
      if (filters.wbs && filters.wbs !== 'ALL') {
        result = result.filter(a => a.wbs_level === filters.wbs);
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        result = result.filter(a =>
          a.activity_id.toLowerCase().includes(query) ||
          a.activity_name.toLowerCase().includes(query) ||
          a.area.toLowerCase().includes(query) ||
          a.discipline.toLowerCase().includes(query)
        );
      }
    }

    return result;
  }

  public getActivityById(id: string): ScheduleActivity | undefined {
    return this.activities.find(a => a.id === id || a.activity_id === id);
  }

  public updateActivity(id: string, updates: Partial<ScheduleActivity>): ScheduleActivity | undefined {
    const idx = this.activities.findIndex(a => a.id === id || a.activity_id === id);
    if (idx === -1) return undefined;
    this.activities[idx] = { ...this.activities[idx], ...updates };
    return this.activities[idx];
  }

  // ================= DOCUMENTS =================
  public getDocuments(projectId: string): DocumentRecord[] {
    return this.documents.filter(d => d.projectId === projectId);
  }

  public getDocumentById(id: string): DocumentRecord | undefined {
    return this.documents.find(d => d.id === id);
  }

  public addDocument(doc: Partial<DocumentRecord>): DocumentRecord {
    const newDoc: DocumentRecord = {
      id: `doc-${Date.now()}`,
      projectId: doc.projectId || 'proj-pep-001',
      filename: doc.filename || 'uploaded_document.pdf',
      type: doc.type || 'PDF',
      uploadedAt: new Date().toISOString(),
      uploadedBy: this.currentUser.name,
      status: 'UPLOADED',
      extractedEventsCount: 0,
      errorMessage: null,
      fileSize: doc.fileSize || '1.2 MB',
      rawContent: doc.rawContent || '',
      parsedData: doc.parsedData || null
    };
    this.documents.unshift(newDoc);

    this.addAuditLog({
      projectId: newDoc.projectId,
      user: this.currentUser.name,
      userRole: this.currentUser.role,
      action: 'DOCUMENT_UPLOADED',
      details: `Uploaded ${newDoc.filename} (${newDoc.fileSize}) for ingestion.`,
      entityType: 'DOCUMENT',
      entityId: newDoc.id
    });

    return newDoc;
  }

  public deleteDocument(id: string): boolean {
    const idx = this.documents.findIndex(d => d.id === id);
    if (idx === -1) return false;
    const deleted = this.documents.splice(idx, 1)[0];

    this.addAuditLog({
      projectId: deleted.projectId,
      user: this.currentUser.name,
      userRole: this.currentUser.role,
      action: 'DOCUMENT_DELETED',
      details: `Document ${deleted.filename} removed from ingestion queue.`,
      entityType: 'DOCUMENT',
      entityId: id
    });

    return true;
  }

  public processDocument(id: string): { success: boolean; document: DocumentRecord; events: ExecutionEvent[] } {
    const doc = this.documents.find(d => d.id === id);
    if (!doc) {
      throw new Error('Document not found');
    }

    doc.status = 'PROCESSING';

    // Extract synthetic events based on filename / content
    const createdEvents: ExecutionEvent[] = [];
    const lower = (doc.filename + ' ' + (doc.rawContent || '')).toLowerCase();

    if (lower.includes('piping') || lower.includes('spool') || lower.includes('weld')) {
      const evt1 = this.createExecutionEvent({
        projectId: doc.projectId,
        documentId: doc.id,
        documentName: doc.filename,
        activityName: 'Spool Erection — Area A Ingestion',
        eventType: 'ACTIVITY_IN_PROGRESS',
        quantity: 8,
        unit: 'NOS',
        area: 'Area A',
        discipline: 'PIPING',
        timestamp: new Date().toISOString(),
        evidenceSnippet: `Extracted from ${doc.filename}: Progress update recorded on pipe spool erection.`,
        sourceType: 'DOCUMENT',
        matchedActivityId: 'act-l6-pip-001',
        confidence: 0.94,
        status: 'PENDING_REVIEW'
      });
      createdEvents.push(evt1);
    } else if (lower.includes('civil') || lower.includes('foundation')) {
      const evt2 = this.createExecutionEvent({
        projectId: doc.projectId,
        documentId: doc.id,
        documentName: doc.filename,
        activityName: 'Civil Pedestal Concrete Pouring',
        eventType: 'ACTIVITY_IN_PROGRESS',
        quantity: 40,
        unit: 'M3',
        area: 'Area B',
        discipline: 'CIVIL',
        timestamp: new Date().toISOString(),
        evidenceSnippet: `Extracted from ${doc.filename}: Concrete pour underway for equipment bases.`,
        sourceType: 'DOCUMENT',
        matchedActivityId: 'act-l6-civ-001',
        confidence: 0.89,
        status: 'PENDING_REVIEW'
      });
      createdEvents.push(evt2);
    } else {
      const evt3 = this.createExecutionEvent({
        projectId: doc.projectId,
        documentId: doc.id,
        documentName: doc.filename,
        activityName: 'Field Execution General Progress',
        eventType: 'ACTIVITY_IN_PROGRESS',
        quantity: 1,
        unit: 'LOG',
        area: 'Area A',
        discipline: 'PIPING',
        timestamp: new Date().toISOString(),
        evidenceSnippet: `Extracted from ${doc.filename}: General work shift field log.`,
        sourceType: 'DOCUMENT',
        matchedActivityId: 'act-l6-pip-001',
        confidence: 0.82,
        status: 'PENDING_REVIEW'
      });
      createdEvents.push(evt3);
    }

    doc.status = 'COMPLETED';
    doc.extractedEventsCount = createdEvents.length;

    this.addAuditLog({
      projectId: doc.projectId,
      user: 'AI Match Engine (SitePulse)',
      userRole: 'AI Model',
      action: 'DOCUMENT_PROCESSED',
      details: `Processed ${doc.filename} successfully. Extracted ${createdEvents.length} execution events.`,
      entityType: 'DOCUMENT',
      entityId: doc.id,
      pmisAdapterStatus: 'SIMULATED'
    });

    return { success: true, document: doc, events: createdEvents };
  }

  // ================= EXECUTION EVENTS =================
  public getExecutionEvents(projectId: string): ExecutionEvent[] {
    return this.executionEvents.filter(e => e.projectId === projectId);
  }

  public createExecutionEvent(data: Partial<ExecutionEvent>): ExecutionEvent {
    const id = `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const matchId = `match-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const targetActivity = data.matchedActivityId
      ? this.getActivityById(data.matchedActivityId)
      : this.activities.find(a => a.projectId === data.projectId && a.wbs_level === 'L6' && a.discipline === data.discipline);

    const event: ExecutionEvent = {
      id,
      projectId: data.projectId || 'proj-pep-001',
      documentId: data.documentId || null,
      documentName: data.documentName || 'Manual Site Submission',
      activityName: data.activityName || 'Field Execution Event',
      eventType: data.eventType || 'ACTIVITY_IN_PROGRESS',
      quantity: data.quantity ?? 1,
      unit: data.unit || 'NOS',
      area: data.area || 'Area A',
      discipline: data.discipline || 'PIPING',
      timestamp: data.timestamp || new Date().toISOString(),
      evidenceSnippet: data.evidenceSnippet || 'Direct supervisor entry',
      sourceType: data.sourceType || 'DOCUMENT',
      matchedActivityId: targetActivity ? targetActivity.id : null,
      confidence: data.confidence ?? 0.91,
      status: data.status || 'PENDING_REVIEW',
      matchResultId: matchId
    };

    this.executionEvents.unshift(event);

    // Create corresponding MatchResult
    const match: MatchResult = {
      id: matchId,
      projectId: event.projectId,
      executionEventId: event.id,
      reportedActivityName: event.activityName,
      topCandidateActivityId: targetActivity ? targetActivity.id : null,
      topCandidateActivityName: targetActivity ? `${targetActivity.activity_id}: ${targetActivity.activity_name}` : null,
      topCandidateWbs: targetActivity ? targetActivity.wbs_level : null,
      topCandidateDiscipline: targetActivity ? targetActivity.discipline : null,
      topCandidateArea: targetActivity ? targetActivity.area : null,
      semanticScore: 0.94,
      lexicalScore: 0.90,
      disciplineScore: 1.00,
      areaScore: 1.00,
      contextScore: 0.88,
      finalScore: event.confidence,
      decision: event.confidence >= 0.85 ? 'AUTO_MATCH' : 'PENDING_REVIEW',
      explanation: targetActivity
        ? `Matched against ${targetActivity.activity_id} based on discipline (${targetActivity.discipline}) and area (${targetActivity.area}).`
        : 'Could not match against baseline WBS.',
      alternativeCandidates: [],
      verificationStatus: event.status
    };

    this.matchResults.unshift(match);

    this.addAuditLog({
      projectId: event.projectId,
      user: this.currentUser.name,
      userRole: this.currentUser.role,
      action: 'EXECUTION_EVENT_EXTRACTED',
      details: `Extracted execution event "${event.activityName}" from ${event.documentName || 'Supervisor Entry'}.`,
      entityType: 'EVENT',
      entityId: event.id
    });

    return event;
  }

  // ================= MATCHES & REVIEW QUEUE =================
  public getMatches(projectId: string, status?: string): MatchResult[] {
    let result = this.matchResults.filter(m => m.projectId === projectId);
    if (status && status !== 'ALL') {
      result = result.filter(m => m.verificationStatus === status);
    }
    return result;
  }

  public getMatchById(id: string): MatchResult | undefined {
    return this.matchResults.find(m => m.id === id);
  }

  // APPROVE MATCH
  public approveMatch(matchId: string, verifiedBy?: string, reason?: string): { success: boolean; match: MatchResult; activity?: ScheduleActivity } {
    const match = this.matchResults.find(m => m.id === matchId);
    if (!match) {
      throw new Error('Match record not found');
    }

    const reviewer = verifiedBy || this.currentUser.name;
    const now = new Date().toISOString();
    const dateStr = now.split('T')[0];

    match.verificationStatus = 'APPROVED';
    match.verifiedBy = reviewer;
    match.verifiedAt = now;
    match.verificationReason = reason || 'Verified and approved by Lead Planner.';

    // Update execution event status
    const event = this.executionEvents.find(e => e.id === match.executionEventId);
    if (event) {
      event.status = 'APPROVED';
    }

    // Update schedule activity actuals
    let targetActivity: ScheduleActivity | undefined;
    const activityIdToUpdate = match.topCandidateActivityId;
    if (activityIdToUpdate) {
      targetActivity = this.getActivityById(activityIdToUpdate);
      if (targetActivity) {
        targetActivity.actual_finish = targetActivity.actual_finish || dateStr;
        targetActivity.actual_start = targetActivity.actual_start || dateStr;
        targetActivity.actual_quantity = targetActivity.planned_quantity;
        targetActivity.progress = 100.0;
        targetActivity.status = 'COMPLETED';
        targetActivity.match_status = 'APPROVED';

        // Also update parent L5 if present
        if (targetActivity.parent_id) {
          const parentL5 = this.getActivityById(targetActivity.parent_id);
          if (parentL5) {
            parentL5.progress = Math.min(100, (parentL5.progress || 0) + 15);
            if (parentL5.progress >= 100) parentL5.status = 'COMPLETED';
          }
        }
      }
    }

    // Create Audit Logs (Step 9 story: MATCH_APPROVED, VERIFIED_PROGRESS_CREATED, PMIS_UPDATE_SENT)
    this.addAuditLog({
      projectId: match.projectId,
      user: reviewer,
      userRole: this.currentUser.role,
      action: 'MATCH_APPROVED',
      details: `Approved match "${match.reportedActivityName}" -> ${match.topCandidateActivityName || 'Activity'}. Reason: ${match.verificationReason}`,
      entityType: 'MATCH',
      entityId: match.id,
      pmisAdapterStatus: 'SUCCESS'
    });

    this.addAuditLog({
      projectId: match.projectId,
      user: 'SitePulse Sync Daemon',
      userRole: 'System',
      action: 'VERIFIED_PROGRESS_CREATED',
      details: `Generated actual progress record for ${targetActivity?.activity_id || 'Activity'} (Actual Finish: ${dateStr}, Progress: 100%).`,
      entityType: 'SCHEDULE',
      entityId: targetActivity?.id,
      pmisAdapterStatus: 'SUCCESS'
    });

    this.addAuditLog({
      projectId: match.projectId,
      user: 'Mock PMIS Adapter (Primavera P6)',
      userRole: 'System',
      action: 'PMIS_UPDATE_SENT',
      details: `Dispatched actualized progress payload to DEMO PMIS (Primavera P6 Adapter Status: 200 OK). Activity ${targetActivity?.activity_id || 'Activity'} updated.`,
      entityType: 'SYSTEM',
      pmisAdapterStatus: 'SUCCESS'
    });

    return { success: true, match, activity: targetActivity };
  }

  // CHANGE MATCH
  public changeMatch(matchId: string, newActivityId: string, reason: string): { success: boolean; match: MatchResult } {
    const match = this.matchResults.find(m => m.id === matchId);
    if (!match) throw new Error('Match record not found');
    const newActivity = this.getActivityById(newActivityId);
    if (!newActivity) throw new Error('Selected replacement activity not found in project WBS');

    const reviewer = this.currentUser.name;
    const now = new Date().toISOString();

    match.verificationStatus = 'CHANGED';
    match.verifiedBy = reviewer;
    match.verifiedAt = now;
    match.verificationReason = reason;
    match.changedToActivityId = newActivity.id;
    match.changedToActivityName = `${newActivity.activity_id}: ${newActivity.activity_name}`;

    const event = this.executionEvents.find(e => e.id === match.executionEventId);
    if (event) {
      event.status = 'CHANGED';
      event.matchedActivityId = newActivity.id;
    }

    newActivity.match_status = 'CHANGED';

    this.addAuditLog({
      projectId: match.projectId,
      user: reviewer,
      userRole: this.currentUser.role,
      action: 'MATCH_CHANGED',
      details: `Planner re-mapped match from "${match.topCandidateActivityName || 'Original'}" to "${match.changedToActivityName}". Reason: ${reason}`,
      entityType: 'MATCH',
      entityId: match.id,
      pmisAdapterStatus: 'SUCCESS'
    });

    return { success: true, match };
  }

  // REJECT MATCH
  public rejectMatch(matchId: string, reason: string): { success: boolean; match: MatchResult } {
    const match = this.matchResults.find(m => m.id === matchId);
    if (!match) throw new Error('Match record not found');

    const reviewer = this.currentUser.name;
    const now = new Date().toISOString();

    match.verificationStatus = 'REJECTED';
    match.verifiedBy = reviewer;
    match.verifiedAt = now;
    match.verificationReason = reason;

    const event = this.executionEvents.find(e => e.id === match.executionEventId);
    if (event) {
      event.status = 'REJECTED';
    }

    this.addAuditLog({
      projectId: match.projectId,
      user: reviewer,
      userRole: this.currentUser.role,
      action: 'MATCH_REJECTED',
      details: `Rejected match "${match.reportedActivityName}". Reason: ${reason}`,
      entityType: 'MATCH',
      entityId: match.id,
      pmisAdapterStatus: 'NONE'
    });

    return { success: true, match };
  }

  // MARK NEW ACTIVITY PROPOSED
  public markNewActivity(matchId: string, proposal: { description: string; discipline: Discipline; area: string; reason: string }): { success: boolean; match: MatchResult } {
    const match = this.matchResults.find(m => m.id === matchId);
    if (!match) throw new Error('Match record not found');

    const reviewer = this.currentUser.name;
    const now = new Date().toISOString();

    match.verificationStatus = 'UNMATCHED';
    match.verifiedBy = reviewer;
    match.verifiedAt = now;
    match.proposedNewActivity = proposal;

    this.addAuditLog({
      projectId: match.projectId,
      user: reviewer,
      userRole: this.currentUser.role,
      action: 'NEW_ACTIVITY_PROPOSED',
      details: `Proposed new schedule activity: "${proposal.description}" (${proposal.discipline} - ${proposal.area}). Reason: ${proposal.reason}. Baseline schedule untouched pending MOC approval.`,
      entityType: 'SCHEDULE',
      entityId: match.id,
      pmisAdapterStatus: 'SIMULATED'
    });

    return { success: true, match };
  }

  // ================= TIME AGENT =================
  public async processTimeAgentMessageAsync(projectId: string, userText: string): Promise<TimeAgentChatResponse> {
    const project = this.getProjectById(projectId);
    const activities = this.getActivities(projectId);
    const metrics = this.getDashboardMetrics(projectId);
    const clashes = this.getResourceClashes();
    const atRisk = this.getAtRiskActivities(projectId);

    // Try Gemini AI first if available
    const geminiResult = await answerTimeAgentQueryWithGemini(userText, {
      project,
      activities,
      metrics,
      clashes,
      atRisk
    });

    if (geminiResult && geminiResult.reply) {
      return geminiResult;
    }

    // Deterministic Smart EPC Knowledge Engine
    return this.processTimeAgentMessage(projectId, userText);
  }

  public processTimeAgentMessage(projectId: string, userText: string): TimeAgentChatResponse {
    const textLower = userText.toLowerCase().trim();
    const project = this.getProjectById(projectId);
    const activities = this.getActivities(projectId);
    const clashes = this.getResourceClashes();
    const atRisk = this.getAtRiskActivities(projectId);

    const isQuestion = 
      textLower.includes('?') || 
      textLower.startsWith('what') || 
      textLower.startsWith('how') || 
      textLower.startsWith('who') || 
      textLower.startsWith('which') || 
      textLower.startsWith('when') || 
      textLower.startsWith('where') || 
      textLower.startsWith('is ') || 
      textLower.startsWith('are ') || 
      textLower.startsWith('check ') || 
      textLower.startsWith('show ') || 
      textLower.startsWith('status ') || 
      textLower.startsWith('tell me');

    // 1. Line 24 Welding
    if (textLower.includes('line 24') || (textLower.includes('weld') && textLower.includes('area b'))) {
      const act = this.getActivityById('act-l6-wld-002') || activities.find(a => a.activity_id === 'L6-WLD-001-B') || activities[0];
      
      if (isQuestion) {
        return {
          intent: 'SCHEDULE_INQUIRY',
          reply: `**Line 24 Field Welding Status (Area B)**\n\n- **Activity ID**: \`${act.activity_id}\`\n- **Current Progress**: **${act.progress}%** (${act.actual_quantity || 18} of ${act.planned_quantity || 120} joints completed)\n- **Schedule Window**: ${act.planned_start} to ${act.planned_finish}\n- **Assigned Crew**: Welder Gang 2 (8 pipe welders)\n- **Status**: **${act.status}**\n\n*Note: NDT inspection hold is scheduled after joint 40.*`,
          relatedActivities: [
            { id: act.id, activity_id: act.activity_id, name: act.activity_name, progress: act.progress, status: act.status, area: act.area }
          ],
          suggestedFollowUps: [
            'Log 6 field welds completed on Line 24',
            'Check Welder Gang 2 allocation',
            'What is the next NDT inspection milestone?'
          ],
          relevantMetrics: [
            { label: 'Joints Done', value: '18 / 120', trend: 'up' },
            { label: 'NDT Pass Rate', value: '98.5%', badge: 'Compliant' }
          ]
        };
      }

      // Field log intent
      const jointsMatch = textLower.match(/(\d+)\s*(joint|weld|nos)/);
      const qty = jointsMatch ? parseInt(jointsMatch[1], 10) : 12;
      return {
        intent: 'FIELD_LOG',
        reply: `Extracted field execution report for **Line 24 Field Welding** in **Area B**.\n\n- **Work Quantity**: **${qty} Joints**\n- **Discipline**: Piping / Mechanical\n- **Matched WBS Activity**: \`${act.activity_id}: ${act.activity_name}\`\n- **Confidence**: **94%**\n\nPlease verify and confirm below to link this record into the Review Queue.`,
        extractedEvent: {
          activityName: 'Field Welding Line 24',
          eventType: textLower.includes('finish') || textLower.includes('complete') ? 'ACTIVITY_COMPLETED' : 'ACTIVITY_STARTED',
          quantity: qty,
          unit: 'JOINT',
          area: 'Area B',
          discipline: 'PIPING',
          confidence: 0.94,
          evidenceSnippet: userText,
          matchedActivityId: act.id,
          matchedActivityName: `${act.activity_id}: ${act.activity_name}`
        },
        suggestedFollowUps: [
          'What is remaining on Line 24?',
          'Check Hydro Testing schedule for Area B',
          'Show welding crew assignments'
        ]
      };
    }

    // 2. Spool Erection
    if (textLower.includes('spool') || textLower.includes('erection')) {
      const act = this.getActivityById('act-l6-pip-001') || activities.find(a => a.activity_id === 'L6-PIP-003-A') || activities[1];
      
      if (isQuestion) {
        return {
          intent: 'SCHEDULE_INQUIRY',
          reply: `**Spool Erection Summary (Area A)**\n\n- **Activity**: \`${act.activity_id}\` — ${act.activity_name}\n- **Progress**: **${act.progress}%** (${act.actual_quantity || 18} of ${act.planned_quantity || 22} spools erected)\n- **Critical Path**: **Yes** (High-impact schedule bottleneck)\n- **Status**: ${act.status}\n- **Forecast Completion**: 2026-07-08 (4 days ahead of float consumption)\n\n*Crane Support: 150T Crawler Crane allocated in Area A.*`,
          relatedActivities: [
            { id: act.id, activity_id: act.activity_id, name: act.activity_name, progress: act.progress, status: act.status, area: act.area }
          ],
          suggestedFollowUps: [
            'Log 4 spools erected in Area A',
            'Is the heavy crane available tomorrow?',
            'What is the next hydro test loop?'
          ],
          relevantMetrics: [
            { label: 'Spools Erected', value: '18 / 22', trend: 'up' },
            { label: 'Crane Utilization', value: '92%', badge: 'High' }
          ]
        };
      }

      const spoolsMatch = textLower.match(/(\d+)\s*(spool|nos|item|piece)/);
      const qty = spoolsMatch ? parseInt(spoolsMatch[1], 10) : 18;
      return {
        intent: 'FIELD_LOG',
        reply: `Extracted field progress event: **Spool Erection** in **Area A**.\n\n- **Quantity**: **${qty} Spools**\n- **Discipline**: Piping\n- **Matched Schedule Activity**: \`${act.activity_id}: ${act.activity_name}\`\n- **AI Confidence**: **93%**\n\nReady for supervisor confirmation:`,
        extractedEvent: {
          activityName: 'Spool Erection',
          eventType: 'ACTIVITY_COMPLETED',
          quantity: qty,
          unit: 'NOS',
          area: 'Area A',
          discipline: 'PIPING',
          confidence: 0.93,
          evidenceSnippet: userText,
          matchedActivityId: act.id,
          matchedActivityName: `${act.activity_id}: ${act.activity_name}`
        },
        suggestedFollowUps: [
          'Show piping progress in Area A',
          'Check flange torquing status'
        ]
      };
    }

    // 3. Pump Foundation / Civil
    if (textLower.includes('foundation') || textLower.includes('pump') || textLower.includes('civil') || textLower.includes('pour') || textLower.includes('concrete')) {
      const act = this.getActivityById('act-l6-civ-001') || activities.find(a => a.discipline === 'CIVIL') || activities[0];
      
      if (isQuestion) {
        return {
          intent: 'SCHEDULE_INQUIRY',
          reply: `**Civil & Foundation Progress Overview**\n\n- **Activity ID**: \`${act.activity_id}\` (${act.activity_name})\n- **Progress**: **${act.progress}%**\n- **Curing Stage**: 7-day compressive strength test passed at 32 MPa.\n- **Planned Handover**: 2026-06-28 to Mechanical team.\n- **Assigned Resource**: Civil Gang 1 (12 tradesmen).`,
          relatedActivities: [
            { id: act.id, activity_id: act.activity_id, name: act.activity_name, progress: act.progress, status: act.status, area: act.area }
          ],
          suggestedFollowUps: [
            'Log foundation concrete pour 100% completed',
            'When can pump skid alignment start?'
          ],
          relevantMetrics: [
            { label: 'Strength', value: '32 MPa', badge: 'Passed' },
            { label: 'Civil Progress', value: `${act.progress}%`, trend: 'up' }
          ]
        };
      }

      return {
        intent: 'FIELD_LOG',
        reply: `Captured civil progress: **Pump Foundation Construction** in **${act.area}**.\n\n- **Status**: In Progress (Reinforcement & shuttering ready)\n- **Matched WBS**: \`${act.activity_id}\`\n- **Confidence**: **89%**`,
        extractedEvent: {
          activityName: 'Pump Foundation Construction',
          eventType: 'ACTIVITY_IN_PROGRESS',
          quantity: 65,
          unit: '%',
          area: act.area,
          discipline: 'CIVIL',
          confidence: 0.89,
          evidenceSnippet: userText,
          matchedActivityId: act.id,
          matchedActivityName: `${act.activity_id}: ${act.activity_name}`
        },
        suggestedFollowUps: [
          'What is the next civil milestone?',
          'Check batch plant delivery status'
        ]
      };
    }

    // 4. Critical Path, Delays, At-Risk Inquiries
    if (textLower.includes('delay') || textLower.includes('risk') || textLower.includes('critical path') || textLower.includes('slippage') || textLower.includes('behind')) {
      const atRiskItems = atRisk.slice(0, 3);
      const formattedItems = atRiskItems.map(r => 
        `• **${r.activity_id}: ${r.name}**\n  - Slippage Risk: **+${r.slippageDays} days** | Progress Delta: **${r.progressDelta}%**\n  - AI Root Cause: *${r.aiRootCause}*\n  - Recommended Mitigation: *${r.aiMitigation}*`
      ).join('\n\n');

      return {
        intent: 'RISK_INQUIRY',
        reply: `**Schedule Risk & Critical Path Analysis**\n\nCurrently, **${atRisk.length} activities** are flagged on the radar trajectory:\n\n${formattedItems}\n\n*All items are synchronized with institutional benchmarks to safeguard the project mechanical completion milestone.*`,
        suggestedFollowUps: [
          'How can we mitigate Spool Erection delays?',
          'Show resource clashes in Area A',
          'What is overall project progress?'
        ],
        relevantMetrics: [
          { label: 'At-Risk Activities', value: atRisk.length, badge: 'Warning' },
          { label: 'Max Slippage', value: '+12 Days', trend: 'down' }
        ]
      };
    }

    // 5. Resource Clashes & Crew Inquiries
    if (textLower.includes('clash') || textLower.includes('crew') || textLower.includes('equipment') || textLower.includes('crane') || textLower.includes('resource')) {
      const clashSummary = clashes.length > 0
        ? clashes.map(c => `• **${c.title}** (${c.severity} Severity)\n  - Location: **${c.resourceName}** on *${c.activityName}*\n  - Action: *${c.recommendedAction}*`).join('\n\n')
        : '• No active high-severity resource clashes detected.';

      return {
        intent: 'RESOURCE_INQUIRY',
        reply: `**Live Resource & Clash Status**\n\n- **Active Clashes**: **${clashes.length} alerts** requiring coordination\n\n${clashSummary}\n\n*Headcount Deployed: 52 Tradesmen across 6 Active Crews.*`,
        suggestedFollowUps: [
          'Assign second welding crew to Line 24',
          'Check equipment utilization rates',
          'Show crew shift breakdown'
        ],
        relevantMetrics: [
          { label: 'Active Crews', value: '6 Gangs', badge: 'Active' },
          { label: 'Active Clashes', value: clashes.length, badge: clashes.length > 0 ? 'Action Req.' : 'Clear' }
        ]
      };
    }

    // 6. Overall Project Progress
    if (textLower.includes('progress') || textLower.includes('overall') || textLower.includes('project status') || textLower.includes('pep')) {
      const totalActs = activities.length;
      const completedActs = activities.filter(a => a.status === 'COMPLETED').length;
      const inProgressActs = activities.filter(a => a.status === 'IN_PROGRESS').length;

      return {
        intent: 'SCHEDULE_INQUIRY',
        reply: `**${project?.name || 'PEP Expansion Project'} Status Overview**\n\n- **Overall Completion**: **${project?.progress || 42.5}%**\n- **Total Activities**: **${totalActs}** (${completedActs} Completed, ${inProgressActs} In Progress)\n- **Pending Review Queue**: **${project?.pendingReviewsCount || 3} items** awaiting supervisor verification\n- **Critical Path Float**: Positive (+4 days buffer on Substation handover)\n\n*Primavera P6 sync adapter is operational and up to date.*`,
        suggestedFollowUps: [
          'Show at-risk activities',
          'What is pending in the Review Queue?',
          'Check Line 24 welding progress'
        ],
        relevantMetrics: [
          { label: 'Overall Progress', value: `${project?.progress || 42.5}%`, trend: 'up' },
          { label: 'Completed WBS', value: `${completedActs} / ${totalActs}`, trend: 'up' },
          { label: 'Pending Reviews', value: project?.pendingReviewsCount || 3, badge: 'Pending' }
        ]
      };
    }

    // 7. General Fallback with Smart Parsing
    const defaultAct = activities.find(a => 
      a.wbs_level === 'L6' && 
      (textLower.includes(a.area.toLowerCase()) || textLower.includes(a.discipline.toLowerCase()) || textLower.includes(a.activity_name.toLowerCase().slice(0, 5)))
    ) || activities[0];

    if (isQuestion) {
      return {
        intent: 'QUESTION_ANSWER',
        reply: `Regarding your query on **"${userText}"**:\n\n- **Related Schedule Activity**: \`${defaultAct.activity_id}: ${defaultAct.activity_name}\`\n- **Area / Discipline**: ${defaultAct.area} • ${defaultAct.discipline}\n- **Current Progress**: **${defaultAct.progress}%** (Status: ${defaultAct.status})\n- **Planned Dates**: ${defaultAct.planned_start} to ${defaultAct.planned_finish}\n\nFeel free to ask for specific crew allocations, critical path risks, or log daily site measurements.`,
        relatedActivities: [
          { id: defaultAct.id, activity_id: defaultAct.activity_id, name: defaultAct.activity_name, progress: defaultAct.progress, status: defaultAct.status, area: defaultAct.area }
        ],
        suggestedFollowUps: [
          'What is overall project progress?',
          'Show at-risk critical activities',
          'Check active resource clashes'
        ]
      };
    }

    // Fallback Field Progress Log
    return {
      intent: 'FIELD_LOG',
      reply: `Parsed field report: **${userText.slice(0, 50)}**.\n\n- **Area**: ${defaultAct.area}\n- **Discipline**: ${defaultAct.discipline}\n- **Candidate Activity**: \`${defaultAct.activity_id}: ${defaultAct.activity_name}\`\n- **Confidence**: **86%**\n\nClick confirm below to add this event to the Review Queue:`,
      extractedEvent: {
        activityName: userText.slice(0, 45),
        eventType: 'ACTIVITY_IN_PROGRESS',
        quantity: 1,
        unit: 'NOS',
        area: defaultAct.area,
        discipline: defaultAct.discipline,
        confidence: 0.86,
        evidenceSnippet: userText,
        matchedActivityId: defaultAct.id,
        matchedActivityName: `${defaultAct.activity_id}: ${defaultAct.activity_name}`
      },
      suggestedFollowUps: [
        'Check pending items in Review Queue',
        'Show project schedule explorer'
      ]
    };
  }

  public confirmTimeAgentEvent(projectId: string, eventData: any): ExecutionEvent {
    const created = this.createExecutionEvent({
      projectId,
      activityName: eventData.activityName,
      eventType: eventData.eventType || 'ACTIVITY_STARTED',
      area: eventData.area || 'Area B',
      discipline: 'PIPING',
      timestamp: new Date().toISOString(),
      evidenceSnippet: `Time Agent Chat: "${eventData.activityName} in ${eventData.area}" at ${eventData.time || '10:30'}`,
      sourceType: 'TIME_AGENT',
      matchedActivityId: eventData.matchedActivityId,
      confidence: eventData.confidence || 0.91,
      status: 'PENDING_REVIEW'
    });

    this.addAuditLog({
      projectId,
      user: this.currentUser.name,
      userRole: this.currentUser.role,
      action: 'TIME_AGENT_EVENT_CREATED',
      details: `Created execution event from Time Agent conversational input: "${eventData.activityName}". Linked to ${eventData.matchedActivityName}.`,
      entityType: 'EVENT',
      entityId: created.id,
      pmisAdapterStatus: 'SIMULATED'
    });

    return created;
  }

  // ================= AUDIT TRAIL =================
  public getAuditLogs(projectId: string, filters?: { user?: string; action?: string; search?: string }): AuditLog[] {
    let result = this.auditLogs.filter(a => a.projectId === projectId);
    if (filters) {
      if (filters.user && filters.user !== 'ALL') {
        result = result.filter(a => a.user.toLowerCase().includes(filters.user!.toLowerCase()));
      }
      if (filters.action && filters.action !== 'ALL') {
        result = result.filter(a => a.action === filters.action);
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        result = result.filter(a =>
          a.details.toLowerCase().includes(query) ||
          a.action.toLowerCase().includes(query) ||
          a.user.toLowerCase().includes(query)
        );
      }
    }
    return result;
  }

  public addAuditLog(log: Partial<AuditLog>): AuditLog {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      projectId: log.projectId || 'proj-pep-001',
      timestamp: log.timestamp || new Date().toISOString(),
      user: log.user || this.currentUser.name,
      userRole: log.userRole || this.currentUser.role,
      action: log.action || 'MATCH_CREATED',
      details: log.details || '',
      entityType: log.entityType || 'SYSTEM',
      entityId: log.entityId,
      pmisAdapterStatus: log.pmisAdapterStatus || 'NONE',
      metadata: log.metadata
    };
    this.auditLogs.unshift(newLog);
    return newLog;
  }

  // ================= NOTIFICATIONS =================
  public getNotifications(): AppNotification[] {
    return this.notifications;
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
  }

  public markAllNotificationsAsRead(): void {
    this.notifications.forEach(n => (n.read = true));
  }

  // ================= INSTITUTIONAL MEMORY =================
  public getInstitutionalMemory(projectId: string): InstitutionalMemoryBenchmark[] {
    return this.memoryBenchmarks;
  }

  // ================= GLOBAL SEARCH =================
  public searchAll(projectId: string, query: string): {
    projects: Project[];
    activities: ScheduleActivity[];
    documents: DocumentRecord[];
    events: ExecutionEvent[];
  } {
    const q = query.toLowerCase().trim();
    if (!q) {
      return { projects: [], activities: [], documents: [], events: [] };
    }

    const projects = this.projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q)
    );

    const activities = this.activities.filter(a =>
      a.projectId === projectId && (
        a.activity_id.toLowerCase().includes(q) ||
        a.activity_name.toLowerCase().includes(q) ||
        a.discipline.toLowerCase().includes(q) ||
        a.area.toLowerCase().includes(q)
      )
    ).slice(0, 8);

    const documents = this.documents.filter(d =>
      d.projectId === projectId && (
        d.filename.toLowerCase().includes(q) ||
        (d.rawContent && d.rawContent.toLowerCase().includes(q))
      )
    ).slice(0, 5);

    const events = this.executionEvents.filter(e =>
      e.projectId === projectId && (
        e.activityName.toLowerCase().includes(q) ||
        e.evidenceSnippet.toLowerCase().includes(q) ||
        e.area.toLowerCase().includes(q)
      )
    ).slice(0, 5);

    return { projects, activities, documents, events };
  }

  // ================= RESOURCE ALLOCATION (CREW & EQUIPMENT) =================
  public getCrews(filters?: { discipline?: string; status?: string; shift?: string; wbsLevel?: string; search?: string }): CrewResource[] {
    let result = [...this.crews];
    if (filters) {
      if (filters.discipline && filters.discipline !== 'ALL') {
        result = result.filter(c => c.discipline === filters.discipline);
      }
      if (filters.status && filters.status !== 'ALL') {
        result = result.filter(c => c.status === filters.status);
      }
      if (filters.shift && filters.shift !== 'ALL') {
        result = result.filter(c => c.shift === filters.shift);
      }
      if (filters.wbsLevel && filters.wbsLevel !== 'ALL') {
        result = result.filter(c => c.assignedWbsLevel === filters.wbsLevel);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.trade.toLowerCase().includes(q) ||
          c.leadSupervisor.toLowerCase().includes(q) ||
          (c.assignedActivityName && c.assignedActivityName.toLowerCase().includes(q)) ||
          c.assignedArea.toLowerCase().includes(q)
        );
      }
    }
    return result;
  }

  public getEquipment(filters?: { category?: string; discipline?: string; status?: string; wbsLevel?: string; search?: string }): EquipmentResource[] {
    let result = [...this.equipment];
    if (filters) {
      if (filters.category && filters.category !== 'ALL') {
        result = result.filter(e => e.category === filters.category);
      }
      if (filters.discipline && filters.discipline !== 'ALL') {
        result = result.filter(e => e.discipline === filters.discipline);
      }
      if (filters.status && filters.status !== 'ALL') {
        result = result.filter(e => e.status === filters.status);
      }
      if (filters.wbsLevel && filters.wbsLevel !== 'ALL') {
        result = result.filter(e => e.assignedWbsLevel === filters.wbsLevel);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(e =>
          e.name.toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q) ||
          e.operatorName.toLowerCase().includes(q) ||
          (e.assignedActivityName && e.assignedActivityName.toLowerCase().includes(q)) ||
          e.assignedArea.toLowerCase().includes(q)
        );
      }
    }
    return result;
  }

  public getResourceClashes(): ResourceClashAlert[] {
    return this.resourceClashes;
  }

  public getResourceSummaryMetrics(): ResourceSummaryMetrics {
    const totalCrews = this.crews.length;
    const activeCrews = this.crews.filter(c => c.status === 'DEPLOYED' || c.status === 'OVERALLOCATED').length;
    const totalHeadcount = this.crews.reduce((acc, c) => acc + c.headcount, 0);
    const deployedHeadcount = this.crews
      .filter(c => c.status === 'DEPLOYED' || c.status === 'OVERALLOCATED')
      .reduce((acc, c) => acc + c.availableCount, 0);

    const totalEquipment = this.equipment.length;
    const operationalEquipment = this.equipment.filter(e => e.status === 'OPERATIONAL').length;
    const avgUtil = totalEquipment > 0
      ? Math.round(this.equipment.reduce((acc, e) => acc + e.utilizationRate, 0) / totalEquipment)
      : 0;

    const activeClashesCount = this.resourceClashes.length;
    const highSeverityClashesCount = this.resourceClashes.filter(c => c.severity === 'HIGH').length;

    return {
      totalCrews,
      activeCrews,
      totalHeadcount,
      deployedHeadcount,
      totalEquipment,
      operationalEquipment,
      averageEquipmentUtilization: avgUtil,
      activeClashesCount,
      highSeverityClashesCount
    };
  }

  public assignCrew(crewId: string, payload: { activityId: string; activityName: string; wbsLevel: WBSLevel; area: string; shift?: 'DAY' | 'NIGHT' | 'SWING' }): CrewResource {
    const crew = this.crews.find(c => c.id === crewId);
    if (!crew) throw new Error('Crew resource not found');

    crew.assignedWbsId = payload.activityId;
    crew.assignedActivityName = payload.activityName;
    crew.assignedWbsLevel = payload.wbsLevel;
    crew.assignedArea = payload.area;
    crew.status = 'DEPLOYED';
    if (payload.shift) crew.shift = payload.shift;

    this.addAuditLog({
      projectId: 'proj-pep-001',
      user: this.currentUser.name,
      userRole: this.currentUser.role,
      action: 'RESOURCE_ASSIGNED',
      details: `Reallocated Crew "${crew.name}" (${crew.headcount} workers) to [${payload.wbsLevel}] ${payload.activityName}.`,
      entityType: 'RESOURCE',
      entityId: crew.id,
      pmisAdapterStatus: 'SIMULATED'
    });

    return crew;
  }

  public assignEquipment(eqpId: string, payload: { activityId: string; activityName: string; wbsLevel: WBSLevel; area: string }): EquipmentResource {
    const eqp = this.equipment.find(e => e.id === eqpId);
    if (!eqp) throw new Error('Equipment resource not found');

    eqp.assignedWbsId = payload.activityId;
    eqp.assignedActivityName = payload.activityName;
    eqp.assignedWbsLevel = payload.wbsLevel;
    eqp.assignedArea = payload.area;
    eqp.status = 'OPERATIONAL';

    this.addAuditLog({
      projectId: 'proj-pep-001',
      user: this.currentUser.name,
      userRole: this.currentUser.role,
      action: 'RESOURCE_ASSIGNED',
      details: `Reassigned Equipment "${eqp.name}" (${eqp.code}) to [${payload.wbsLevel}] ${payload.activityName}.`,
      entityType: 'RESOURCE',
      entityId: eqp.id,
      pmisAdapterStatus: 'SIMULATED'
    });

    return eqp;
  }

  public resolveClash(clashId: string, resolutionAction: string): { success: boolean; message: string } {
    const idx = this.resourceClashes.findIndex(c => c.id === clashId);
    if (idx === -1) throw new Error('Clash not found');

    const resolved = this.resourceClashes[idx];
    this.resourceClashes.splice(idx, 1);

    // If overallocated resource, reset status to deployed
    const crew = this.crews.find(c => c.id === resolved.resourceId);
    if (crew && crew.status === 'OVERALLOCATED') crew.status = 'DEPLOYED';

    const eqp = this.equipment.find(e => e.id === resolved.resourceId);
    if (eqp && eqp.status === 'OVERALLOCATED') eqp.status = 'OPERATIONAL';

    this.addAuditLog({
      projectId: 'proj-pep-001',
      user: this.currentUser.name,
      userRole: this.currentUser.role,
      action: 'SCHEDULE_CHANGE_APPROVED',
      details: `Resolved clash on ${resolved.resourceName}: ${resolutionAction}`,
      entityType: 'RESOURCE',
      entityId: resolved.resourceId,
      pmisAdapterStatus: 'SYNCED_PRIMAVERA_P6'
    });

    return { success: true, message: `Clash "${resolved.title}" resolved and PMIS resource curve leveled.` };
  }

  // ================= AT-RISK ACTIVITIES & AI TRAJECTORY =================
  public getAtRiskActivities(projectId: string): AtRiskActivityAnalysis[] {
    const pActivities = this.activities.filter(a => a.projectId === projectId);
    
    // Curated high-precision AI trajectory evaluations for critical & lagging activities
    const analyses: AtRiskActivityAnalysis[] = [
      {
        id: 'risk-pip-003',
        activityId: 'act-l6-pip-003',
        activity_id: 'L6-PIP-003',
        name: 'HP Steam Line 24 Fit-up & Golden Joint Welds',
        discipline: 'PIPING',
        area: 'Process Unit 1 - Area B',
        wbs_level: 'L6',
        plannedProgress: 75,
        actualProgress: 42,
        progressDelta: -33,
        plannedStart: '2026-08-10',
        plannedFinish: '2026-08-28',
        forecastFinish: '2026-09-06',
        slippageDays: 9,
        criticalPath: true,
        riskLevel: 'CRITICAL',
        riskScore: 92,
        velocityTrend: 'DECELERATING',
        aiRootCause: 'Severe welder headcount deficit (4 of 8 certified 6G TIG alloy welders diverted to Vessel V-104 nozzle repair). NDT volumetric pass rate is high (98%), but linear daily joint completion is 45% below target.',
        aiMitigation: 'Mobilize 4 qualified high-pressure welders from the Offsites pre-assembly bay and authorize a 4-hour staggered overlap shift.',
        resourceBottleneck: 'Alpha Welding Gang (6G/TIG) - 4 welders short',
        historicalComparison: 'Similar turnaround projects experienced average 6.4 day slippage on HP steam header golden joints when TIG certified gangs were split.',
        lastReportedDate: '2026-08-27'
      },
      {
        id: 'risk-eqp-001',
        activityId: 'act-l5-eqp-001',
        activity_id: 'L5-EQP-001',
        name: 'C-201 Depropanizer Column Heavy Lift & Erection',
        discipline: 'STATIC_EQUIPMENT',
        area: 'Fractionation Area 102',
        wbs_level: 'L5',
        plannedProgress: 50,
        actualProgress: 25,
        progressDelta: -25,
        plannedStart: '2026-08-15',
        plannedFinish: '2026-08-30',
        forecastFinish: '2026-09-05',
        slippageDays: 6,
        criticalPath: true,
        riskLevel: 'CRITICAL',
        riskScore: 88,
        velocityTrend: 'STALLED',
        aiRootCause: 'Liebherr 500T crane shared conflict between Column erection and Valve Skid Rigging. High wind gust threshold (28 knots) suspended initial tailing hook-up on Aug 26.',
        aiMitigation: 'Authorize dedicated 500T crane exclusive window for C-201 lift from 06:00 to 14:00 daily; reschedule valve skid with secondary 120T crawler.',
        resourceBottleneck: 'Liebherr LTM 1500-8.1 500T Crane Dual Allocation',
        historicalComparison: 'Columns exceeding 45m height in coastal zones show 72% probability of wind-related rigging hold during afternoon thermal windows.',
        lastReportedDate: '2026-08-28'
      },
      {
        id: 'risk-ele-001',
        activityId: 'act-l4-ele-001',
        activity_id: 'L4-ELE-001',
        name: 'Main Substation GIS 33kV Cable Tray & Pulling',
        discipline: 'ELECTRICAL',
        area: 'Electrical Substation SS-01',
        wbs_level: 'L4',
        plannedProgress: 60,
        actualProgress: 45,
        progressDelta: -15,
        plannedStart: '2026-08-01',
        plannedFinish: '2026-08-31',
        forecastFinish: '2026-09-04',
        slippageDays: 4,
        criticalPath: false,
        riskLevel: 'HIGH',
        riskScore: 68,
        velocityTrend: 'DECELERATING',
        aiRootCause: 'Genie SX-180 boom lift offline for hydraulic cylinder servicing; crew relying on manual scaffolding for overhead tray fastening.',
        aiMitigation: 'Expedite replacement cylinder delivery (ETA 3 hrs) and add auxiliary mobile scissor lift from West Warehouse.',
        resourceBottleneck: 'Genie SX-180 Aerial Lift (In Maintenance)',
        historicalComparison: 'Manual scaffolding substitution on high cable tray routing reduces pulling velocity by 38% compared to aerial boom access.',
        lastReportedDate: '2026-08-26'
      },
      {
        id: 'risk-civ-001',
        activityId: 'act-l4-civ-001',
        activity_id: 'L4-CIV-001',
        name: 'Compressor House Foundation Mass Concreting',
        discipline: 'CIVIL',
        area: 'Compressor Yard',
        wbs_level: 'L4',
        plannedProgress: 85,
        actualProgress: 70,
        progressDelta: -15,
        plannedStart: '2026-07-20',
        plannedFinish: '2026-08-25',
        forecastFinish: '2026-08-29',
        slippageDays: 4,
        criticalPath: false,
        riskLevel: 'MEDIUM',
        riskScore: 54,
        velocityTrend: 'STABLE',
        aiRootCause: 'High heat curing requirements restricted pour rate to nighttime intervals; thermal probe monitoring verified satisfactory gradient.',
        aiMitigation: 'Maintain continuous chilled water curing blanket; schedule final compressor pedestal pour for night shift Aug 29.',
        resourceBottleneck: 'Batching Plant Chilled Water Tanker Capacity',
        historicalComparison: 'Mass foundation pours above 400m³ in Q3 consistently require 18% thermal management buffer.',
        lastReportedDate: '2026-08-25'
      },
      {
        id: 'risk-ins-002',
        activityId: 'act-l5-ins-002',
        activity_id: 'L5-INS-002',
        name: 'Control Valve Staging & Smart Positioner Setup',
        discipline: 'INSTRUMENTATION',
        area: 'Process Unit 1 - Rack 101',
        wbs_level: 'L5',
        plannedProgress: 40,
        actualProgress: 35,
        progressDelta: -5,
        plannedStart: '2026-08-18',
        plannedFinish: '2026-09-10',
        forecastFinish: '2026-09-12',
        slippageDays: 2,
        criticalPath: false,
        riskLevel: 'LOW',
        riskScore: 32,
        velocityTrend: 'ACCELERATING',
        aiRootCause: 'Minor delay in vendor documentation for HART protocol configuration firmware; bench calibration progressing smoothly.',
        aiMitigation: 'Download signed firmware profile directly from Emerson FieldCare portal.',
        resourceBottleneck: 'None - Crew fully staffed',
        historicalComparison: 'Instrument calibration typically accelerates by 25% once pre-loop check benches are established.',
        lastReportedDate: '2026-08-28'
      }
    ];

    return analyses;
  }
}

export const db = new InMemoryDatabase();
