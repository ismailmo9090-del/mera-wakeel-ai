import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, CheckCheck, Paperclip, ArrowUp, Phone, FileText, ShieldCheck, CheckCircle2, ScanLine } from 'lucide-react';
import { APP_CONFIG } from '../constants';
import { CallScreen } from './CallScreen';

interface ChatMessage {
  id: number;
  type: 'bot' | 'user';
  text: string;
  time: string;
  file?: string;
  result?: boolean;
}

interface AnimatedChatDemoProps {
  placeholder?: string;
}

const timeNow = () =>
  new Date()
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    .toUpperCase();

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/* Scripted demo sequence. Every step is processed in order, then the loop restarts. */
type DemoStep =
  | { type: 'wait'; ms: number }
  | { type: 'bot_typing'; ms: number; text: string; result?: boolean }
  | { type: 'user_typing'; text: string }
  | { type: 'user_send' }
  | { type: 'user_doc'; text: string; file: string }
  | { type: 'scanning'; ms: number }
  | { type: 'end_scanning' }
  | { type: 'calling'; ms: number }
  | { type: 'end_call' }
  | { type: 'reset'; ms: number };

const DEMO_STEPS: DemoStep[] = [
  { type: 'bot_typing', ms: 1500, text: 'Namaste! Main aapka AI Legal Assistant hoon. Aap kis kanooni issue mein madad chahte hain?' },
  { type: 'wait', ms: 2200 },
  { type: 'user_typing', text: 'Meri property par kisi ne kabza kar liya hai, main kya kar sakta hoon?' },
  { type: 'user_send' },
  { type: 'wait', ms: 1800 },
  { type: 'bot_typing', ms: 1400, text: 'Main aapki madad karta hoon. Kripya kuch details bataiye taaki main sahi salah de sakoon.' },
  { type: 'wait', ms: 2000 },
  // Document-scan phase
  { type: 'user_doc', text: 'Yeh mera ghar ka Registry Agreement hai, ek baar scan karke check kar lo.', file: 'Registry_Agreement.pdf' },
  { type: 'wait', ms: 900 },
  { type: 'scanning', ms: 5200 },
  { type: 'end_scanning' },
  { type: 'wait', ms: 700 },
  { type: 'bot_typing', ms: 1800, result: true, text: 'Scan complete! Aapka document VALID hai — Sale Deed (Registry) verified. Stamp duty paid hai aur parties ki details sahi hain. Ye document vault me safely save kar diya gaya hai.' },
  { type: 'wait', ms: 2400 },
  // Voice-call phase
  { type: 'calling', ms: 7000 },
  { type: 'end_call' },
  { type: 'reset', ms: 1000 },
];

/**
 * Self-contained, purely-visual looping chat demo for the homepage.
 * No API/backend calls — a scripted animation (messages + a simulated
 * document scan + a simulated voice call) processed from DEMO_STEPS.
 */
