'use client';

import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import {
  Send,
  Bot,
  User,
  Wrench,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Info,
  Layers,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Check,
  Cpu
} from 'lucide-react';
import { sendChatMessage, getChatHistory, resetChatSession, type ChatDraftContext } from '../lib/api';

interface ToolExecution {
  toolName: string;
  input: any;
  outputSummary: string;
  timestamp: string;
  status: 'running' | 'success' | 'error';
}

interface StructuredFinding {
  category: string;
  severity: 'critical' | 'moderate' | 'minor' | 'info';
  title: string;
  details: string;
  evidenceCitation?: string;
  recommendation?: string;
}

interface MessageAttachment {
  name: string;
  type: string;
  size: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachment?: MessageAttachment;
  activeAgent?: string;
  toolExecutions?: ToolExecution[];
  structuredFindings?: StructuredFinding[];
  timestamp: string;
}

interface AgenticChatProps {
  userRole: string;
  sessionId?: string;
  activeDraft?: ChatDraftContext;
  onActiveDraftChange?: (draft: ChatDraftContext) => void;
}

function renderInlineMarkdown(value: string): ReactNode[] {
  const tokens = value.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return tokens.map((token, index) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={index} className="font-extrabold text-white">{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return <code key={index} className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-100 border border-white/[0.1]">{token.slice(1, -1)}</code>;
    }
    const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return <a key={index} href={link[2]} target="_blank" rel="noreferrer" className="text-zinc-300 underline font-semibold hover:text-white">{link[1]}</a>;
    }
    return token;
  });
}

