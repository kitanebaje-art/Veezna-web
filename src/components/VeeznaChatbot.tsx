'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LeadData {
  name?: unknown;
  phone?: unknown;
  program?: unknown;
  qualification?: unknown;
  goal?: unknown;
  preferredTime?: unknown;
}

interface NormalizedLead {
  name: string;
  phone: string;
  program: string;
  qualification: string;
  goal: string;
  preferredTime: string;
}

interface LeadSaveResult {
  success: boolean;
  duplicate?: boolean;
  saved?: boolean;
  message?: string;
  error?: string;
  code?: string;
}

type AdvisorState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'success';

export default function VeeznaChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Namaste! 👋 Main Veezna Advisor hoon. Aap kis goal, skill, course ya admission ke baare mein guidance chahte hain?',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const submittedLeadRef = useRef<string | null>(null);

  const speakingTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages, loading, isOpen, isInputFocused]);

  useEffect(() => {
    return () => {
      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current);
      }
    };
  }, []);

  // Auto-collapse header sections once user has sent at least one message
  const hasUserMessages = messages.some((m) => m.role === 'user');
  const shouldCollapseHeader = isInputFocused || hasUserMessages;

  // ============================================================
  // SAFE STRING
  // ============================================================

  const cleanValue = (
    value: unknown,
    maxLength = 500
  ): string => {
    if (typeof value !== 'string') {
      return '';
    }

    return value
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, maxLength);
  };

  // ============================================================
  // PHONE NORMALIZER
  // ============================================================

  const normalizePhone = (value: string): string => {
    const digits = value.replace(/\D/g, '');

    if (/^[6-9]\d{9}$/.test(digits)) {
      return digits;
    }

    if (
      digits.length === 12 &&
      digits.startsWith('91') &&
      /^[6-9]\d{9}$/.test(digits.slice(2))
    ) {
      return digits.slice(2);
    }

    if (
      digits.length === 11 &&
      digits.startsWith('0') &&
      /^[6-9]\d{9}$/.test(digits.slice(1))
    ) {
      return digits.slice(1);
    }

    return '';
  };

  // ============================================================
  // NORMALIZE LEAD
  // ============================================================

  const normalizeLead = (
    rawLead: LeadData
  ): NormalizedLead | null => {
    const name = cleanValue(rawLead?.name, 100);

    const phone = normalizePhone(
      cleanValue(rawLead?.phone, 30)
    );

    const program = cleanValue(
      rawLead?.program,
      150
    );

    const qualification = cleanValue(
      rawLead?.qualification,
      150
    );

    const goal = cleanValue(
      rawLead?.goal,
      300
    );

    const preferredTime = cleanValue(
      rawLead?.preferredTime,
      100
    );

    if (!name || !phone || !program) {
      console.warn(
        'VEEZNA LEADS: Lead detected but incomplete.',
        {
          hasName: Boolean(name),
          hasPhone: Boolean(phone),
          hasProgram: Boolean(program),
        }
      );

      return null;
    }

    return {
      name,
      phone,
      program,
      qualification,
      goal,
      preferredTime,
    };
  };

  // ============================================================
  // LEAD KEY
  // ============================================================

  const getLeadKey = (
    lead: NormalizedLead
  ): string => {
    return [
      lead.name,
      lead.phone,
      lead.program,
      lead.qualification,
      lead.goal,
    ]
      .join('|')
      .toLowerCase()
      .trim();
  };

  // ============================================================
  // SAFE JSON
  // ============================================================

  const readJsonSafely = async (
    response: Response
  ): Promise<LeadSaveResult> => {
    const contentType =
      response.headers.get('content-type') || '';

    const rawText = await response.text();

    if (!rawText.trim()) {
      return {
        success: false,
        error: 'The server returned an empty response.',
        code: 'EMPTY_RESPONSE',
      };
    }

    if (!contentType.includes('application/json')) {
      console.error(
        'VEEZNA LEADS: Non-JSON API response:',
        {
          status: response.status,
          contentType,
          body: rawText.slice(0, 1000),
        }
      );

      return {
        success: false,
        error:
          'Lead API returned an unexpected response.',
        code: 'NON_JSON_RESPONSE',
      };
    }

    try {
      return JSON.parse(rawText) as LeadSaveResult;
    } catch (error) {
      console.error(
        'VEEZNA LEADS: Invalid JSON:',
        error
      );

      return {
        success: false,
        error: 'Invalid JSON response from lead API.',
        code: 'INVALID_API_RESPONSE',
      };
    }
  };

  // ============================================================
  // SAVE LEAD
  // ============================================================

  const saveLead = async (
    rawLead: LeadData
  ): Promise<boolean> => {
    const lead = normalizeLead(rawLead);

    if (!lead) {
      return false;
    }

    const leadKey = getLeadKey(lead);

    if (submittedLeadRef.current === leadKey) {
      console.log(
        'VEEZNA LEADS: Duplicate lead ignored.'
      );

      return true;
    }

    setLeadSaving(true);

    try {
      const payload: {
        name: string;
        phone: string;
        program: string;
        qualification: string;
        goal: string;
        preferredTime: string;
        source: string;
      } = {
        name: lead.name,
        phone: lead.phone,
        program: lead.program,
        qualification: lead.qualification,
        goal: lead.goal,
        preferredTime: lead.preferredTime,
        source: 'Veezna AI Advisor',
      };

      console.log(
        'VEEZNA LEADS: Sending lead to /api/leads:',
        {
          name: payload.name,
          phone:
            payload.phone.slice(0, 2) +
            '******' +
            payload.phone.slice(-2),
          program: payload.program,
        }
      );

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      const data =
        await readJsonSafely(response);

      if (!response.ok || !data.success) {
        console.error(
          'VEEZNA LEADS: Lead save failed:',
          {
            httpStatus: response.status,
            statusText: response.statusText,
            response: data,
          }
        );

        return false;
      }

      submittedLeadRef.current = leadKey;

      setLeadSaved(true);

      console.log(
        'VEEZNA LEADS: Lead successfully saved.',
        {
          duplicate: data.duplicate === true,
          saved: data.saved !== false,
          message: data.message,
        }
      );

      return true;
    } catch (error) {
      console.error(
        'VEEZNA LEADS: Network error:',
        error
      );

      return false;
    } finally {
      setLeadSaving(false);
    }
  };

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const handleSend = async (
    textToSend?: string
  ) => {
    const text = (
      textToSend ?? input
    ).trim();

    if (!text || loading) {
      return;
    }

    setIsSpeaking(false);

    const userMessage: Message = {
      role: 'user',
      content: text,
    };

    const newMessages: Message[] = [
      ...messages,
      userMessage,
    ];

    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
        }),
        cache: 'no-store',
      });

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Veezna AI request failed (${response.status}).`
        );
      }

      // AI REPLY
      if (
        typeof data?.reply === 'string' &&
        data.reply.trim()
      ) {
        setMessages((previous) => [
          ...previous,
          {
            role: 'assistant',
            content: data.reply,
          },
        ]);

        setIsSpeaking(true);

        if (speakingTimerRef.current) {
          clearTimeout(
            speakingTimerRef.current
          );
        }

        speakingTimerRef.current =
          setTimeout(() => {
            setIsSpeaking(false);
          }, 1600);
      }

      // LEAD
      if (
        data?.lead &&
        typeof data.lead === 'object'
      ) {
        try {
          const saved = await saveLead(
            data.lead as LeadData
          );

          if (saved) {
            console.log(
              'VEEZNA: Thanks for Sharing Your Information With Us.'
            );
          } else {
            console.warn(
              'VEEZNA: Lead detected but not saved.'
            );
          }
        } catch (leadError) {
          console.error(
            'VEEZNA: Lead saving error:',
            leadError
          );
        }
      }
    } catch (error) {
      console.error(
        'VEEZNA Chat Error:',
        error
      );

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content:
            'Kuch technical samasya aayi hai. Kripya thodi der baad try karein.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ADVISOR STATE
  // ============================================================

  const advisorState: AdvisorState =
    leadSaved
      ? 'success'
      : isSpeaking
      ? 'speaking'
      : loading
      ? 'thinking'
      : leadSaving
      ? 'listening'
      : 'idle';

  const advisorStatus =
    advisorState === 'success'
      ? 'Enquiry received'
      : advisorState === 'speaking'
      ? 'Veezna is speaking'
      : advisorState === 'thinking'
      ? 'Thinking...'
      : advisorState === 'listening'
      ? 'Listening...'
      : 'Ready to guide you';

  // ============================================================
  // QUICK GOALS
  // ============================================================

  const selectGoal = (text: string) => {
    if (!loading) {
      void handleSend(text);
    }
  };

  return (
    <>
      <style jsx global>{`
        .veezna-advisor-shell {
          --veezna-blue: #0057b8;
          --veezna-deep: #002855;
          --veezna-orange: #f7931e;
          isolation: isolate;
        }

        .veezna-chat-panel {
          transform-origin: bottom right;
          animation: veeznaPanelIn 320ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes veeznaPanelIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* 3D ORB */
        .veezna-orb-scene {
          position: relative;
          width: 126px;
          height: 104px;
          perspective: 900px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.35s ease;
        }

        .veezna-orb-shadow {
          position: absolute;
          width: 72px;
          height: 14px;
          bottom: 7px;
          border-radius: 50%;
          background: rgba(0, 40, 85, 0.18);
          filter: blur(9px);
        }

        .veezna-orb {
          position: relative;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background:
            radial-gradient(circle at 32% 25%, rgba(255, 255, 255, 0.98) 0 4%, rgba(247, 147, 30, 0.9) 5% 9%, transparent 10%),
            radial-gradient(circle at 35% 30%, #2c91ff 0%, #0057b8 35%, #003b80 68%, #001b3a 100%);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2), 0 14px 35px rgba(0, 45, 100, 0.32), 0 0 35px rgba(0, 120, 255, 0.28);
          animation: veeznaFloat 5s ease-in-out infinite, veeznaOrbLight 8s ease-in-out infinite;
        }

        .veezna-orb::before {
          content: '';
          position: absolute;
          inset: 6px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.28);
          box-shadow: inset 0 0 16px rgba(255, 255, 255, 0.12), inset -8px -10px 18px rgba(0, 0, 0, 0.22);
        }

        .veezna-orb::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 10px;
          left: 15px;
          top: 13px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.28);
          filter: blur(3px);
          transform: rotate(-25deg);
        }

        .veezna-orb-letter {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 25px;
          font-weight: 900;
          letter-spacing: -2px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
        }

        .veezna-orb-ring {
          position: absolute;
          width: 98px;
          height: 98px;
          border-radius: 50%;
          border: 1px solid rgba(0, 87, 184, 0.23);
          transform: rotateX(68deg);
          animation: veeznaRing 7s linear infinite;
        }

        .veezna-orb-ring-two {
          position: absolute;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          border: 1px dashed rgba(247, 147, 30, 0.3);
          transform: rotateY(70deg) rotateX(10deg);
          animation: veeznaRingTwo 9s linear infinite;
        }

        .veezna-orb-dot {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #f7931e;
          box-shadow: 0 0 9px rgba(247, 147, 30, 0.8);
        }

        .veezna-dot-one { top: 10px; right: 19px; }
        .veezna-dot-two { bottom: 17px; left: 18px; width: 4px; height: 4px; }
        .veezna-dot-three { right: 7px; bottom: 37px; width: 4px; height: 4px; }

        @keyframes veeznaFloat {
          0%, 100% { transform: translateY(0) rotateX(0deg) rotateY(-3deg); }
          50% { transform: translateY(-5px) rotateX(4deg) rotateY(3deg); }
        }

        @keyframes veeznaOrbLight {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.08); }
        }

        @keyframes veeznaRing {
          from { transform: rotateX(68deg) rotateZ(0deg); }
          to { transform: rotateX(68deg) rotateZ(360deg); }
        }

        @keyframes veeznaRingTwo {
          from { transform: rotateY(70deg) rotateX(10deg) rotateZ(0deg); }
          to { transform: rotateY(70deg) rotateX(10deg) rotateZ(-360deg); }
        }

        .veezna-thinking .veezna-orb { animation: veeznaThinking 1.2s ease-in-out infinite; }
        .veezna-thinking .veezna-orb-ring { animation-duration: 2s; }
        .veezna-thinking .veezna-orb-ring-two { animation-duration: 2.8s; }

        @keyframes veeznaThinking {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.04); }
        }

        .veezna-speaking .veezna-orb { animation: veeznaSpeaking 0.8s ease-in-out infinite; }

        @keyframes veeznaSpeaking {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.05) translateY(-3px); }
        }

        .veezna-listening .veezna-orb { animation: veeznaListening 1.5s ease-in-out infinite; }

        @keyframes veeznaListening {
          0%, 100% { box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18), 0 14px 35px rgba(0, 45, 100, 0.32), 0 0 35px rgba(0, 120, 255, 0.28); }
          50% { box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25), 0 14px 35px rgba(0, 45, 100, 0.32), 0 0 55px rgba(0, 140, 255, 0.45); }
        }

        .veezna-success .veezna-orb {
          background:
            radial-gradient(circle at 32% 25%, rgba(255, 255, 255, 0.98) 0 5%, transparent 10%),
            radial-gradient(circle at 35% 30%, #34d399 0%, #059669 40%, #047857 70%, #064e3b 100%);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2), 0 14px 35px rgba(4, 120, 87, 0.3), 0 0 45px rgba(16, 185, 129, 0.45);
        }

        .veezna-success .veezna-orb-ring-two { border-color: rgba(16, 185, 129, 0.35); }

        /* FLOATING BUTTON */
        .veezna-floating-button {
          position: relative;
          overflow: hidden;
        }

        .veezna-floating-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, transparent 20%, rgba(255, 255, 255, 0.18) 45%, transparent 70%);
          transform: translateX(-120%);
          animation: veeznaShine 4.5s ease-in-out infinite;
        }

        @keyframes veeznaShine {
          0%, 60%, 100% { transform: translateX(-120%); }
          72% { transform: translateX(120%); }
        }

        .veezna-floating-orb {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 30% 25%, #ffffff, #55a9ff 14%, #0057b8 48%, #002855 100%);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35), 0 0 18px rgba(80, 170, 255, 0.42);
          animation: veeznaMiniFloat 3.5s ease-in-out infinite;
        }

        .veezna-floating-orb::after {
          content: 'V';
          color: white;
          font-weight: 900;
          font-size: 14px;
          text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
        }

        @keyframes veeznaMiniFloat {
          0%, 100% { transform: translateY(0) rotateY(-5deg); }
          50% { transform: translateY(-3px) rotateY(5deg); }
        }

        /* MESSAGE AREA */
        .veezna-messages {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 87, 184, 0.25) transparent;
          overscroll-behavior: contain;
        }

        .veezna-messages::-webkit-scrollbar { width: 5px; }
        .veezna-messages::-webkit-scrollbar-track { background: transparent; }
        .veezna-messages::-webkit-scrollbar-thumb {
          background: rgba(0, 87, 184, 0.25);
          border-radius: 999px;
        }

        .veezna-message-bubble {
          overflow-wrap: anywhere;
          word-break: break-word;
          white-space: pre-wrap;
        }

        @media (max-width: 639px) {
          .veezna-chat-panel {
            width: calc(100vw - 16px) !important;
            max-width: none !important;
            margin-right: 0;
            margin-bottom: 8px;
            border-radius: 22px;
          }
        }
      `}</style>

      {/* ==========================================================
          MAIN SHELL
      ========================================================== */}

      <div className="veezna-advisor-shell fixed bottom-3 right-3 sm:bottom-5 sm:right-5 md:bottom-6 md:right-6 z-[9999] font-sans">
        {/* ========================================================
            CHAT PANEL
        ======================================================== */}

        {isOpen && (
          <div
            className="veezna-chat-panel w-[calc(100vw-16px)] sm:w-[390px] md:w-[400px] max-w-[400px] rounded-[24px] sm:rounded-[28px] border border-white/80 bg-white shadow-[0_30px_80px_rgba(0,40,85,0.25)] overflow-hidden flex flex-col mb-3 sm:mb-4"
            style={{
              height: 'calc(100dvh - 24px)',
              maxHeight: 'calc(100dvh - 24px)',
              minHeight: '420px',
            }}
          >
            {/* ====================================================
                HEADER
            ==================================================== */}

            <div className="relative shrink-0 min-h-[64px] overflow-hidden bg-gradient-to-br from-[#0057B8] via-[#004b9f] to-[#002855] px-3.5 sm:px-4 py-2.5 text-white">
              <div className="absolute -top-16 -right-14 w-32 h-32 rounded-full bg-blue-300/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-10 w-32 h-32 rounded-full bg-orange-400/10 blur-2xl pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between gap-3 h-full">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                    <span className="veezna-floating-orb" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-[14px] sm:text-[15px] leading-tight tracking-tight truncate">
                        Veezna Advisor
                      </h3>
                      <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-blue-100">
                        AI
                      </span>
                    </div>

                    <p className="text-[9px] sm:text-[10px] text-blue-100 flex items-center gap-1.5 mt-0.5 truncate">
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                      Your personal learning guide
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="shrink-0 w-8 h-8 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition"
                  aria-label="Close chat"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* ====================================================
                ADVISOR HERO (Collapsible on typing/chat)
            ==================================================== */}

            <div
              className={`relative shrink-0 overflow-hidden bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 transition-all duration-300 ease-in-out ${
                shouldCollapseHeader
                  ? 'max-h-0 opacity-0 py-0 border-b-0 pointer-events-none'
                  : 'max-h-[160px] opacity-100 py-1'
              }`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,87,184,0.09),transparent_55%)] pointer-events-none" />

              <div className="relative flex flex-col items-center justify-center">
                <div
                  className={
                    'veezna-orb-scene ' +
                    (advisorState === 'thinking'
                      ? 'veezna-thinking '
                      : '') +
                    (advisorState === 'speaking'
                      ? 'veezna-speaking '
                      : '') +
                    (advisorState === 'listening'
                      ? 'veezna-listening '
                      : '') +
                    (advisorState === 'success'
                      ? 'veezna-success'
                      : '')
                  }
                >
                  <div className="veezna-orb-shadow" />
                  <div className="veezna-orb-ring" />
                  <div className="veezna-orb-ring-two" />

                  <div className="veezna-orb">
                    <span className="veezna-orb-letter">V</span>
                  </div>

                  <span className="veezna-orb-dot veezna-dot-one" />
                  <span className="veezna-orb-dot veezna-dot-two" />
                  <span className="veezna-orb-dot veezna-dot-three" />
                </div>

                <div className="flex items-center gap-1.5 -mt-1">
                  <span className="w-[6px] h-[6px] rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.65)]" />
                  <span className="text-[10px] font-extrabold text-slate-700">
                    {advisorStatus}
                  </span>
                </div>

                <p className="text-[8px] sm:text-[9px] text-slate-400 mt-0.5 mb-1">
                  I understand first. Then I guide.
                </p>
              </div>
            </div>

            {/* ====================================================
                GOAL CARDS (Collapsible on typing/chat)
            ==================================================== */}

            <div
              className={`shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 transition-all duration-300 ease-in-out overflow-hidden ${
                shouldCollapseHeader
                  ? 'max-h-0 opacity-0 py-0 border-b-0 pointer-events-none'
                  : 'max-h-[140px] opacity-100 py-2'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                  Start with a goal
                </p>
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* COURSE MATCH */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    selectGoal('I want help finding the best Veezna course for me.')
                  }
                  className="group relative min-w-0 text-left rounded-xl border border-slate-200 bg-slate-50/70 p-2 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

                  <div className="relative z-10">
                    <div className="w-6 h-6 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                      </svg>
                    </div>

                    <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                      Course Match
                    </p>

                    <p className="text-[8px] text-slate-400 mt-0.5 truncate">
                      Find my fit
                    </p>
                  </div>
                </button>

                {/* CAREER */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    selectGoal('I want career guidance. Please understand my situation and suggest my next step.')
                  }
                  className="group relative min-w-0 text-left rounded-xl border border-slate-200 bg-slate-50/70 p-2 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/10 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

                  <div className="relative z-10">
                    <div className="w-6 h-6 rounded-lg bg-purple-100/80 text-purple-600 flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-200">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                      </svg>
                    </div>

                    <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-800 truncate group-hover:text-purple-600 transition-colors">
                      Career Guide
                    </p>

                    <p className="text-[8px] text-slate-400 mt-0.5 truncate">
                      Next step
                    </p>
                  </div>
                </button>

                {/* HUMAN */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    selectGoal('I would like to talk to a Veezna human mentor.')
                  }
                  className="group relative min-w-0 text-left rounded-xl border border-slate-200 bg-slate-50/70 p-2 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

                  <div className="relative z-10">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>

                    <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                      Human Mentor
                    </p>

                    <p className="text-[8px] text-slate-400 mt-0.5 truncate">
                      Talk to team
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* ====================================================
                MESSAGE AREA (Maximum space & perfect visibility)
            ==================================================== */}

            <div className="veezna-messages flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/90">
              {messages.map((message, index) => {
                const isUser = message.role === 'user';

                return (
                  <div
                    key={`${index}-${message.role}`}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`veezna-message-bubble max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm transition-all ${
                        isUser
                          ? 'bg-gradient-to-br from-[#0057B8] to-[#00438f] text-white font-medium rounded-br-xs shadow-[0_4px_14px_rgba(0,87,184,0.18)]'
                          : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs font-normal shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 text-slate-500 px-3.5 py-2.5 rounded-2xl text-xs rounded-bl-xs shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#0057B8] rounded-full animate-bounce" />
                      <span
                        className="w-1.5 h-1.5 bg-[#0057B8] rounded-full animate-bounce"
                        style={{ animationDelay: '120ms' }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-[#F7931E] rounded-full animate-bounce"
                        style={{ animationDelay: '240ms' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-px w-full" />
            </div>

            {/* ====================================================
                LEAD STATUS
            ==================================================== */}

            {(leadSaving || leadSaved) && (
              <div className="shrink-0 px-3 py-1.5 bg-emerald-50 border-t border-emerald-100">
                {leadSaving && (
                  <p className="text-[9px] text-emerald-700 font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    We will reach out to you soon....
                  </p>
                )}

                {leadSaved && !leadSaving && (
                  <p className="text-[9px] text-emerald-700 font-bold flex items-center gap-2">
                    <span>✓</span>
                    Your inquiry has been forwarded to the Veezna team, and someone will reach out to you shortly.
                  </p>
                )}
              </div>
            )}

            {/* ====================================================
                HUMAN CTA
            ==================================================== */}

            <div className="shrink-0 px-3 py-2 bg-blue-50/90 border-t border-blue-100 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[9px] text-slate-500 font-medium">
                  Want a human perspective?
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-700 font-extrabold truncate">
                  Talk to Veezna team
                </p>
              </div>

              <Link
                href="/apply?type=counselling"
                className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white border border-blue-200 text-[#0057B8] font-extrabold text-[9px] hover:bg-[#0057B8] hover:text-white transition shadow-sm whitespace-nowrap"
              >
                Apply →
              </Link>
            </div>

            {/* ====================================================
                INPUT
            ==================================================== */}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSend();
              }}
              className="shrink-0 p-2.5 sm:p-3 bg-white border-t border-slate-200 flex gap-2 items-center"
            >
              <input
                type="text"
                value={input}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Tell me what you want to achieve..."
                disabled={loading}
                className="flex-1 min-w-0 h-10 sm:h-11 px-3.5 sm:px-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-slate-900 text-xs sm:text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0057B8] focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-[#F7931E] to-[#e8790b] hover:from-orange-500 hover:to-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl sm:rounded-2xl font-black text-base sm:text-lg shadow-[0_5px_15px_rgba(247,147,30,0.25)] transition-all active:scale-95 flex items-center justify-center"
                aria-label="Send message"
              >
                ➤
              </button>
            </form>
          </div>
        )}

        {/* ========================================================
            FLOATING BUTTON
        ======================================================== */}

        <button
          type="button"
          onClick={() => setIsOpen((previous) => !previous)}
          className="veezna-floating-button group relative flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-[#0057B8] via-[#004b9f] to-[#002855] text-white shadow-[0_15px_40px_rgba(0,40,85,0.28)] hover:shadow-[0_20px_50px_rgba(0,87,184,0.35)] hover:scale-[1.03] active:scale-95 transition-all duration-300 border border-white/20"
          aria-label={
            isOpen ? 'Close Veezna Advisor' : 'Open Veezna Advisor'
          }
        >
          <span className="relative z-10">
            <span className="veezna-floating-orb" />
          </span>

          <span className="relative z-10 text-xs sm:text-sm font-extrabold tracking-tight text-white">
            {isOpen ? 'Close Advisor' : 'Ask Veezna AI'}
          </span>

          {!isOpen && (
            <span className="relative z-10 hidden sm:inline text-[9px] font-bold text-blue-200">
              ✦
            </span>
          )}
        </button>
      </div>
    </>
  );
}