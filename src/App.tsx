import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ReviewQueueView } from './components/ReviewQueueView.tsx';
import { ScheduleView } from './components/ScheduleView.tsx';
import { IngestionView } from './components/IngestionView.tsx';
import { TimeAgentView } from './components/TimeAgentView.tsx';
import { ProgressAnalyticsView } from './components/ProgressAnalyticsView.tsx';
import { MemoryView } from './components/MemoryView.tsx';
import { AuditTrailView } from './components/AuditTrailView.tsx';
import { ProjectsView } from './components/ProjectsView.tsx';
import { TeamSettingsView } from './components/TeamSettingsView.tsx';
import { ResourceAllocationView } from './components/ResourceAllocationView.tsx';
import { UploadEvidenceModal } from './components/UploadEvidenceModal.tsx';
import { ResetDemoModal } from './components/ResetDemoModal.tsx';
import { DemoStoryModal } from './components/DemoStoryModal.tsx';
import { PlainEnglishGlossaryModal } from './components/PlainEnglishGlossaryModal.tsx';
import {
  Project,
  UserProfile,
  AppNotification,
  DashboardMetrics,
  ScheduleActivity,
  DocumentRecord,
  ExecutionEvent,
  MatchResult,
  AuditLog
} from './types.ts';
import { api } from './api.ts';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // Project specific data
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ScheduleActivity[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Navigation & Deep linking
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDemoStoryOpen, setIsDemoStoryOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  // Loading indicator
  const [loading, setLoading] = useState(true);

  // Load Initial Metadata (Projects, Users, Notifications)
  const loadInitialState = useCallback(async () => {
    try {
      const [projList, userData, notifs] = await Promise.all([
        api.getProjects(),
        api.getUsers(),
        api.getNotifications()
      ]);

      const safeProjects = Array.isArray(projList) ? projList : [];
      setProjects(safeProjects);
      setUsers(Array.isArray(userData?.users) ? userData.users : []);
      setCurrentUser(userData?.currentUser || null);
      setNotifications(Array.isArray(notifs) ? notifs : []);

      if (safeProjects.length > 0 && !currentProject) {
        setCurrentProject(safeProjects[0]);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, [currentProject]);

  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);

  // Load project-scoped data
  const loadProjectData = useCallback(async (projectId: string) => {
    try {
      const [dashMetrics, acts, docs, evts, matchResults, logs] = await Promise.all([
        api.getDashboardMetrics(projectId),
        api.getActivities(projectId),
        api.getDocuments(projectId),
        api.getExecutionEvents(projectId),
        api.getMatches(projectId),
        api.getAuditLogs(projectId)
      ]);

      setMetrics(dashMetrics || null);
      setActivities(Array.isArray(acts) ? acts : []);
      setDocuments(Array.isArray(docs) ? docs : []);
      setEvents(Array.isArray(evts) ? evts : []);
      setMatches(Array.isArray(matchResults) ? matchResults : []);
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error(`Error loading data for project ${projectId}:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentProject) {
      loadProjectData(currentProject.id);
    }
  }, [currentProject, loadProjectData]);

  const handleRefreshData = () => {
    if (currentProject) {
      loadProjectData(currentProject.id);
    }
    loadInitialState();
  };

  const handleSelectProject = (projectId: string) => {
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setCurrentProject(found);
      setSelectedItemId(null);
    }
  };

  const handleSelectUser = async (userId: string) => {
    try {
      const updated = await api.setCurrentUser(userId);
      setCurrentUser(updated);
      handleRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleNavigate = (view: string, itemId?: string) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
    if (itemId) {
      setSelectedItemId(itemId);
    } else {
      setSelectedItemId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pendingMatches = (matches || []).filter(m => m.verificationStatus === 'PENDING_REVIEW');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-900 overflow-x-hidden">
      
      {/* Top Navbar */}
      <Navbar
        currentProject={currentProject}
        projects={projects}
        onSelectProject={handleSelectProject}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        users={users}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        onOpenDemoStory={() => setIsDemoStoryOpen(true)}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onNavigate={handleNavigate}
        notifications={notifications}
        onRefreshData={handleRefreshData}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative min-w-0">
        
        {/* Left Sidebar (Desktop & Mobile Drawer) */}
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => handleNavigate(view)}
          metrics={metrics}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto max-w-5xl w-full min-w-0">
          {loading && !currentProject ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              Initializing SitePulse AI Engine...
            </div>
          ) : currentProject ? (
            <>
              {currentView === 'dashboard' && (
                <DashboardView
                  project={currentProject}
                  metrics={metrics}
                  pendingMatches={pendingMatches}
                  recentDocuments={documents}
                  onNavigate={handleNavigate}
                  onSelectMatch={(match) => handleNavigate('review', match.id)}
                  onSelectDocument={(doc) => handleNavigate('ingestion', doc.id)}
                  onRefreshData={handleRefreshData}
                  onOpenUploadModal={() => setIsUploadModalOpen(true)}
                  onOpenGlossary={() => setIsGlossaryOpen(true)}
                  onOpenDemoStory={() => setIsDemoStoryOpen(true)}
                />
              )}

              {currentView === 'projects' && (
                <ProjectsView
                  projects={projects}
                  currentProjectId={currentProject.id}
                  onSelectProject={handleSelectProject}
                  onNavigate={handleNavigate}
                />
              )}

              {currentView === 'review' && (
                <ReviewQueueView
                  project={currentProject}
                  matches={matches}
                  events={events}
                  activities={activities}
                  selectedMatchId={selectedItemId}
                  onRefreshData={handleRefreshData}
                  onNavigate={handleNavigate}
                />
              )}

              {(currentView === 'activities' || currentView === 'schedule') && (
                <ScheduleView
                  project={currentProject}
                  activities={activities}
                  selectedActivityId={selectedItemId}
                  onRefreshData={handleRefreshData}
                  onNavigate={handleNavigate}
                />
              )}

              {currentView === 'resources' && (
                <ResourceAllocationView
                  project={currentProject}
                  activities={activities}
                  onNavigate={handleNavigate}
                />
              )}

              {currentView === 'ingestion' && (
                <IngestionView
                  project={currentProject}
                  documents={documents}
                  selectedDocId={selectedItemId}
                  onRefreshData={handleRefreshData}
                  onOpenUploadModal={() => setIsUploadModalOpen(true)}
                  onNavigate={handleNavigate}
                />
              )}

              {currentView === 'time-agent' && (
                <TimeAgentView
                  project={currentProject}
                  currentUser={currentUser}
                  onRefreshData={handleRefreshData}
                  onNavigate={handleNavigate}
                />
              )}

              {(currentView === 'analytics' || currentView === 'progress') && (
                <ProgressAnalyticsView
                  project={currentProject}
                  metrics={metrics}
                  activities={activities}
                  matches={matches}
                />
              )}

              {currentView === 'memory' && (
                <MemoryView
                  project={currentProject}
                />
              )}

              {currentView === 'audit' && (
                <AuditTrailView
                  project={currentProject}
                  auditLogs={auditLogs}
                />
              )}

              {currentView === 'team' && (
                <TeamSettingsView
                  users={users}
                  currentUser={currentUser}
                  onSelectUser={handleSelectUser}
                />
              )}
            </>
          ) : null}
        </main>

      </div>

      {/* Global Modals */}
      {currentProject && (
        <UploadEvidenceModal
          projectId={currentProject.id}
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={handleRefreshData}
        />
      )}

      <ResetDemoModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={handleRefreshData}
      />

      <DemoStoryModal
        isOpen={isDemoStoryOpen}
        onClose={() => setIsDemoStoryOpen(false)}
        onNavigate={handleNavigate}
      />

      <PlainEnglishGlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        onNavigate={handleNavigate}
      />

    </div>
  );
}
