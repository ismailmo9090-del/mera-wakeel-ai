import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  PhoneOff,
  Mic,
  Volume2,
  Bluetooth,
  LayoutGrid,
  FileText,
  Camera,
  Sparkles,
} from 'lucide-react';
import { APP_CONFIG } from '../constants';

interface CallScreenProps {
  isVisible: boolean;
  onEndCall: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Simulated in-card voice-call overlay. No WebRTC/telephony — pure visual demo
 * with a real-time timer and a scripted "Calling → Connected" status change.
 * Absolutely positioned inside the parent chat card (parent must be `relative`).
 */
export const CallScreen: React.FC<CallScreenProps> = ({ isVisible, onEndCall }) => {
  const [seconds, setSeconds] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    setSeconds(0);
    setConnected(false);
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    const connectTimeout = setTimeout(() => setConnected(true), 3000);
    return () => {
      clearInterval(timer);
      clearTimeout(connectTimeout);
    };
  }, [isVisible]);

  const timestamp = `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

  const controls = [
    { icon: Mic, label: 'Mute' },
    {
      icon: Volume2,
      label: 'Speaker',
      active: true,
      btnCls: 'bg-[#F5A623]/15 border-[#F5A623]/40 text-[#F5A623]',
      labelCls: 'text-[#F5A623]',
    },
    { icon: Bluetooth, label: 'Audio' },
    { icon: LayoutGrid, label: 'Keypad' },
    { icon: FileText, label: 'Doc', btnCls: 'text-[#F5A623]' },
    { icon: Camera, label: 'Camera', btnCls: 'text-[#16A34A]', labelCls: 'text-[#16A34A]' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.4 } }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.3 } }}
      className="absolute inset-0 z-20 bg-[#0A0E1A] text-white rounded-2xl overflow-hidden"
    >
      <div className="flex flex-col h-full px-4 py-3">
        {/* Top row */}
        <div className="flex items-center justify-between shrink-0">
          <span className="px-2.5 py-1 text-[10px] font-bold text-white bg-white/5 border border-white/15 rounded-full">
            HD Voice Call
          </span>
          <span className="px-2.5 py-1 text-[10px] font-mono font-bold text-[#F5A623] bg-white/5 border border-white/15 rounded-full tabular-nums">
            {timestamp}
          </span>
          <button
            type="button"
            onClick={onEndCall}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close call"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        {/* Center: avatar + identity + status */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 py-2">
          <div className="relative">
            {connected && (
              <span className="absolute inset-0 rounded-full bg-[#16A34A]/30 animate-ping pointer-events-none" />
            )}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-[#0F2557] via-[#1E2E4F] to-[#F5A623]">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white">
                <img
                  src={APP_CONFIG.logoUrl}
                  alt={`${APP_CONFIG.name} Logo`}
                  className="w-full h-full object-contain p-1.5"
                />
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-lg font-extrabold leading-tight">{APP_CONFIG.name}</h2>
            <div className="flex items-center justify-center gap-1 mt-0.5 text-[11px] text-[#A8B3C0]">
              <Sparkles className="w-3 h-3 text-[#F5A623]" />
              <span>Senior AI Legal Counsel</span>
            </div>
          </div>

          <span
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
              connected
                ? 'bg-[#16A34A]/15 border-[#16A34A]/40 text-[#86EFAC]'
                : 'bg-white/5 border-white/15 text-white'
            }`}
          >
            {connected ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                Connected • Sun rahe hain...
              </>
            ) : (
              <>Calling Mera Wakeel AI... (घंटी बज रही है)</>
            )}
          </span>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-6 gap-1.5 shrink-0 pb-2">
          {controls.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="flex flex-col items-center gap-0.5 min-w-0">
                <button
                  type="button"
                  className={`w-10 h-10 rounded-xl bg-[#141A2B] border border-white/10 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${
                    c.btnCls || 'text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
                <span className={`text-[9px] font-semibold truncate max-w-full ${c.labelCls || 'text-[#A8B3C0]'}`}>
                  {c.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* End call */}
        <div className="flex justify-center shrink-0">
          <motion.button
            type="button"
            onClick={onEndCall}
            whileTap={{ scale: 0.92 }}
            className="w-12 h-12 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] shadow-lg shadow-[#DC2626]/30 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="End call"
          >
            <PhoneOff className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default CallScreen;