export const AnimatedChatDemo: React.FC<AnimatedChatDemoProps> = ({
  placeholder = 'Type your legal question...',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [botTyping, setBotTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [sending, setSending] = useState(false);
  const [calling, setCalling] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [logoError, setLogoError] = useState(false);
  const idRef = useRef(1);
  const bodyRef = useRef<HTMLDivElement>(null);
  const pendingUserText = useRef('');

  const pushBot = (text: string, opts?: { result?: boolean }) =>
    setMessages((m) => [...m, { id: idRef.current++, type: 'bot', text, time: timeNow(), result: opts?.result }]);

  const pushUser = (text: string, file?: string) =>
    setMessages((m) => [...m, { id: idRef.current++, type: 'user', text, time: timeNow(), file }]);

  useEffect(() => {
    let cancelled = false;

    const reset = () => {
      setMessages([]);
      setBotTyping(false);
      setTypedText('');
      setSending(false);
      setCalling(false);
      setScanning(false);
      setScanStep(0);
      pendingUserText.current = '';
    };

    const processStep = async (step: DemoStep) => {
      switch (step.type) {
        case 'bot_typing': {
          setBotTyping(true);
          await sleep(step.ms);
          if (cancelled) return;
          setBotTyping(false);
          pushBot(step.text, { result: step.result });
          break;
        }
        case 'wait':
          await sleep(step.ms);
          break;
        case 'user_typing': {
          pendingUserText.current = step.text;
          for (let i = 1; i <= step.text.length; i++) {
            if (cancelled) return;
            setTypedText(step.text.slice(0, i));
            await sleep(45);
          }
          break;
        }
        case 'user_send': {
          await sleep(500);
          if (cancelled) return;
          setSending(true);
          await sleep(600);
          if (cancelled) return;
          pushUser(pendingUserText.current);
          pendingUserText.current = '';
          setTypedText('');
          setSending(false);
          break;
        }
        case 'user_doc': {
          pushUser(step.text, step.file);
          break;
        }
        case 'scanning': {
          setScanning(true);
          setScanStep(0);
          await sleep(Math.min(3200, step.ms));
          if (cancelled) return;
          setScanStep(1);
          await sleep(Math.max(0, step.ms - 3200));
          break;
        }
        case 'end_scanning':
          setScanning(false);
          setScanStep(0);
          break;
        case 'calling': {
          setCalling(true);
          await sleep(step.ms);
          break;
        }
        case 'end_call':
          setCalling(false);
          break;
        case 'reset':
          reset();
          await sleep(step.ms);
          break;
      }
    };

    const runDemo = async () => {
      while (!cancelled) {
        for (const step of DEMO_STEPS) {
          await processStep(step);
          if (cancelled) return;
        }
      }
    };

    runDemo();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll chat body to bottom as messages / typing / scan indicators appear
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, botTyping, typedText, scanning]);

  return (
    <>
      <div className="relative bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 shrink-0 rounded-full bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm flex items-center justify-center overflow-hidden">
              {!logoError ? (
                <img
                  src={APP_CONFIG.logoUrl}
                  alt={`${APP_CONFIG.name} Logo`}
                  onError={() => setLogoError(true)}
                  className="w-full h-full object-contain p-0.5"
                />
              ) : (
                <Scale className="w-4 h-4 text-[#F5A623]" />
              )}
            </div>
            <div>
              <span className="block text-sm font-bold text-[#0F2557] leading-tight">{APP_CONFIG.name}</span>
              <span className="block text-[10px] text-[#6B7280]">Apna Personal Legal Assistant</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Call button — real clickable, also auto-triggered by the demo */}
            <motion.button
              type="button"
              onClick={() => setCalling(true)}
              animate={calling ? { scale: [1, 1.18, 1] } : { scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0F2557] text-white shadow-md hover:bg-[#1E2E4F] transition-colors cursor-pointer"
              aria-label="Voice call"
            >
              <Phone className="w-3.5 h-3.5" />
            </motion.button>

            <div className="flex items-center gap-1.5 bg-[#DCFCE7] px-2.5 py-1 rounded-full border border-[#86EFAC]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="text-[10px] font-bold text-[#15803D]">Online</span>
            </div>
          </div>
        </div>

        {/* Chat body */}
        <div
          ref={bodyRef}
          className="px-4 py-4 min-h-[280px] max-h-[380px] overflow-y-auto flex flex-col gap-3 bg-[#FBFAF7]"
        >
          {messages.map((msg) =>
            msg.type === 'bot' ? (
              <div key={msg.id} className="flex items-start gap-2.5 max-w-[88%]">
                <div className="w-7 h-7 shrink-0 rounded-full bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm flex items-center justify-center overflow-hidden">
                  {!logoError ? (
                    <img
                      src={APP_CONFIG.logoUrl}
                      alt={`${APP_CONFIG.name} Logo`}
                      onError={() => setLogoError(true)}
                      className="w-full h-full object-contain p-0.5"
                    />
                  ) : (
                    <Scale className="w-4 h-4 text-[#F5A623]" />
                  )}
                </div>
                <div className="min-w-0">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg rounded-tl-sm px-3 py-2.5 text-xs text-[#1F2937] leading-relaxed"
                  >
                    {msg.text}
                    {msg.result && (
                      <div className="mt-2.5 pt-2.5 border-t border-[#D1D5DB] space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#15803D]">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Document Verified • Saved in Vault
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#475569] font-medium">
                          <FileText className="w-3 h-3 shrink-0 text-[#2563EB]" /> Type: Sale Deed (Registry) • Stamp duty paid
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#475569] font-medium">
                          <CheckCircle2 className="w-3 h-3 shrink-0 text-[#16A34A]" /> Parties &amp; property details confirmed
                        </div>
                      </div>
                    )}
                  </motion.div>
                  <div className="text-[10px] text-[#9CA3AF] mt-1">{msg.time}</div>
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[88%]">
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#E8EFFA] border border-[#CBD9EE] rounded-lg rounded-tr-sm px-3 py-2.5 text-xs font-medium text-[#0F2557] leading-relaxed"
                  >
                    {msg.file && (
                      <div className="mb-2 inline-flex items-center gap-1.5 bg-[#FFFFFF] border border-[#CBD9EE] rounded-md px-2 py-1 text-[10px] font-bold text-[#0F2557]">
                        <Paperclip className="w-3 h-3 text-[#D98800] shrink-0" />
                        <span className="truncate">{msg.file}</span>
                      </div>
                    )}
                    <div>{msg.text}</div>
                  </motion.div>
                  <div className="text-[10px] text-[#9CA3AF] mt-1 flex items-center justify-end gap-1">
                    <span>{msg.time}</span>
                    <CheckCheck className="w-3 h-3 text-[#2563EB]" />
                  </div>
                </div>
              </div>
            )
          )}

          {/* Bot typing indicator */}
          {botTyping && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 shrink-0 rounded-full bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm flex items-center justify-center overflow-hidden">
                {!logoError ? (
                  <img
                    src={APP_CONFIG.logoUrl}
                    alt={`${APP_CONFIG.name} Logo`}
                    onError={() => setLogoError(true)}
                    className="w-full h-full object-contain p-0.5"
                  />
                ) : (
                  <Scale className="w-4 h-4 text-[#F5A623]" />
                )}
              </div>
              <div className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg rounded-tl-sm px-3.5 py-3 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Document scanning indicator */}
          {scanning && (
            <div className="flex items-start gap-2.5 max-w-[88%]">
              <div className="w-7 h-7 shrink-0 rounded-full bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm flex items-center justify-center overflow-hidden">
                {!logoError ? (
                  <img
                    src={APP_CONFIG.logoUrl}
                    alt={`${APP_CONFIG.name} Logo`}
                    onError={() => setLogoError(true)}
                    className="w-full h-full object-contain p-0.5"
                  />
                ) : (
                  <Scale className="w-4 h-4 text-[#F5A623]" />
                )}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-[#FFFFFF] border border-[#BFDBFE] rounded-lg rounded-tl-sm px-3 py-2.5 min-w-[200px] sm:min-w-[240px] shadow-sm"
              >
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#0F2557]">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                    className="shrink-0 inline-flex"
                  >
                    <ScanLine className="w-3.5 h-3.5 text-[#2563EB]" />
                  </motion.span>
                  <span>
                    {scanStep === 0 ? 'Scanning document with OCR & AI...' : 'Verifying clauses & saving to vault...'}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-[#DBEAFE] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#2563EB] rounded-full"
                    initial={{ width: '4%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 5.1, ease: 'easeInOut' }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-[#64748B] font-medium">
                  {scanStep === 0
                    ? 'Registry_Agreement.pdf • Extracting text, parties & dates...'
                    : 'AI is checking document type & legal standing...'}
                </p>
              </motion.div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-[#E2E8F0] p-3 flex items-center gap-2 bg-[#FFFFFF]">
          <div className="relative flex-1">
            <input
              readOnly
              value={typedText}
              placeholder={placeholder}
              className={`w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-3 pr-9 py-2.5 text-xs outline-none text-[#0F2557] placeholder:text-[#9CA3AF] transition-all ${
                sending ? 'border-[#F5A623] ring-2 ring-[#F5A623]/20' : 'focus:border-[#F5A623]'
              }`}
            />
            <Paperclip className="w-4 h-4 text-[#9CA3AF] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            type="button"
            className={`w-9 h-9 rounded-full bg-[#0F2557] text-white flex items-center justify-center shadow-md transition-all ${
              sending ? 'scale-95 bg-[#F5A623]' : 'hover:bg-[#1E2E4F]'
            }`}
            aria-label="Send"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        {/* Voice-call overlay — fills only the card (parent is `relative`), fades in/out */}
        <AnimatePresence>
          {calling && <CallScreen key="callscreen" isVisible={calling} onEndCall={() => setCalling(false)} />}
        </AnimatePresence>
      </div>
    </>
  );
};

export default AnimatedChatDemo;