function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  return (
    <div className="space-y-2 break-words">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-1" />;
        if (trimmed.startsWith('### ')) return <h4 key={index} className="pt-1.5 text-xs font-bold text-white tracking-wide">{renderInlineMarkdown(trimmed.slice(4))}</h4>;
        if (trimmed.startsWith('## ')) return <h3 key={index} className="pt-2 text-sm font-extrabold text-white tracking-tight">{renderInlineMarkdown(trimmed.slice(3))}</h3>;
        if (trimmed.startsWith('# ')) return <h2 key={index} className="pt-2 text-base font-extrabold text-white tracking-tight">{renderInlineMarkdown(trimmed.slice(2))}</h2>;
        if (/^[-*]\s+/.test(trimmed)) return (
          <div key={index} className="flex gap-2 pl-2">
            <span className="text-zinc-400 font-bold">•</span>
            <span className="leading-relaxed">{renderInlineMarkdown(trimmed.replace(/^[-*]\s+/, ''))}</span>
          </div>
        );
        if (/^\d+\.\s+/.test(trimmed)) return <div key={index} className="pl-2 leading-relaxed">{renderInlineMarkdown(trimmed)}</div>;
        return <p key={index} className="leading-relaxed">{renderInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

export const AgenticChat: React.FC<AgenticChatProps> = ({
  userRole,
  sessionId = 'session_default',
  activeDraft,
  onActiveDraftChange
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_0',
      role: 'assistant',
      content: `Hello! I am the **Inkloom AI Brand-Governance Copilot** orchestrated by LangGraph, LangChain, and Groq.
I autonomously analyze drafts and multi-modal creative assets across:
* **Brand Policy Investigation** (tone drift, banned lexicon, trademark casing)
* **Factual Benchmark Verification** (grounding claims against verified fact vectors)
* **Vision & Accessibility Analysis** (Pillow palette extraction & W3C WCAG 2.1 relative luminance)
* **Surgical Diff Rewrites** (intent-preserving patch recommendations)

You can ask me questions, test promotional claims, or upload documents and creative assets directly!`,
      activeAgent: 'Master Orchestrator',
      timestamp: new Date().toISOString()
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAgentStatus, setActiveAgentStatus] = useState<string>('Master Orchestrator');
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadHistory = async () => {
    try {
      const res = await getChatHistory(sessionId);
      if (res.success && res.messages && res.messages.length > 0) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.warn('Failed to load chat history:', err);
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if ((!textToSend && !attachedFile) || loading) return;

    const currentFile = attachedFile;
    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend || `[Attached File: ${currentFile?.name}]`,
      attachment: currentFile
        ? {
            name: currentFile.name,
            type: currentFile.type || 'file',
            size: currentFile.size
          }
        : undefined,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAttachedFile(null);
    setLoading(true);
    setActiveAgentStatus('Orchestrator Planning & Selecting Specialized Tools...');

    try {
      const res = await sendChatMessage(textToSend, sessionId, userRole, currentFile, activeDraft);
      if (res.success) {
        if (res.activeDraft?.contentId) onActiveDraftChange?.(res.activeDraft);
        const assistantMsg: Message = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: res.response,
          activeAgent: res.activeAgent || 'Master Orchestrator',
          toolExecutions: res.toolExecutions || [],
          structuredFindings: res.structuredFindings || [],
          timestamp: new Date().toISOString()
        };

        setActiveAgentStatus(res.activeAgent || 'Master Orchestrator');
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errorMsg: Message = {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Execution Error**: ${res.error || 'Failed to complete agent workflow.'}`,
          activeAgent: 'System Guardian',
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Connection Notice**: ${err.message}. Please ensure the Inkloom backend server is active on port 4000.`,
        activeAgent: 'System Guardian',
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetChatSession(sessionId);
      setMessages([
        {
          id: `welcome_${Date.now()}`,
          role: 'assistant',
          content: 'Session reset. Brand Knowledge Base and verified benchmark vectors reloaded. How can I assist your compliance workflow today?',
          activeAgent: 'Master Orchestrator',
          timestamp: new Date().toISOString()
        }
      ]);
      setActiveAgentStatus('Master Orchestrator');
    } catch (err) {
      console.error('Failed to reset session:', err);
    }
  };

  const toggleToolExpand = (msgId: string) => {
    setExpandedTools((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const quickPrompts = [
    'Audit this copy: "We are thrilled to announce InkLoom, the cheap tool with zero latency and 100% infallible compliance."',
    'Verify if the claim "fastest platform in the world with zero latency" is substantiated by company benchmarks.',
    'Check WCAG contrast between Midnight Navy (#0F172A) and Canvas (#FFFFFF).',
    'Which brand guidelines currently have high creator ambiguity friction?'
  ];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative titanium-panel rounded-2xl overflow-hidden flex flex-col min-h-[640px] h-[min(780px,calc(100vh-9rem))] shadow-2xl transition-all duration-300 ${
        isDragging ? 'border-white bg-[#1a1b24]' : ''
      }`}
    >
      {/* Header & Agent Status Bar */}
      <div className="px-5 py-4 border-b border-white/[0.08] bg-[#121319] flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600/70 text-white shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Agentic AI Brand Guardian</h3>
              <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                LangGraph + Groq
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center space-x-2 mt-0.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Active Agent: <strong className="text-white font-bold">{activeAgentStatus}</strong>
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="charcoal-btn text-xs px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
          title="Reset Conversation Session"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-semibold">Reset Session</span>
        </button>
      </div>

      {/* Message Feed */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#0c0d12]/60">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const hasTools = msg.toolExecutions && msg.toolExecutions.length > 0;
          const hasFindings = msg.structuredFindings && msg.structuredFindings.length > 0;
          const isExpanded = expandedTools[msg.id];

          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] md:max-w-[78%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Author Label */}
                <div className={`flex items-center space-x-2 text-[11px] text-zinc-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {isUser ? (
                    <>
                      <span className="font-semibold text-zinc-300">You ({userRole})</span>
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                    </>
                  ) : (
                    <>
                      <Bot className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-bold text-white">{msg.activeAgent || 'Brand Guardian'}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Message Bubble in Titanium Palette */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-xs leading-relaxed shadow-lg ${
                    isUser
                      ? 'bg-gradient-to-b from-[#2b2d39] to-[#1c1d25] text-white rounded-tr-none border border-white/[0.15] shadow-md'
                      : 'bg-[#121319] border border-white/[0.08] text-zinc-200 rounded-tl-none space-y-3.5 shadow-md'
                  }`}
                >
                  {/* Attached File Card */}
                  {msg.attachment && (
                    <div className="flex items-center space-x-2.5 rounded-xl border border-white/[0.1] bg-[#0c0d12] p-2.5 text-xs">
                      {msg.attachment.type.includes('image') ? (
                        <ImageIcon className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="font-semibold text-white truncate">{msg.attachment.name}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          {(msg.attachment.size / 1024).toFixed(1)} KB • {msg.attachment.type}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tool Execution Transparency Accordion */}
                  {!isUser && hasTools && (
                    <div className="bg-[#0b0c10] border border-white/[0.08] rounded-xl p-3 space-y-2">
                      <button
                        onClick={() => toggleToolExpand(msg.id)}
                        className="w-full flex items-center justify-between text-[11px] text-zinc-300 hover:text-white font-mono cursor-pointer"
                      >
                        <span className="flex items-center space-x-2 text-zinc-300 font-semibold">
                          <Wrench className="w-3.5 h-3.5" />
                          <span>{msg.toolExecutions!.length} Tool Call{msg.toolExecutions!.length > 1 ? 's' : ''} Executed</span>
                        </span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
                      </button>

                      {isExpanded && (
                        <div className="space-y-2 pt-2 border-t border-white/[0.06] text-[10px] font-mono">
                          {msg.toolExecutions!.map((exec, idx) => (
                            <div key={idx} className="bg-[#14151c] p-2.5 rounded-lg border border-white/[0.04] space-y-1">
                              <div className="flex items-center justify-between text-zinc-200 font-bold">
                                <span>🔧 {exec.toolName}</span>
                                <span className="text-emerald-400 uppercase">{exec.status}</span>
                              </div>
                              <p className="text-zinc-400 leading-normal">{exec.outputSummary}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  <MarkdownMessage content={msg.content} />

                  {/* Structured Findings Cards */}
                  {!isUser && hasFindings && (
                    <div className="pt-3 border-t border-white/[0.08] space-y-2.5">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider flex items-center space-x-1.5 font-bold">
                        <Layers className="w-3 h-3 text-zinc-400" />
                        <span>Structured Governance Findings:</span>
                      </span>

                      <div className="grid grid-cols-1 gap-2.5">
                        {msg.structuredFindings!.map((f, i) => (
                          <div
                            key={i}
                            className={`titanium-card p-3 rounded-xl border text-[11px] space-y-1.5 ${
                              f.severity === 'critical'
                                ? 'border-rose-500/40 bg-[#1c1215] text-rose-200'
                                : f.severity === 'moderate'
                                ? 'border-amber-500/40 bg-[#1e1712] text-amber-200'
                                : 'bg-[#14151c] border-white/[0.08] text-zinc-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-xs">{f.title}</span>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold bg-zinc-900 border border-zinc-700">
                                {f.severity}
                              </span>
                            </div>
                            <p className="text-zinc-300 text-[11px] leading-relaxed">{f.details}</p>
                            {f.evidenceCitation && (
                              <p className="text-[10px] text-zinc-400 font-mono">
                                📌 {f.evidenceCitation}
                              </p>
                            )}
                            {f.recommendation && (
                              <div className="pt-1.5 border-t border-white/[0.08] space-y-2">
                                <p className="text-[10px] text-emerald-400 font-semibold">
                                  💡 Suggestion: {f.recommendation}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleSend(`Apply this recommendation to the active draft: ${f.recommendation}`)}
                                  disabled={loading}
                                  className="silver-btn text-[10px] font-bold px-3 py-1 rounded-lg cursor-pointer"
                                >
                                  Accept & apply recommendation
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="titanium-card border border-white/[0.1] p-4 rounded-2xl rounded-tl-none max-w-md space-y-2 shadow-xl">
              <div className="flex items-center space-x-2 text-xs text-zinc-200 font-mono font-semibold">
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>{activeAgentStatus}</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Evaluating state graph, invoking registered LangChain tools, and querying verified facts...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Action Chips */}
      <div className="px-5 py-2.5 bg-[#121319] border-t border-white/[0.08] flex items-center space-x-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 whitespace-nowrap">
          Quick Prompts:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="charcoal-btn whitespace-nowrap px-3.5 py-1.5 rounded-full text-[11px] font-medium transition cursor-pointer disabled:opacity-50"
          >
            {prompt.length > 50 ? `${prompt.substring(0, 48)}...` : prompt}
          </button>
        ))}
      </div>

      {/* File Attachment Preview Bar */}
      {attachedFile && (
        <div className="px-5 py-2 bg-[#181920] border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-200">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-zinc-400" />
            <span className="font-bold font-mono text-white">{attachedFile.name}</span>
            <span className="text-[10px] text-zinc-400 font-mono">
              ({(attachedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            onClick={() => setAttachedFile(null)}
            className="text-zinc-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Box with Attachment Button */}
      <div className="p-4 bg-[#101116] border-t border-white/[0.08]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          {/* Hidden File Input for Attachment */}
          <input
            ref={chatFileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
            onChange={handleChatFileSelect}
            className="hidden"
          />

          {/* Attachment Paperclip Button */}
          <button
            type="button"
            onClick={() => chatFileInputRef.current?.click()}
            disabled={loading}
            className="charcoal-btn p-2.5 rounded-xl cursor-pointer disabled:opacity-50"
            title="Attach document or creative image"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={
              attachedFile
                ? `Attached "${attachedFile.name}" — Type instructions or press Send...`
                : 'Ask anything about brand guidelines, verify claims, check WCAG contrast, or audit copy...'
            }
            className="flex-1 bg-[#0c0d12] border border-white/[0.08] rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-zinc-400 transition disabled:opacity-50 shadow-inner"
          />

          <button
            type="submit"
            disabled={(!input.trim() && !attachedFile) || loading}
            className="silver-btn p-3 rounded-xl cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
