'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function StudentAICopilot({ studentClass, currentProgram }: { studentClass?: string; currentProgram?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your VEEZNA AI Copilot. Ask me anything about your coursework, assignments, or concepts!' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/student/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage, studentClass, currentProgram }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch answer');

      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Sorry, I encountered an error connecting to the knowledge base. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#0057B8] hover:bg-blue-700 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center space-x-2.5 transition-all transform hover:scale-105 active:scale-95 font-black text-sm"
        >
          <span className="text-lg">🤖</span>
          <span>Ask VEEZNA AI Copilot</span>
        </button>
      )}

      {/* Chat Window Box */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] bg-white rounded-3xl shadow-2xl border-2 border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-[#0057B8] text-white px-5 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-black text-sm tracking-wide">VEEZNA AI Study Copilot</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white font-bold text-lg focus:outline-none"
            >
              ✕
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 text-sm">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 font-medium leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#0057B8] text-white rounded-br-none shadow-md'
                      : 'bg-white text-slate-800 rounded-bl-none border-2 border-slate-200 shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-500 rounded-2xl px-4 py-2 border-2 border-slate-200 text-xs font-bold animate-pulse shadow-sm">
                  Thinking & analyzing curriculum...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t-2 border-slate-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a doubt or homework question..."
              className="flex-1 rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 font-semibold focus:bg-white focus:border-[#0057B8] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#0057B8] hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-black text-xs transition-all"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}