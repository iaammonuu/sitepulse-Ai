import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import { parseDocumentWithGemini } from './server/geminiService.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ================= API ROUTES (FIRST) =================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Users & Roles
  app.get('/api/v1/users', (req, res) => {
    res.json({ users: db.getUsers(), currentUser: db.getCurrentUser() });
  });

  app.get('/api/v1/users/current', (req, res) => {
    res.json(db.getCurrentUser());
  });

  app.post('/api/v1/users/current', (req, res) => {
    const { userId } = req.body;
    const updated = db.setCurrentUser(userId);
    res.json(updated);
  });

  // Notifications
  app.get('/api/v1/notifications', (req, res) => {
    res.json(db.getNotifications());
  });

  app.post('/api/v1/notifications/:id/read', (req, res) => {
    db.markNotificationAsRead(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/v1/notifications/read-all', (req, res) => {
    db.markAllNotificationsAsRead();
    res.json({ success: true });
  });

  // Global Search
  app.get('/api/v1/search', (req, res) => {
    const query = (req.query.q as string) || '';
    const projectId = (req.query.projectId as string) || 'proj-pep-001';
    const results = db.searchAll(projectId, query);
    res.json(results);
  });

  // Demo Reset & Seed
  app.post('/api/v1/demo/reset', (req, res) => {
    db.reset();
    res.json({ success: true, message: 'Demo data successfully reset to baseline initial state.' });
  });

  app.post('/api/v1/demo/seed', (req, res) => {
    db.seed();
    res.json({ success: true, message: 'Demo data re-seeded successfully.' });
  });

  // Projects
  app.get('/api/v1/projects', (req, res) => {
    res.json(db.getProjects());
  });

  app.get('/api/v1/projects/:id', (req, res) => {
    const project = db.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  });

  // Dashboard metrics
  app.get('/api/v1/projects/:id/dashboard', (req, res) => {
    const metrics = db.getDashboardMetrics(req.params.id);
    res.json(metrics);
  });

  // Activities (L1-L6)
  app.get('/api/v1/projects/:id/activities', (req, res) => {
    const { discipline, area, status, wbs, search } = req.query;
    const activities = db.getActivities(req.params.id, {
      discipline: discipline as string,
      area: area as string,
      status: status as string,
      wbs: wbs as string,
      search: search as string
    });
    res.json(activities);
  });

  app.get('/api/v1/projects/:id/activities/:activityId', (req, res) => {
    const act = db.getActivityById(req.params.activityId);
    if (!act) return res.status(404).json({ error: 'Activity not found' });
    
    // Find related execution events and matches
    const relatedEvents = db.getExecutionEvents(req.params.id).filter(e => e.matchedActivityId === act.id);
    const relatedMatches = db.getMatches(req.params.id).filter(m => m.topCandidateActivityId === act.id || m.changedToActivityId === act.id);
    const relatedAudit = db.getAuditLogs(req.params.id).filter(a => a.entityId === act.id || a.details.includes(act.activity_id));

    res.json({
      activity: act,
      events: relatedEvents,
      matches: relatedMatches,
      auditLogs: relatedAudit
    });
  });

  // Documents & Ingestion
  app.get('/api/v1/projects/:id/documents', (req, res) => {
    res.json(db.getDocuments(req.params.id));
  });

  app.get('/api/v1/projects/:id/documents/:docId', (req, res) => {
    const doc = db.getDocumentById(req.params.docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    
    const events = db.getExecutionEvents(req.params.id).filter(e => e.documentId === doc.id);
    res.json({ document: doc, extractedEvents: events });
  });

  app.post('/api/v1/projects/:id/documents', (req, res) => {
    const { filename, type, fileSize, rawContent, autoProcess } = req.body;
    const doc = db.addDocument({
      projectId: req.params.id,
      filename,
      type,
      fileSize,
      rawContent
    });

    if (autoProcess) {
      const processResult = db.processDocument(doc.id);
      return res.json({ document: processResult.document, events: processResult.events });
    }

    res.json(doc);
  });

  app.post('/api/v1/projects/:id/documents/:docId/process', async (req, res) => {
    try {
      const doc = db.getDocumentById(req.params.docId);
      if (!doc) return res.status(404).json({ error: 'Document not found' });

      // If Gemini is configured, optionally enrich with LLM
      if (doc.rawContent) {
        await parseDocumentWithGemini(doc.filename, doc.rawContent);
      }

      const result = db.processDocument(req.params.docId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Processing failed' });
    }
  });

  app.delete('/api/v1/projects/:id/documents/:docId', (req, res) => {
    const success = db.deleteDocument(req.params.docId);
    if (!success) return res.status(404).json({ error: 'Document not found' });
    res.json({ success: true });
  });

  // Execution Events
  app.get('/api/v1/projects/:id/execution-events', (req, res) => {
    res.json(db.getExecutionEvents(req.params.id));
  });

  // Matches & Review Queue
  app.get('/api/v1/projects/:id/matches', (req, res) => {
    const { status } = req.query;
    res.json(db.getMatches(req.params.id, status as string));
  });

  app.get('/api/v1/projects/:id/matches/:matchId', (req, res) => {
    const match = db.getMatchById(req.params.matchId);
    if (!match) return res.status(404).json({ error: 'Match record not found' });
    const event = db.getExecutionEvents(match.projectId).find(e => e.id === match.executionEventId);
    const candidateActivity = match.topCandidateActivityId ? db.getActivityById(match.topCandidateActivityId) : null;
    res.json({ match, event, candidateActivity });
  });

  app.post('/api/v1/projects/:id/matches/:matchId/approve', (req, res) => {
    try {
      const { verifiedBy, reason } = req.body;
      const result = db.approveMatch(req.params.matchId, verifiedBy, reason);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Approval failed' });
    }
  });

  app.post('/api/v1/projects/:id/matches/:matchId/reject', (req, res) => {
    try {
      const { reason } = req.body;
      if (!reason) return res.status(400).json({ error: 'Rejection reason is required' });
      const result = db.rejectMatch(req.params.matchId, reason);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Rejection failed' });
    }
  });

  app.post('/api/v1/projects/:id/matches/:matchId/change', (req, res) => {
    try {
      const { newActivityId, reason } = req.body;
      if (!newActivityId) return res.status(400).json({ error: 'Replacement activity is required' });
      if (!reason) return res.status(400).json({ error: 'Remap reason is required' });
      const result = db.changeMatch(req.params.matchId, newActivityId, reason);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Change failed' });
    }
  });

  app.post('/api/v1/projects/:id/matches/:matchId/mark-new', (req, res) => {
    try {
      const { description, discipline, area, reason } = req.body;
      if (!description || !discipline || !area || !reason) {
        return res.status(400).json({ error: 'Description, discipline, area, and reason are required' });
      }
      const result = db.markNewActivity(req.params.matchId, { description, discipline, area, reason });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Proposal failed' });
    }
  });

  // Time Agent Chat & Event Creation
  app.post('/api/v1/projects/:id/time-agent/chat', (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message cannot be empty' });
    const result = db.processTimeAgentMessage(req.params.id, message);
    res.json(result);
  });

  app.post('/api/v1/projects/:id/time-agent/events', (req, res) => {
    try {
      const { eventData } = req.body;
      const created = db.confirmTimeAgentEvent(req.params.id, eventData);
      res.json({ success: true, event: created });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Event confirmation failed' });
    }
  });

  // Audit Logs
  app.get('/api/v1/projects/:id/audit', (req, res) => {
    const { user, action, search } = req.query;
    res.json(db.getAuditLogs(req.params.id, {
      user: user as string,
      action: action as string,
      search: search as string
    }));
  });

  // Institutional Memory
  app.get('/api/v1/projects/:id/memory', (req, res) => {
    res.json(db.getInstitutionalMemory(req.params.id));
  });

  // Resource Allocation & Clashes
  app.get('/api/v1/resources/crews', (req, res) => {
    const { discipline, status, shift, wbsLevel, search } = req.query;
    res.json(db.getCrews({
      discipline: discipline as string,
      status: status as string,
      shift: shift as string,
      wbsLevel: wbsLevel as string,
      search: search as string
    }));
  });

  app.get('/api/v1/resources/equipment', (req, res) => {
    const { category, discipline, status, wbsLevel, search } = req.query;
    res.json(db.getEquipment({
      category: category as string,
      discipline: discipline as string,
      status: status as string,
      wbsLevel: wbsLevel as string,
      search: search as string
    }));
  });

  app.get('/api/v1/resources/clashes', (req, res) => {
    res.json(db.getResourceClashes());
  });

  app.get('/api/v1/resources/metrics', (req, res) => {
    res.json(db.getResourceSummaryMetrics());
  });

  app.post('/api/v1/resources/crews/:id/assign', (req, res) => {
    try {
      const { activityId, activityName, wbsLevel, area, shift } = req.body;
      const updated = db.assignCrew(req.params.id, { activityId, activityName, wbsLevel, area, shift });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Assignment failed' });
    }
  });

  app.post('/api/v1/resources/equipment/:id/assign', (req, res) => {
    try {
      const { activityId, activityName, wbsLevel, area } = req.body;
      const updated = db.assignEquipment(req.params.id, { activityId, activityName, wbsLevel, area });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Equipment assignment failed' });
    }
  });

  app.post('/api/v1/resources/clashes/:id/resolve', (req, res) => {
    try {
      const { resolutionAction } = req.body;
      const result = db.resolveClash(req.params.id, resolutionAction || 'Manually reconciled and scheduled in PMIS.');
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Resolution failed' });
    }
  });

  // At-Risk Activities & AI Trajectory Analysis
  app.get('/api/v1/projects/:id/at-risk-activities', (req, res) => {
    res.json(db.getAtRiskActivities(req.params.id));
  });

  // ================= VITE MIDDLEWARE =================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SitePulse AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
