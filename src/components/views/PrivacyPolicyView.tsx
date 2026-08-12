import React from 'react';
import { Language, NavTab } from '../../types';
import { ShieldCheck, Lock, FileText, UserCheck, Eye, ArrowLeft, Mail, Phone, Scale } from 'lucide-react';

interface PrivacyPolicyViewProps {
  language: Language;
  onBackToHome: () => void;
  onNavigate?: (tab: NavTab) => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ language, onBackToHome, onNavigate }) => {
  const isHi = language === 'hi';

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header Card */}
        <div className="bg-[#0F1D38] text-[#FFFFFF] rounded-3xl p-6 sm:p-10 shadow-xl border border-[#1E2E4F] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4A017]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#FFFFFF]/15 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#D4A017] text-[#0F1D38] rounded-2xl shadow-md font-bold">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FFFFFF]">
                  {isHi ? 'गोपनीयता और डेटा सुरक्षा नीति' : 'Privacy Policy & Data Security'}
                </h1>
                <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1">
                  DPDP Act 2023 Compliant • End-to-End Encrypted Legal Advisory
                </p>
              </div>
            </div>

            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 border border-[#FFFFFF]/20 text-xs font-bold text-[#FFFFFF] transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-[#D4A017]" />
              <span>{isHi ? 'होमपेज पर जाएं' : 'Back to Home'}</span>
            </button>
          </div>

          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#E2E8F0] relative z-10">
            <div className="p-3.5 bg-[#FFFFFF]/5 rounded-2xl border border-[#FFFFFF]/10 flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-[#D4A017] shrink-0" />
              <span>256-Bit SSL Encryption</span>
            </div>
            <div className="p-3.5 bg-[#FFFFFF]/5 rounded-2xl border border-[#FFFFFF]/10 flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-[#D4A017] shrink-0" />
              <span>100% Client Confidentiality</span>
            </div>
            <div className="p-3.5 bg-[#FFFFFF]/5 rounded-2xl border border-[#FFFFFF]/10 flex items-center gap-2.5">
              <Scale className="w-4 h-4 text-[#D4A017] shrink-0" />
              <span>Zero-Training AI Isolation</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-10 border border-[#E2E8F0] shadow-sm space-y-8 text-[#1E293B] text-sm leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#0F1D38] font-extrabold text-base border-b border-[#E2E8F0] pb-2">
              <FileText className="w-5 h-5 text-[#D4A017]" />
              <h2>1. Introduction & Regulatory Compliance</h2>
            </div>
            <p>
              At <strong>Mera Wakeel AI</strong>, we recognize the sensitive nature of legal matters and documents. This Privacy Policy outlines our commitment to protecting user personal information, legal consultations, and uploaded legal documents in full accordance with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> of India and global data protection standards.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#0F1D38] font-extrabold text-base border-b border-[#E2E8F0] pb-2">
              <Eye className="w-5 h-5 text-[#D4A017]" />
              <h2>2. Information We Collect</h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-[#334155]">
              <li><strong>User Profile Data:</strong> Name, email address, phone number, city, state, and language preference during account registration.</li>
              <li><strong>Advocate Registration Data:</strong> State Bar Council enrollment number, practice city, years of experience, fee structure, and legal specialties for verified advocates.</li>
              <li><strong>Legal Query & Chat Inputs:</strong> Text queries submitted during AI legal consultations regarding disputes, property matters, family law, criminal proceedings, or consumer complaints.</li>
              <li><strong>Uploaded Legal Documents:</strong> Document images or PDFs uploaded for AI analysis (e.g., Sale Deeds, Wills, Lease Agreements, FIR copies, Stamp Papers).</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#0F1D38] font-extrabold text-base border-b border-[#E2E8F0] pb-2">
              <Lock className="w-5 h-5 text-[#D4A017]" />
              <h2>3. How We Use & Protect Your Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-1.5">
                <h3 className="font-bold text-[#0F1D38] text-xs uppercase tracking-wide">End-to-End Encryption</h3>
                <p className="text-xs text-[#64748B]">All data transmissions between your browser and our secure servers use 256-bit SSL encryption. Uploaded documents are stored in private isolated vaults.</p>
              </div>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-1.5">
                <h3 className="font-bold text-[#0F1D38] text-xs uppercase tracking-wide">Zero Commercial AI Training</h3>
                <p className="text-xs text-[#64748B]">Your private legal documents and consultation histories are NEVER used to train public commercial AI models or shared with advertising networks.</p>
              </div>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-1.5">
                <h3 className="font-bold text-[#0F1D38] text-xs uppercase tracking-wide">Confidential Lawyer Matching</h3>
                <p className="text-xs text-[#64748B]">Your personal contact details are only shared with a Bar Council verified advocate when you explicitly request a direct consultation.</p>
              </div>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-1.5">
                <h3 className="font-bold text-[#0F1D38] text-xs uppercase tracking-wide">Local Session Isolation</h3>
                <p className="text-xs text-[#64748B]">You retain full control to clear your local session cache or delete individual uploaded documents from your vault at any time.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#0F1D38] font-extrabold text-base border-b border-[#E2E8F0] pb-2">
              <UserCheck className="w-5 h-5 text-[#D4A017]" />
              <h2>4. Your Rights under Indian Law (DPDP Act 2023)</h2>
            </div>
            <p>Under the Digital Personal Data Protection Act 2023, you hold the following explicit rights:</p>
            <div className="space-y-2 text-xs text-[#334155] pl-2">
              <p>• <strong>Right to Access:</strong> View all saved legal cases, consultation notes, and uploaded documents in your account dashboard.</p>
              <p>• <strong>Right to Correction & Erasure:</strong> Modify profile information or request permanent deletion of your stored cases and account data.</p>
              <p>• <strong>Right to Withdraw Consent:</strong> Revoke consent for advocate lead sharing or document storage instantly via Settings.</p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 pt-4 border-t border-[#E2E8F0]">
            <div className="flex items-center gap-2.5 text-[#0F1D38] font-extrabold text-base">
              <Mail className="w-5 h-5 text-[#D4A017]" />
              <h2>5. Contact Data Protection Officer</h2>
            </div>
            <p className="text-xs text-[#64748B]">
              If you have any questions, grievances, or requests regarding your legal data privacy, please contact our Data Protection Desk:
            </p>
            <div className="p-4 bg-[#0F1D38] text-[#FFFFFF] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-[#D4A017]">Mera Wakeel AI Privacy Desk</div>
                <div className="text-[#CBD5E1]">Email: support@merawakeel.ai | privacy@merawakeel.ai</div>
              </div>
              <button
                onClick={onBackToHome}
                className="px-4 py-2 rounded-xl bg-[#D4A017] text-[#0F1D38] font-bold text-xs hover:bg-[#C27900] transition-colors cursor-pointer"
              >
                Return to App
              </button>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
};
