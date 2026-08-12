import React, { useState, useEffect, useRef } from 'react';
import { DirectMessage, fetchDirectMessages, sendDirectMessage, getSupabase } from '../lib/supabase';
import {
  Send,
  MessageSquare,
  Scale,
  User,
  CheckCheck,
  ChevronDown,
  Phone,
  MessageCircle,
  FileText,
  Sparkles,
  Info,
  ChevronUp,
  Star,
} from 'lucide-react';
import { ReviewModal } from './ReviewModal';

interface DirectMessagePanelProps {
  connectionId: string;
  currentUserId: string;
  currentUserType: 'lawyer' | 'citizen';
  lawyerId?: string;
  currentUserName?: string;
  otherPartyName?: string;
  otherPartyPhone?: string;
  caseTitle?: string;
  caseSummary?: string;
  caseCategory?: string;
  /** For premium collapsed card display */
  compact?: boolean;
}

export const DirectMessagePanel: React.FC<DirectMessagePanelProps> = ({
  connectionId,
  currentUserId,
  currentUserType,
  currentUserName = 'You',
  otherPartyName = currentUserType === 'lawyer' ? 'Citizen Client' : 'Your Advocate',
  otherPartyPhone,
  caseTitle,
  caseSummary,
  caseCategory,
  compact = false,
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(!compact);
  const [showSummaryDrawer, setShowSummaryDrawer] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    const msgs = await fetchDirectMessages(connectionId);
    setMessages(msgs);
    setLoading(false);
  };

  useEffect(() => {
    load();

    const client = getSupabase();
    let channel: any = null;

    if (client && connectionId) {
      channel = client
        .channel(`dm_chan_${connectionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `connection_id=eq.${connectionId}`,
          },
          (payload) => {
            if (payload.new) {
              const newMsg = payload.new as DirectMessage;
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });

              if (newMsg.sender_type === 'lawyer' && typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('lawyer_message_received', {
                    detail: {
                      sender_type: 'lawyer',
                      sender_name: otherPartyName,
                      content: newMsg.content,
                      connection_id: connectionId,
                    },
                  })
                );
              }
            }
          }
        )
        .subscribe();
    }

    // Fallback light poll every 12s in case WebSocket drops
    pollRef.current = setInterval(load, 12000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (channel && client) {
        client.removeChannel(channel);
      }
    };
  }, [connectionId]);

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text || sending) return;
    setSending(true);
    if (!customText) setInput('');

    // Optimistic
    const optimistic: DirectMessage = {
      id: `opt_${Date.now()}`,
      connection_id: connectionId,
      sender_id: currentUserId,
      sender_type: currentUserType,
      content: text,
      sent_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await sendDirectMessage(connectionId, currentUserId, currentUserType, text);
      if (currentUserType === 'lawyer' && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('lawyer_message_received', {
            detail: {
              sender_type: 'lawyer',
              sender_name: currentUserName || 'Advocate',
              content: text,
              connection_id: connectionId,
            },
          })
        );
      }
    } catch (err) {
      console.warn('sendDirectMessage error:', err);
    }

    // Reload to get canonical order
    await load();
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const cleanPhone = otherPartyPhone ? otherPartyPhone.replace(/[^0-9]/g, '') : '';
  const formattedPhone = otherPartyPhone || '+91 9876543210';

  if (compact && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full px-4 py-3 bg-[#0F1D38] hover:bg-[#1A2E55] text-[#FFFFFF] rounded-xl text-xs font-bold transition-all cursor-pointer border border-[#D98800]/30 shadow-sm"
      >
        <MessageSquare className="w-4 h-4 text-[#D98800]" />
        <span>Message {otherPartyName}</span>
        <span className="ml-auto text-[#94A3B8] flex items-center gap-1">
          {messages.length > 0 && <span className="bg-[#D98800] text-[#0F1D38] text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">{messages.length}</span>}
          <ChevronDown className="w-3.5 h-3.5" />
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full flex-1 border border-[#CBD5E1] rounded-2xl overflow-hidden bg-[#FFFFFF] shadow-xl min-h-0">
      {/* WhatsApp / Instagram Style Header */}
      <div className="bg-gradient-to-r from-[#0F1D38] via-[#1E2E4F] to-[#0F1D38] text-[#FFFFFF] p-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#D98800]/30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#D98800] text-[#0F1D38] font-black text-sm flex items-center justify-center border-2 border-[#FFFFFF] shadow-sm">
              {otherPartyName.charAt(0).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#0F1D38]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-[#FFFFFF] tracking-wide">{otherPartyName}</h3>
              {caseCategory && (
                <span className="text-[9px] font-bold text-[#D98800] bg-[#0F1D38] px-2 py-0.5 rounded-full border border-[#D98800]/40 capitalize">
                  {caseCategory}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#22C55E] font-bold flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-[#D98800]" />
              <span className="font-mono">{formattedPhone}</span>
            </p>
          </div>
        </div>

        {/* Quick Contact & Info Actions */}
        <div className="flex items-center gap-2">
          {cleanPhone && (
            <>
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-[#FFFFFF] text-[11px] font-bold rounded-xl shadow-xs transition-all"
                title="Call Directly"
              >
                <Phone className="w-3 h-3" />
                <span className="hidden sm:inline">Call</span>
              </a>
              <a
                href={`https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#25D366] hover:bg-[#1DA851] text-[#FFFFFF] text-[11px] font-bold rounded-xl shadow-xs transition-all"
                title="Open WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </>
          )}

          {caseSummary && (
            <button
              onClick={() => setShowSummaryDrawer(!showSummaryDrawer)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 text-[#D98800] text-[11px] font-bold rounded-xl border border-[#D98800]/30 transition-all cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{showSummaryDrawer ? 'Hide Case' : 'Case AI Details'}</span>
            </button>
          )}

          {compact && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-[#94A3B8] hover:text-[#FFFFFF] text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Collapsible AI Case Details Drawer */}
      {showSummaryDrawer && caseSummary && (
        <div className="bg-[#FFFBF0] border-b border-[#FDE68A] p-3.5 space-y-2 animate-fade-in text-xs text-[#0F1D38] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-extrabold text-[#D98800]">
              <Sparkles className="w-4 h-4" />
              <span>AI Case Briefing & Summary:</span>
            </div>
            {caseTitle && <span className="font-bold text-[#64748B] text-[11px]">{caseTitle}</span>}
          </div>
          <p className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#FDE68A] text-[#334155] leading-relaxed">
            {caseSummary}
          </p>
        </div>
      )}

      {/* Message History Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F1F5F9] min-h-0 h-full">
        {loading ? (
          <div className="flex items-center justify-center h-full pt-8">
            <div className="w-6 h-6 border-3 border-[#D98800] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center pt-8 space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#E2E8F0] flex items-center justify-center mx-auto text-[#64748B]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-xs text-[#475569] font-bold">Start direct communication with {otherPartyName}</p>
            <p className="text-[10px] text-[#64748B] max-w-xs mx-auto">
              Messages sent here are encrypted and delivered instantly. You can also contact via WhatsApp or Phone call above.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId || msg.sender_type === currentUserType;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[80%] space-y-0.5">
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isMine
                        ? 'bg-[#0F1D38] text-[#FFFFFF] rounded-br-none border border-[#0F1D38]'
                        : 'bg-[#FFFFFF] text-[#0F172A] border border-[#CBD5E1] rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className={`flex items-center gap-1 text-[9px] text-[#64748B] ${isMine ? 'justify-end' : 'justify-start'} px-1`}>
                    <span>{formatTime(msg.sent_at)}</span>
                    {isMine && <CheckCheck className="w-3 h-3 text-[#10B981]" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Legal Response Chips (For Advocates) */}
      {currentUserType === 'lawyer' && (
        <div className="px-3 py-2 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center gap-2 overflow-x-auto no-scrollbar text-[10px] shrink-0">
          <span className="text-[#64748B] font-bold shrink-0">Quick Replies:</span>
          {[
            'I have reviewed your AI case summary.',
            'Please send relevant deed / agreement photos.',
            'When are you free for a brief call?',
            'I will prepare the draft petition notice.',
          ].map((chip) => (
            <button
              key={chip}
              onClick={() => handleSend(chip)}
              className="bg-[#FFFFFF] hover:bg-[#0F1D38] text-[#0F1D38] hover:text-[#FFFFFF] border border-[#CBD5E1] px-2.5 py-1 rounded-full font-semibold transition-all shrink-0 cursor-pointer shadow-2xs"
            >
              + {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input Row - Pinned at bottom */}
      <div className="p-3 sm:p-4 border-t border-[#CBD5E1] bg-[#FFFFFF] flex gap-2 items-center shrink-0 w-full">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={currentUserType === 'lawyer' ? `Message ${otherPartyName}...` : 'Write a message to your advocate...'}
          className="flex-1 text-xs text-[#0F172A] bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#D98800] rounded-xl px-4 py-3 outline-none font-medium w-full"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || sending}
          className="bg-[#0F1D38] hover:bg-[#1E2E4F] disabled:opacity-40 text-[#D98800] px-4 py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-sm"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-[#D98800] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

