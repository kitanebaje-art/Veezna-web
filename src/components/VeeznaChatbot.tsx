// src/components/VeeznaChatbot.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function VeeznaChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Namaste! 👋 Main Veezna Advisor hoon. Aap kis program ya skill ke baare me janna chahte hain?',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Kuch technical samasya aayi hai. Kripya thodi der baad try karein.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network issue. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-96 max-w-[calc(100vw-2rem)] h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0057B8] to-[#002855] p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-amber-400 border border-white/20">
                V
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight text-white">Veezna Course Advisor</h3>
                <p className="text-[11px] text-blue-200 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online Mentorship
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="bg-slate-50 border-b border-slate-100 p-2 flex gap-2 overflow-x-auto no-scrollbar text-xs">
            <button
              onClick={() => handleSend('Spoken English program details?')}
              className="px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-700 hover:border-[#0057B8] hover:text-[#0057B8] whitespace-nowrap font-medium transition"
            >
              🗣️ Spoken English
            </button>
            <button
              onClick={() => handleSend('Suggest best course for me')}
              className="px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-700 hover:border-[#0057B8] hover:text-[#0057B8] whitespace-nowrap font-medium transition"
            >
              🎯 Course Guide
            </button>
            <button
              onClick={() => handleSend('How to book free counselling?')}
              className="px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-700 hover:border-[#0057B8] hover:text-[#0057B8] whitespace-nowrap font-medium transition"
            >
              📞 Book Call
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#0057B8] text-white font-medium rounded-br-none shadow-sm'
                      : 'bg-white text-slate-900 border border-slate-200 shadow-sm rounded-bl-none font-normal'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-slate-500 p-3 rounded-2xl text-xs rounded-bl-none animate-pulse">
                  Veezna AI typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Direct CTA */}
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Need human mentor?</span>
            <Link
              href="/apply?type=counselling"
              className="font-bold text-[#0057B8] hover:underline"
            >
              Free Counselling →
            </Link>
          </div>

          {/* Input Box Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about courses, fees, batches..."
              className="
                flex-1
                px-4
                py-2.5
                bg-slate-50
                border
                border-slate-300
                rounded-xl
                text-slate-900
                text-xs
                sm:text-sm
                font-medium
                placeholder:text-slate-400
                focus:outline-none
                focus:bg-white
                focus:border-[#0057B8]
                focus:ring-2
                focus:ring-blue-100
                transition-all
              "
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="
                px-4
                py-2.5
                bg-[#F7931E]
                hover:bg-orange-600
                disabled:opacity-40
                disabled:cursor-not-allowed
                text-white
                rounded-xl
                font-bold
                text-xs
                shadow-sm
                transition-all
              "
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-[#0057B8] to-[#002855] text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/20"
      >
        <span className="text-xl">💬</span>
        <span className="text-sm font-bold tracking-wide hidden sm:inline text-white">
          {isOpen ? 'Close Assistant' : 'Ask Veezna AI'}
        </span>
      </button>
    </div>
  );
}