import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  User,
  RotateCcw,
  Sparkles,
  Layers,
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  X,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Menu
} from 'lucide-react';
import { Project, UserProfile, AppNotification } from '../types.ts';
import { api } from '../api.ts';

interface NavbarProps {
  currentProject: Project | null;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  currentUser: UserProfile | null;
  onSelectUser: (userId: string) => void;
  users: UserProfile[];
  onOpenResetModal: () => void;
  onOpenDemoStory: () => void;
  onOpenGlossary: () => void;
  onNavigate: (view: string, itemId?: string) => void;
  notifications: AppNotification[];
  onRefreshData: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProject,
  projects = [],
  onSelectProject,
  currentUser,
  onSelectUser,
  users = [],
  onOpenResetModal,
  onOpenDemoStory,
  onOpenGlossary,
  onNavigate,
  notifications = [],
  onRefreshData,
  isMobileMenuOpen = false,
  onToggleMobileMenu
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    projects: Project[];
    activities: any[];
    documents: any[];
    events: any[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const safeProjects = projects || [];
  const safeUsers = users || [];
  const safeNotifications = notifications || [];

  const searchRef = useRef<HTMLDivElement>(null);
  const unreadCount = safeNotifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }
    setIsSearching(true);
    setShowSearchDropdown(true);
    try {
      if (currentProject) {
        const res = await api.search(currentProject.id, q);
        setSearchResults(res);
      }
    } catch (e) {
      console.error('Search error', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (type: string, id: string) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    if (type === 'activity') {
      onNavigate('activities', id);
    } else if (type === 'document') {
      onNavigate('ingestion', id);
    } else if (type === 'event') {
      onNavigate('review', id);
    } else if (type === 'project') {
      onSelectProject(id);
      onNavigate('dashboard');
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    try {
      await api.markNotificationRead(notif.id);
      onRefreshData();
    } catch (e) {
      console.error(e);
    }
    setShowNotifDropdown(false);
    onNavigate(notif.linkTarget);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] text-[#0F172A] shadow-xs">
      <div className="w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand, Mobile Menu Toggle & Project Switcher */}
        <div className="flex items-center gap-2 sm:gap-6">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none"
          >
            {/* Dark rounded badge with hollow white diamond outline */}
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white group-hover:bg-black transition-colors shadow-sm shrink-0">
              <svg 
                viewBox="0 0 24 24" 
                className="w-4.5 h-4.5 text-white" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <polygon 
                  points="12,3.5 20.5,12 12,20.5 3.5,12" 
                  stroke="currentColor" 
                  strokeWidth="2.8" 
                  strokeLinejoin="miter" 
                  fill="none"
                />
              </svg>
            </div>
            
            {/* SITEPULSE AI Bold Wordmark */}
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base sm:text-lg tracking-tight text-neutral-900 leading-none">
                SITEPULSE AI
              </span>
            </div>
          </div>

          {/* Project Switcher */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="max-w-[180px] truncate">
                {currentProject ? currentProject.name : 'Select Project'}
              </span>
              <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-200/70 font-mono">
                {currentProject?.code}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProjectDropdown && (
              <div className="absolute left-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Demo Project
                </div>
                {safeProjects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p.id);
                      setShowProjectDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-start justify-between gap-2 transition-colors ${
                      currentProject?.id === p.id ? 'bg-indigo-50/60 border-l-2 border-indigo-600' : ''
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.code} • {p.location}</div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-indigo-600 font-bold">
                      {p.progress}%
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Global Search Bar */}
        <div ref={searchRef} className="flex-1 max-w-md relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) setShowSearchDropdown(true);
              }}
              placeholder="Search activities, spool, welds, reports..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg bg-slate-100 border border-slate-200/80 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                  setShowSearchDropdown(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchResults && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50 p-2 text-xs">
              {isSearching ? (
                <div className="p-4 text-center text-slate-400">Searching demo datasets...</div>
              ) : (
                <>
                  {searchResults.activities.length === 0 &&
                   searchResults.documents.length === 0 &&
                   searchResults.events.length === 0 && (
                    <div className="p-4 text-center text-slate-500">
                      No matching records found for "{searchQuery}".
                    </div>
                  )}

                  {searchResults.activities.length > 0 && (
                    <div className="mb-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3 h-3" /> Schedule Activities ({searchResults.activities.length})
                      </div>
                      {searchResults.activities.map(act => (
                        <div
                          key={act.id}
                          onClick={() => handleSelectSearchResult('activity', act.id)}
                          className="px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono text-indigo-600 font-semibold">{act.activity_id}</span>
                            <span className="text-slate-700 ml-2">{act.activity_name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{act.wbs_level}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.documents.length > 0 && (
                    <div className="mb-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase text-emerald-600 tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3 h-3" /> Documents ({searchResults.documents.length})
                      </div>
                      {searchResults.documents.map(doc => (
                        <div
                          key={doc.id}
                          onClick={() => handleSelectSearchResult('document', doc.id)}
                          className="px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                        >
                          <span className="text-slate-800 font-mono">{doc.filename}</span>
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{doc.type}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.events.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-bold uppercase text-amber-600 tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3 h-3" /> Execution Events ({searchResults.events.length})
                      </div>
                      {searchResults.events.map(evt => (
                        <div
                          key={evt.id}
                          onClick={() => handleSelectSearchResult('event', evt.matchResultId || evt.id)}
                          className="px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                        >
                          <span className="text-slate-700 truncate max-w-[260px]">{evt.activityName}</span>
                          <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">
                            {Math.round(evt.confidence * 100)}% Conf
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* PMIS status pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>DEMO PMIS SYNC</span>
          </div>

          {/* Plain English Guide Button */}
          <button
            onClick={onOpenGlossary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold shadow-2xs transition-all active:scale-95"
            title="Open Plain English Dictionary & Explainer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden md:inline">Simple Guide</span>
          </button>

          {/* Interactive Demo Story Tour Button */}
          <button
            onClick={onOpenDemoStory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
            title="Open interactive 13-step guided walkthrough"
          >
            <PlayCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Demo Tour</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 relative transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-slate-800">
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">System Notifications</span>
                  <button 
                    onClick={async () => {
                      await api.markAllNotificationsRead();
                      onRefreshData();
                    }}
                    className="text-[10px] text-indigo-600 font-semibold hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {safeNotifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.read ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1 flex-shrink-0" />}
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-slate-800">{n.title}</div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                {currentUser?.name.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-slate-800 leading-none">{currentUser?.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{currentUser?.role}</div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                  Switch Demo Persona
                </div>
                {safeUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u.id);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between ${
                      currentUser?.id === u.id ? 'bg-indigo-50/60 font-semibold text-indigo-700' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-800">{u.name}</div>
                      <div className="text-[10px] text-slate-500">{u.role}</div>
                    </div>
                    {currentUser?.id === u.id && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                ))}
                
                <div className="border-t border-slate-100 mt-2 pt-2 px-2">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenResetModal();
                    }}
                    className="w-full text-left px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded flex items-center gap-2 font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Demo Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={onOpenResetModal}
            className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-500 transition-colors"
            title="Reset All Demo Data to Pristine Baseline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
