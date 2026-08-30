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
  Check
} from 'lucide-react';
import { Project, UserProfile, ExecutionEvent } from '../types.ts';
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
  structuredEvent?: {
    activityName: string;
    eventType: string;
    quantity: number;
    unit: string;
    area: string;
    discipline: string;
    confidence: number;
    evidenceSnippet: string;
    confirmed?: boolean;
  };
}

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
      text: `Hello ${currentUser?.name || 'Supervisor'}! I am the SitePulse Time Agent. You can report daily site progress in natural language (e.g., "Field welding on Line 24 started at 10:30 in Area B"). I will parse the attributes and link them to the project WBS.`,
      timestamp: '08:00 AM'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [confirmingMsgId, setConfirmingMsgId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const quickPrompts = [
    'Line 24 welding started at 10:30 in Area B.',
    'Spool erection completed in Area A. 18 spools installed.',
    'Pump foundation preparation 65% in Area A.',
    'Cable pulling 450 meters finished in Substation A.'
  ];

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
      const response = await api.sendTimeAgentMessage(project.id, text);
      
      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        structuredEvent: response.extractedEvent
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          text: `Sorry, error processing message: ${e.message}`,
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

      setSuccessBanner(`Execution event "${eventData.activityName}" saved and matched into Review Queue!`);
      setTimeout(() => setSuccessBanner(null), 4000);
      onRefreshData();
    } catch (err: any) {
      alert(`Confirmation error: ${err.message}`);
    } finally {
      setConfirmingMsgId(null);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquareCode className="w-5 h-5 text-indigo-600" />
            <span>SitePulse Time Agent</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Conversational field progress logging for supervisors, foremen, and field engineers.
          </p>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-mono font-semibold text-emerald-700">ONLINE</span>
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => onNavigate('review')}
            className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>View in Review Queue</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 text-[11px] font-semibold whitespace-nowrap">Suggested logs:</span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50/60 border border-slate-200 text-slate-700 hover:text-indigo-600 whitespace-nowrap transition-colors shadow-xs"
          >
            "{qp}"
          </button>
        ))}
      </div>

      {/* Chat Conversation Box */}
      <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-[520px] shadow-sm overflow-hidden">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map(msg => {
            const isAgent = msg.sender === 'agent';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAgent ? 'justify-start' : 'justify-end'}`}
              >
                {isAgent && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-xl space-y-2 ${isAgent ? 'text-left' : 'text-right'}`}>
                  <div className={`inline-block p-3.5 rounded-xl text-xs ${
                    isAgent
                      ? 'bg-white text-slate-800 border border-slate-200 shadow-xs'
                      : 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                  }`}>
                    <p className="leading-relaxed">{msg.text}</p>
                    <div className={`text-[9px] mt-1.5 ${isAgent ? 'text-slate-400' : 'text-indigo-100'}`}>
                      {msg.timestamp}
                    </div>
                  </div>

                  {/* Structured Extracted Event Card */}
                  {msg.structuredEvent && (
                    <div className="p-4 rounded-xl bg-white border border-indigo-200 text-left text-xs space-y-3 shadow-md">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-bold text-indigo-700 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          <span>Structured Event Extracted</span>
                        </span>
                        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                          {Math.round(msg.structuredEvent.confidence * 100)}% AI Confidence
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500">Activity:</span>
                          <span className="font-semibold text-slate-800 ml-1.5">{msg.structuredEvent.activityName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Type:</span>
                          <span className="font-semibold text-slate-800 ml-1.5">{msg.structuredEvent.eventType}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Quantity:</span>
                          <span className="font-mono font-semibold text-emerald-700 ml-1.5">
                            {msg.structuredEvent.quantity} {msg.structuredEvent.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Area/Discipline:</span>
                          <span className="text-slate-700 ml-1.5">
                            {msg.structuredEvent.area} • {msg.structuredEvent.discipline}
                          </span>
                        </div>
                      </div>

                      {/* Confirmation Action */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        {msg.structuredEvent.confirmed ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                            <Check className="w-4 h-4" />
                            <span>Confirmed & Synced to Review Queue</span>
                          </div>
                        ) : (
                          <>
                            <span className="text-[11px] text-slate-500">Verify extracted attributes</span>
                            <button
                              onClick={() => handleConfirmEvent(msg.id, msg.structuredEvent)}
                              disabled={confirmingMsgId === msg.id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                            >
                              {confirmingMsgId === msg.id ? (
                                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>Confirm & Save Event</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {!isAgent && (
                  <div className="w-8 h-8 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-500 p-2 bg-white rounded-lg border border-slate-200/60 inline-flex shadow-xs">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Time Agent is analyzing and mapping to WBS...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Report progress, welds, spools, delays (e.g. 'Field welding on Line 24 started in Area B')..."
              className="flex-1 px-4 py-2.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
