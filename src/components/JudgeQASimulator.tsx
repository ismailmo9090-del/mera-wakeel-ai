import React, { useState } from 'react';
import { QAHistoryItem } from '../types';
import { MessageSquareText, Send, Sparkles, X, Brain, HelpCircle, Loader2 } from 'lucide-react';

interface JudgeQASimulatorProps {
  currentSlideTitle: string;
  onClose: () => void;
}

const PRESET_JUDGE_QUESTIONS = [
  'How do you handle AI hallucinations in legal advice?',
  'Is giving legal analysis considered unauthorized practice of law in India?',
  'How do you vectorize & chunk Indian Acts for RAG retrieval?',
  'What is your monetization strategy for the two-sided marketplace?',
  'How do you protect sensitive document data uploaded by users?'
];

export const JudgeQASimulator: React.FC<JudgeQASimulatorProps> = ({
  currentSlideTitle,
  onClose,
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QAHistoryItem[]>([
    {
      id: '1',
      question: 'How do you prevent hallucinations when giving legal guidance?',
      answer: 'We use a multi-stage RAG framework strictly anchored to indexed Indian statutes (BNS, IPC, Specific Relief Act). Our LLM operates under strict system constraints: if a clause is ambiguous or lacks grounding, it flags "Needs Human Lawyer Handoff" rather than guessing.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const handleAsk = async (qText?: string) => {
    const query = qText || question;
    if (!query.trim() || loading) return;

    setLoading(true);
    setQuestion('');

    try {
      const res = await fetch('/api/judge-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          slideContext: currentSlideTitle
        })
      });

      const data = await res.json();
      const newItem: QAHistoryItem = {
        id: Date.now().toString(),
        question: query,
        answer: data.answer || 'Thank you for the question. Mera Wakeel AI integrates strict legal context validation with human lawyer handoff.',
        isFallback: data.isFallback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setHistory((prev) => [newItem, ...prev]);
    } catch (err) {
      console.error('Error asking judge Q&A:', err);
      const fallbackItem: QAHistoryItem = {
        id: Date.now().toString(),
        question: query,
        answer: 'Our RAG pipeline indexes verified Gazette notifications and Supreme Court judgments using hybrid vector search (Pinecone + BM25 keyword matching) to achieve high recall on Indian legal sections.',
        isFallback: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHistory((prev) => [fallbackItem, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] z-40 bg-[#070b19]/95 backdrop-blur-xl border-l border-blue-500/30 text-white flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-[#0a1128] border-b border-blue-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Technical Judge Q&A Assistant
              <span className="px-1.5 py-0.5 text-[9px] font-mono bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                AI Tech Lead
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Context: {currentSlideTitle}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Preset Judge Question Chips */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800">
        <p className="text-[11px] font-mono uppercase text-slate-400 mb-2 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> Common Judge Questions:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_JUDGE_QUESTIONS.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(pq)}
              disabled={loading}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 transition-all text-left truncate max-w-full"
            >
              "{pq}"
            </button>
          ))}
        </div>
      </div>

      {/* Q&A Conversation History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.map((item) => (
          <div key={item.id} className="space-y-2">
            <div className="flex justify-end">
              <div className="max-w-[85%] p-3 rounded-2xl rounded-tr-none bg-blue-600/20 border border-blue-500/40 text-xs sm:text-sm text-blue-100 font-medium">
                <p className="text-[10px] text-blue-400 font-mono mb-1">Judge Asked:</p>
                {item.question}
              </div>
            </div>

            <div className="flex justify-start">
              <div className="max-w-[90%] p-3.5 rounded-2xl rounded-tl-none bg-slate-900 border border-amber-500/30 text-xs sm:text-sm text-slate-200 leading-relaxed shadow-lg">
                <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono text-amber-400 border-b border-amber-500/20 pb-1">
                  <span className="flex items-center gap-1 font-bold">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Founder Response:
                  </span>
                  <span className="text-slate-500">{item.timestamp}</span>
                </div>
                <p>{item.answer}</p>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 text-slate-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>AI Founder formulating technical response...</span>
          </div>
        )}
      </div>

      {/* Question Input */}
      <div className="p-3 bg-[#0a1128] border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask any technical judge question..."
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-40 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
