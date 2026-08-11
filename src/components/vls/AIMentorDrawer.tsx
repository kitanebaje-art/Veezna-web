// src/components/vls/AIMentorDrawer.tsx
'use client';

import React, { useState } from 'react';
import { AIMessage, AIMentorContext } from '@/types/ai';
import { sendMentorQuery } from '@/lib/ai-mentor';

interface AIMentorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  context: AIMentorContext;
}

export default function AIMentorDrawer({ isOpen, onClose, context }: AIMentorDrawerProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi ${context.studentName}! I am your Veezna AI Mentor. How can I assist you with **${context.currentLessonTitle || context.courseId}** today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: AIMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const replyText = await sendMentorQuery(updatedMessages, context);
      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: AIMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${err.message || 'I encountered an issue. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
        <div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
            VEEZNA AI
          </span>
          <h3 className="text-sm font-bold text-white">AI Mentor Workspace</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800"
        >
          ✕
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
            <span className="text-[9px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-emerald-400 animate-pulse flex items-center gap-2 p-2">
            <span>●</span> Veezna AI Mentor is thinking...
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or request practice..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl disabled:opacity-50 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}