import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { calculateDashboardMetrics } from '../core/engine';
import { AppDatabaseState } from '../core/types';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  executedAction?: string | null;
  timestamp: string;
}

interface AICopilotChatbotProps {
  state: AppDatabaseState;
  isOpen: boolean;
  onToggleOpen: () => void;
  onSendMessage: (message: string) => Promise<{
    reply: string;
    executedAction?: string | null;
  }>;
}

const QUICK_PROMPTS = [
  'Show overdue tasks & DPDP blockers',
  "Mark Priya Nair's compliance runbook task complete",
  "Carry forward Rohan's overdue LangChain task into Part 2",
  'Create a High priority task for Ananya Sharma to review BFSI token budget by 2026-11-07',
];

export const AICopilotChatbot: React.FC<AICopilotChatbotProps> = ({
  state,
  isOpen,
  onToggleOpen,
  onSendMessage,
}) => {
  const metrics = calculateDashboardMetrics(state);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Namaste! I am your **SyncMind Enterprise AI Copilot**. I have live read/write access to your meetings, RAG engineering tasks, DPDP compliance blockers, and work transfers across Gurugram, Bengaluru, and Mumbai.\n\nAsk me anything or click a quick action below to update live tasks!',
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    const clean = textToSend.trim();
    if (!clean || loading) return;

    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: clean,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await onSendMessage(clean);
      const botMsg: CopilotMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        executedAction: res.executedAction || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Unable to process that request right now. Please try again.',
          timestamp: 'Now',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-40">
        {!isOpen && (
          <button
            type="button"
            onClick={onToggleOpen}
            data-testid="open-copilot-chatbot-btn"
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-all inline-flex items-center gap-2.5 text-xs font-semibold cursor-pointer border border-indigo-700"
          >
            <MessageSquare className="w-4 h-4" />
            <span>SyncMind AI Copilot</span>
            <span className="font-mono tabular-nums text-[11px] bg-black/25 px-1.5 py-0.5 rounded">
              {metrics.openTasks} open
            </span>
          </button>
        )}
      </div>

      {/* Interactive Copilot Drawer / Panel */}
      {isOpen && (
        <aside
          aria-label="SyncMind Enterprise AI Copilot Chatbot"
          data-testid="copilot-chatbot-panel"
          className="fixed bottom-5 right-5 z-50 w-[92vw] sm:w-[420px] h-[590px] max-h-[85vh] bg-white border border-slate-300 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold tracking-tight">
                  SyncMind Enterprise Copilot
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Queries &amp; updates live meetings, RAG tasks, and handovers
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleOpen}
              aria-label="Close AI Copilot"
              data-testid="close-copilot-chatbot-btn"
              className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Live Workspace Telemetry Strip */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-600 font-mono tabular-nums">
            <span>{metrics.totalMeetings} Meetings</span>
            <span aria-hidden="true">·</span>
            <span>{metrics.completedTasks}/{metrics.totalTasks} Done</span>
            <span aria-hidden="true">·</span>
            <span className="text-red-600 font-semibold">{metrics.overdueTasks} Overdue</span>
            <span aria-hidden="true">·</span>
            <span>{metrics.carriedForwardCount} Carried</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    {m.executedAction && (
                      <div
                        className="mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 font-medium flex items-center gap-1.5"
                        data-testid="copilot-executed-action-badge"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{m.executedAction}</span>
                      </div>
                    )}
                    <div className="whitespace-pre-line">{m.content.replace(/\*\*/g, '')}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono tabular-nums">
                    {m.timestamp}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>SyncMind Copilot is analyzing workspace...</span>
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>

          {/* Interactive 1-Click Action Prompts */}
          <div className="px-3.5 py-2.5 bg-white border-t border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
              1-Click Live Workspace Commands:
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSend(prompt)}
                  data-testid={`copilot-quick-prompt-${idx}`}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg text-[11px] text-slate-700 whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about tasks, or type 'Mark Priya task complete'..."
              aria-label="Ask SyncMind Enterprise AI Copilot"
              data-testid="copilot-chat-input"
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message to Copilot"
              data-testid="copilot-chat-send-btn"
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
};
