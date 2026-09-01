import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareCode,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  RotateCw,
  User,
  Bot,
  Check,
  HelpCircle,
  TrendingUp,
  HardHat,
  Calendar,
  Copy,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Project, UserProfile, ExecutionEvent, TimeAgentChatResponse } from '../types.ts';
import { api } from '../api.ts';

interface TimeAgentViewProps {
  project: Project;
  currentUser: UserProfile | null;
  onRefreshData: () => void;
  onNavigate: (view: string, itemId?: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  intent?: 'QUESTION_ANSWER' | 'FIELD_LOG' | 'SCHEDULE_INQUIRY' | 'RESOURCE_INQUIRY' | 'RISK_INQUIRY';
  structuredEvent?: {
    activityName: string;
    eventType: string;
    quantity: number;
    unit: string;
    area: string;
    discipline: string;
    confidence: number;
    evidenceSnippet?: string;
    matchedActivityId?: string;
    matchedActivityName?: string;
    confirmed?: boolean;
  };
  suggestedFollowUps?: string[];
  relatedActivities?: Array<{
    id: string;
    activity_id: string;
    name: string;
    progress: number;
    status: string;
    area: string;
  }>;
  relevantMetrics?: Array<{
    label: string;
    value: string | number;
    badge?: string;
    trend?: 'up' | 'down' | 'neutral';
  }>;
}

type PromptCategory = 'ALL' | 'FIELD_LOG' | 'SCHEDULE_QA' | 'RESOURCES';

export const TimeAgentView: React.FC<TimeAgentViewProps> = ({
  project,
  currentUser,
  onRefreshData,
  onNavigate
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'agent',
      text: `Hello ${currentUser?.name || 'Supervisor'}! I am your **SitePulse Construction Time & Schedule Intelligence Agent**.\n\nYou can ask me anything about the **${project.name}** schedule, critical path risks, crew assignments, or report daily field progress directly in natural language.\n\nHow can I assist you today?`,
      timestamp: '08:00 AM',
      intent: 'QUESTION_ANSWER',
      suggestedFollowUps: [
        'What is the overall project status?',
        'Which activities are on the critical path?',
        'Line 24 welding started at 10:30 in Area B.',
        'Are there any active resource clashes?'
      ],
      relevantMetrics: [
        { label: 'Overall Progress', value: `${project.progress}%`, trend: 'up' },
        { label: 'Pending Verification', value: `${project.pendingReviewsCount} items`, badge: 'Review Req.' }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [confirmingMsgId, setConfirmingMsgId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>('ALL');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const promptCategories = [
    { id: 'ALL' as PromptCategory, label: 'All Topics', icon: Sparkles },
    { id: 'FIELD_LOG' as PromptCategory, label: 'Field Progress Logs', icon: Layers },
    { id: 'SCHEDULE_QA' as PromptCategory, label: 'Schedule & Delays Q&A', icon: Calendar },
    { id: 'RESOURCES' as PromptCategory, label: 'Crews & Clashes', icon: HardHat }
  ];

  const quickPromptsMap: Record<PromptCategory, string[]> = {
    ALL: [
      'What is the overall project status?',
      'Line 24 welding started at 10:30 in Area B.',
      'Which activities are on the critical path?',
      'Spool erection completed in Area A. 18 spools installed.',
      'Are there any active resource clashes?'
    ],
    FIELD_LOG: [
      'Line 24 welding started at 10:30 in Area B.',
      'Spool erection completed in Area A. 18 spools installed.',
      'Pump foundation preparation 65% in Area A.',
      'Cable pulling 450 meters finished in Substation A.'
    ],
    SCHEDULE_QA: [
      'What is the overall project status?',
      'What activities have slippage risks?',
      'Which activities are on the critical path?',
      'What is the status of Spool Erection?',
      'Show progress on Line 24 welding'
    ],
    RESOURCES: [
      'Are there any active resource clashes?',
      'Check Welder Gang 2 allocation',
      'What is the crane utilization in Area A?',
      'Show active crew deployment breakdown'
    ]
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const userMsgId = `user-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    try {
      const response: TimeAgentChatResponse = await api.sendTimeAgentMessage(project.id, text);
      
      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: response.intent,
        structuredEvent: response.extractedEvent,
        suggestedFollowUps: response.suggestedFollowUps,
        relatedActivities: response.relatedActivities,
        relevantMetrics: response.relevantMetrics
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          text: `⚠️ Error processing query: ${e.message}. Please try again or rephrase your question.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmEvent = async (msgId: string, eventData: any) => {
    setConfirmingMsgId(msgId);
    try {
      await api.confirmTimeAgentEvent(project.id, eventData);
      
      setMessages(prev => prev.map(m => {
        if (m.id === msgId && m.structuredEvent) {
          return {
            ...m,
            structuredEvent: { ...m.structuredEvent, confirmed: true }
          };
        }
        return m;
      }));

      setSuccessBanner(`Execution event "${eventData.activityName}" confirmed and linked into Review Queue!`);
      setTimeout(() => setSuccessBanner(null), 5000);
      onRefreshData();
    } catch (err: any) {
      alert(`Confirmation error: ${err.message}`);
    } finally {
      setConfirmingMsgId(null);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'msg-reset',
        sender: 'agent',
        text: `Chat reset. Ask any question regarding the **${project.name}** schedule, risks, or log site progress.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: 'QUESTION_ANSWER',
        suggestedFollowUps: [
          'What is the overall project status?',
          'Which activities are on the critical path?',
          'Line 24 welding started at 10:30 in Area B.'
        ]
      }
    ]);
  };

  // Rich formatted text renderer with markdown highlights
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-xs">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('* ');
          const isHeading = trimmed.startsWith('#') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 50);

          let parsedLine = trimmed;
          if (isBullet) {
            parsedLine = trimmed.replace(/^[•\-*]\s*/, '');
          }

          // Format tokens: bold (**text**), code (`text`), italic (*text*)
          const parts = parsedLine.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

          const formattedParts = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code key={pIdx} className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-indigo-700 font-semibold border border-slate-200">
                  {part.slice(1, -1)}
                </code>
              );
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return <em key={pIdx} className="text-slate-600 italic">{part.slice(1, -1)}</em>;
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5">
                <span className="text-indigo-500 font-bold mt-0.5">•</span>
                <div className="flex-1 text-slate-800">{formattedParts}</div>
              </div>
            );
          }

          if (isHeading) {
            return (
              <div key={idx} className="font-bold text-slate-900 text-[13px] pt-1 text-indigo-950">
                {formattedParts}
              </div>
            );
          }

          return (
            <p key={idx} className="text-slate-800">
              {formattedParts}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div id="time-agent-root-container" className="space-y-4 w-full">
      
      {/* Header */}
      <div id="time-agent-header-card" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                SitePulse Time & Schedule Agent
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                EPC INTEL
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ask construction schedule queries, inspect critical path delays, or report site progress in natural language.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-mono font-semibold text-emerald-700">ONLINE</span>
          </div>
          <button
            onClick={handleClearChat}
            title="Reset Conversation"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button
            onClick={() => onNavigate('review')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View in Review Queue</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Categorized Quick Suggestions */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {promptCategories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold whitespace-nowrap pl-1">Suggested:</span>
          {quickPromptsMap[selectedCategory].map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp)}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50/70 border border-slate-200 text-slate-700 hover:text-indigo-700 whitespace-nowrap transition-colors shadow-2xs hover:border-indigo-200 active:scale-98"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Conversation Box */}
      <div id="time-agent-chat-box" className="bg-white rounded-xl border border-slate-200 flex flex-col h-[540px] shadow-sm overflow-hidden">
        
        {/* Messages Scroll Area */}
        <div id="time-agent-messages-container" className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60">
          {messages.map(msg => {
            const isAgent = msg.sender === 'agent';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAgent ? 'justify-start' : 'justify-end'}`}
              >
                {isAgent && (
                  <div className="w-8 h-8 rounded-lg bg-white border border-indigo-200 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-2xl space-y-2.5 ${isAgent ? 'text-left' : 'text-right'}`}>
                  
                  {/* Primary Message Bubble */}
                  <div className={`inline-block p-4 rounded-xl text-xs ${
                    isAgent
                      ? 'bg-white text-slate-800 border border-slate-200/90 shadow-xs'
                      : 'bg-indigo-600 text-white rounded-br-none shadow-sm font-medium'
                  }`}>
                    {isAgent ? (
                      renderFormattedContent(msg.text)
                    ) : (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {/* Metadata & Actions */}
                    <div className={`flex items-center justify-between gap-4 mt-2.5 pt-2 border-t text-[10px] ${
                      isAgent ? 'border-slate-100 text-slate-400' : 'border-indigo-500/50 text-indigo-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span>{msg.timestamp}</span>
                        {msg.intent && isAgent && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[9px] text-slate-600 border border-slate-200 font-medium">
                            {msg.intent}
                          </span>
                        )}
                      </div>

                      {isAgent && (
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="hover:text-slate-700 flex items-center gap-1 transition-colors"
                          title="Copy message"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Relevant Metrics Highlights */}
                  {msg.relevantMetrics && msg.relevantMetrics.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
                      {msg.relevantMetrics.map((met, mIdx) => (
                        <div key={mIdx} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                          <div className="text-[10px] text-slate-500 font-medium">{met.label}</div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-sm font-bold text-slate-900">{met.value}</div>
                            {met.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {met.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Related Schedule Activities Cards */}
                  {msg.relatedActivities && msg.relatedActivities.length > 0 && (
                    <div className="space-y-1.5 text-left">
                      <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-500" />
                        <span>Referenced Schedule Activities:</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {msg.relatedActivities.map((act) => (
                          <div
                            key={act.id}
                            className="bg-white p-3 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                  {act.activity_id}
                                </span>
                                <span className="text-xs font-semibold text-slate-800 truncate">{act.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                                <span>Area: <strong className="text-slate-700">{act.area}</strong></span>
                                <span>•</span>
                                <span>Progress: <strong className="text-slate-700">{act.progress}%</strong></span>
                                <span>•</span>
                                <span className="text-emerald-700 font-medium">{act.status}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => onNavigate('schedule', act.id)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 text-[11px] font-medium flex items-center gap-1 flex-shrink-0 transition-colors"
                            >
                              <span>View Schedule</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structured Extracted Event Card */}
                  {msg.structuredEvent && (
                    <div className="p-4 rounded-xl bg-white border border-indigo-200 text-left text-xs space-y-3 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Layers className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-slate-900">Structured Execution Event Extracted</span>
                        </div>
                        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                          {Math.round(msg.structuredEvent.confidence * 100)}% Match Confidence
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Reported Activity</span>
                          <span className="font-semibold text-slate-900 mt-0.5 block">{msg.structuredEvent.activityName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Event Type</span>
                          <span className="font-semibold text-slate-900 mt-0.5 block">{msg.structuredEvent.eventType}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Quantity & Unit</span>
                          <span className="font-mono font-bold text-emerald-700 mt-0.5 block">
                            {msg.structuredEvent.quantity} {msg.structuredEvent.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Area / Discipline</span>
                          <span className="text-slate-700 font-medium mt-0.5 block">
                            {msg.structuredEvent.area} • {msg.structuredEvent.discipline}
                          </span>
                        </div>
                        {msg.structuredEvent.matchedActivityName && (
                          <div className="col-span-2 pt-1 border-t border-slate-100">
                            <span className="text-slate-400 block text-[10px]">Target WBS Schedule Activity</span>
                            <span className="font-mono text-[11px] font-semibold text-indigo-700 mt-0.5 block">
                              {msg.structuredEvent.matchedActivityName}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Confirmation Action */}
                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        {msg.structuredEvent.confirmed ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs py-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Confirmed & Synced to Review Queue</span>
                          </div>
                        ) : (
                          <>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                              <span>Supervisor verification required</span>
                            </span>
                            <button
                              onClick={() => handleConfirmEvent(msg.id, msg.structuredEvent)}
                              disabled={confirmingMsgId === msg.id}
                              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                            >
                              {confirmingMsgId === msg.id ? (
                                <>
                                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Syncing...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Confirm & Save Event</span>
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-up Buttons */}
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && isAgent && (
                    <div className="space-y-1 pt-1 text-left">
                      <div className="text-[10px] font-semibold text-slate-400">Suggested Follow-ups:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedFollowUps.map((followUp, fIdx) => (
                          <button
                            key={fIdx}
                            onClick={() => handleSendMessage(followUp)}
                            className="px-2.5 py-1 rounded-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-[11px] transition-colors shadow-2xs"
                          >
                            + {followUp}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {!isAgent && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-900 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2.5 text-xs text-slate-600 p-3 bg-white rounded-xl border border-indigo-100 inline-flex shadow-xs animate-in fade-in">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Analyzing EPC schedule, critical path, and WBS mapping...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div id="time-agent-input-bar" className="p-3.5 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask schedule/delay questions or log field progress (e.g., 'What is delayed?' or 'Welding Line 24 in Area B')..."
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
            <span>💡 Tip: Ask questions about schedule, crews, or type quantities to record site execution.</span>
            <span>Natural Language Grounded with Primavera P6</span>
          </div>
        </div>

      </div>

    </div>
  );
};
