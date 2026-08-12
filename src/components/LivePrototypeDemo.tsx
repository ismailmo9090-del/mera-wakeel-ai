import React, { useState } from 'react';
import { DemoCaseResult } from '../types';
import { Bot, Scale, ShieldAlert, FileText, CheckCircle, AlertTriangle, X, Loader2, Sparkles, Send } from 'lucide-react';

interface LivePrototypeDemoProps {
  onClose: () => void;
}

const PRESET_CASES = [
  {
    title: 'Property Boundary Encroachment',
    desc: 'My neighbor built a boundary wall extending 3 feet into my registered ancestral agricultural plot in Pune without my consent.',
    docType: 'Registered Sale Deed & Tippani Map'
  },
  {
    title: 'Tenant Lease Expiry Non-Vacation',
    desc: 'Tenant living in my 2BHK flat for 3 years. Lease expired 8 months ago. Tenant refuses to pay rent or vacate, claiming local tenancy protection.',
    docType: 'Expired Leave & License Agreement'
  },
  {
    title: 'Illegal Shed / Unpermitted Construction',
    desc: 'I built a small tin shed extending 4 feet onto the municipal footpath in front of my shop. Municipal authority issued an eviction notice.',
    docType: 'Municipal Demolition Notice'
  }
];

export const LivePrototypeDemo: React.FC<LivePrototypeDemoProps> = ({ onClose }) => {
  const [caseDescription, setCaseDescription] = useState(PRESET_CASES[0].desc);
  const [docType, setDocType] = useState(PRESET_CASES[0].docType);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoCaseResult | null>({
    summary: 'Ancestral Property Boundary Encroachment Claim',
    applicableLaws: [
      'Section 5 & 6, Specific Relief Act, 1963 (Recovery of possession of immovable property)',
      'Indian Easements Act, 1882 (Protection of private land boundaries)',
      'Section 441, Indian Penal Code / BNS (Criminal Trespass)'
    ],
    honestyVerdict: {
      status: 'Strong Case',
      verdictText: 'YOU HAVE STRONG LEGAL STANDING. Unilateral construction over registered survey numbers without mutated consent is illegal under civil & criminal land codes.'
    },
    documentChecklist: [
      'Original Registered Sale Deed / Index II extract',
      'Government Survey Map (Akarband / Tippani)',
      'Encumbrance Certificate (EC) for the last 15 years',
      'Recent Gram Panchayat / Municipal Property Tax Receipts'
    ],
    recommendedAction: '1. Issue a formal Advocate Legal Notice giving 15 days to halt construction. 2. File an urgent injunction suit under Order 39 Rule 1 C.P.C. for a stay order.'
  });

  const handleAnalyze = async () => {
    if (!caseDescription.trim() || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/demo-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseDescription, documentType: docType })
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Error running case demo:', err);
      // Fallback
      setResult({
        summary: 'Tenant Overstay & Rent Default Dispute',
        applicableLaws: [
          'Section 106 & 111, Transfer of Property Act, 1882',
          'State Rent Control & Tenancy Protection Acts'
        ],
        honestyVerdict: {
          status: 'Weak/In the wrong',
          verdictText: 'ALERT: If you accepted informal cash rent after lease expiry without issuing a 15-day termination notice, your legal standing for immediate eviction is compromised.'
        },
        documentChecklist: [
          'Original Leave & License Agreement',
          'Bank statement showing last rent credit',
          'Written communications / WhatsApp chats'
        ],
        recommendedAction: 'Issue formal 15-day notice under Sec 106 before filing summary eviction suit.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#070b19] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden my-6 text-white">
        {/* Modal Header */}
        <div className="p-5 bg-[#0a1128] border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                Mera Wakeel AI — Interactive Prototype Demo
                <span className="px-2 py-0.5 text-[10px] uppercase font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                  Live Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Simulating document parsing, legal section retrieval, and the Honesty Principle Verdict
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Case Input */}
          <div className="lg:col-span-5 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-800 lg:pr-6 pb-6 lg:pb-0">
            <div>
              <label className="text-xs font-mono uppercase text-slate-400 block mb-2">
                Select Preset Case Scenario:
              </label>
              <div className="space-y-2">
                {PRESET_CASES.map((pc, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCaseDescription(pc.desc);
                      setDocType(pc.docType);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all border ${
                      caseDescription === pc.desc
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-semibold'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <p className="font-bold text-white mb-0.5">{pc.title}</p>
                    <p className="line-clamp-2 text-[11px]">{pc.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono uppercase text-slate-400 block mb-1">
                Describe Legal Dispute (Voice/Text):
              </label>
              <textarea
                rows={4}
                value={caseDescription}
                onChange={(e) => setCaseDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase text-slate-400 block mb-1">
                Ref / Document Upload Type:
              </label>
              <input
                type="text"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  Analyzing Legal Corpus & OCR...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  Evaluate Case with Mera Wakeel AI
                </>
              )}
            </button>
          </div>

          {/* Right Column: AI Analysis Output */}
          <div className="lg:col-span-7 space-y-4">
            {result ? (
              <div className="space-y-4">
                {/* Honesty Verdict Banner */}
                <div
                  className={`p-4 rounded-2xl border-2 shadow-lg ${
                    result.honestyVerdict?.status === 'Weak/In the wrong'
                      ? 'bg-red-950/40 border-red-500/60 text-red-200'
                      : result.honestyVerdict?.status === 'Partial Standing'
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                      : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">
                      HONESTY PRINCIPLE VERDICT: {result.honestyVerdict?.status || 'Evaluated'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                    {result.honestyVerdict?.verdictText}
                  </p>
                </div>

                {/* Applicable Sections */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <h4 className="text-xs font-mono uppercase text-amber-400 mb-2 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" /> Key Indian Statutes & Sections:
                  </h4>
                  <ul className="space-y-1">
                    {result.applicableLaws?.map((law, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <span className="text-amber-400">•</span>
                        <span>{law}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Required Documents */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <h4 className="text-xs font-mono uppercase text-blue-400 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Required Verification Documents:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {result.documentChecklist?.map((doc, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-800/60 text-[11px] text-slate-300 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actionable Next Steps */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/30">
                  <h4 className="text-xs font-mono uppercase text-amber-300 mb-1 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Recommended Legal Action Plan:
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {result.recommendedAction}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <Bot className="w-12 h-12 mb-2 text-slate-700" />
                <p className="text-xs">Click "Evaluate Case" to test the AI legal reasoning engine.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
