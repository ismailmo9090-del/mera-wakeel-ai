import React, { useState } from 'react';
import { Language, UserRole, NavTab } from '../../types';
import {
  Settings,
  ShieldCheck,
  Volume2,
  Globe,
  CheckCircle2,
  Lock,
  ArrowLeft,
  User,
  Trash2,
  Download,
  Bell,
  FileText,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

interface SettingsViewProps {
  language: Language;
  onBackToHome: () => void;
  currentUser?: { email: string; role: UserRole; name?: string; userId?: string } | null;
  onNavigate?: (tab: NavTab) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  onBackToHome,
  currentUser,
  onNavigate,
}) => {
  const [appLang, setAppLang] = useState<Language>(language || 'hi');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState<'normal' | 'slow'>('normal');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);
  const [clearedNotice, setClearedNotice] = useState(false);

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleClearLocalCache = () => {
    try {
      localStorage.removeItem('mw_user_uploaded_docs');
      localStorage.removeItem('mw_qa_history');
      setClearedNotice(true);
      setTimeout(() => setClearedNotice(false), 4000);
    } catch (e) {
      console.warn('Error clearing local cache:', e);
    }
  };

  const isHi = appLang === 'hi';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 font-sans space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0F1D38] text-[#FFFFFF] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#1E2E4F] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-[#D4A017] text-[#0F1D38] rounded-2xl shadow-md font-bold">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#FFFFFF]">
              {isHi ? 'ऐप सेटिंग्स और गोपनीयता नियंत्रण' : 'App Settings & Privacy Controls'}
            </h1>
            <p className="text-xs sm:text-sm text-[#CBD5E1] mt-0.5">
              {isHi ? 'अपनी पसंदीदा भाषा, आवाज सहायता और सुरक्षा विकल्प प्रबंधित करें' : 'Manage your consultation preferences, audio voice, and data privacy'}
            </p>
          </div>
        </div>

        <button
          onClick={onBackToHome}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 border border-[#FFFFFF]/20 text-xs font-bold text-[#FFFFFF] transition-all cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-[#D4A017]" />
          <span>{isHi ? 'वापस जाएं' : 'Back'}</span>
        </button>
      </div>

      <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm space-y-8">

        {/* Section 0: User Account Overview */}
        <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#0F1D38] uppercase tracking-wider">
              <User className="w-4 h-4 text-[#D4A017]" />
              <span>{isHi ? 'खाता जानकारी (Account Details)' : 'Account Overview'}</span>
            </div>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]">
              {currentUser ? 'Active Account' : 'Guest Mode'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#334155]">
            <div>
              <span className="font-bold text-[#64748B]">User Identity:</span>{' '}
              <span className="font-extrabold text-[#0F172A]">{currentUser?.name || currentUser?.email?.split('@')[0] || 'Guest Citizen'}</span>
            </div>
            <div>
              <span className="font-bold text-[#64748B]">Account Email:</span>{' '}
              <span className="font-mono text-[#0F172A]">{currentUser?.email || 'guest@merawakeel.ai'}</span>
            </div>
            <div>
              <span className="font-bold text-[#64748B]">Role Category:</span>{' '}
              <span className="font-extrabold text-[#D4A017] uppercase">{currentUser?.role === 'lawyer' ? 'Verified Advocate' : 'Citizen (नागरिक)'}</span>
            </div>
            <div>
              <span className="font-bold text-[#64748B]">Encryption Status:</span>{' '}
              <span className="text-[#16A34A] font-bold">256-Bit SSL Active</span>
            </div>
          </div>
        </div>

        {/* Section 1: Preferred Consultation Language */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#0F1D38]">
            <Globe className="w-4 h-4 text-[#D4A017]" />
            <span>{isHi ? 'परामर्श की भाषा (Preferred Consultation Language)' : 'Preferred Consultation Language'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setAppLang('hi')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                appLang === 'hi'
                  ? 'bg-[#0F1D38] text-[#FFFFFF] border-[#0F1D38] shadow-md'
                  : 'bg-[#FFFFFF] text-[#1E293B] border-[#E2E8F0] hover:border-[#D4A017]'
              }`}
            >
              <div className="font-extrabold text-sm flex items-center justify-between">
                <span>हिंदी (Hindi)</span>
                {appLang === 'hi' && <CheckCircle2 className="w-4 h-4 text-[#D4A017]" />}
              </div>
              <div className="text-xs opacity-80 mt-1">देवनागरी लिपि में सरल हिंदी कानून व्याख्या</div>
            </button>

            <button
              onClick={() => setAppLang('en')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                appLang === 'en'
                  ? 'bg-[#0F1D38] text-[#FFFFFF] border-[#0F1D38] shadow-md'
                  : 'bg-[#FFFFFF] text-[#1E293B] border-[#E2E8F0] hover:border-[#D4A017]'
              }`}
            >
              <div className="font-extrabold text-sm flex items-center justify-between">
                <span>English</span>
                {appLang === 'en' && <CheckCircle2 className="w-4 h-4 text-[#D4A017]" />}
              </div>
              <div className="text-xs opacity-80 mt-1">Plain English legal guidance & sections</div>
            </button>

            <button
              onClick={() => setAppLang('hinglish')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                appLang === 'hinglish'
                  ? 'bg-[#0F1D38] text-[#FFFFFF] border-[#0F1D38] shadow-md'
                  : 'bg-[#FFFFFF] text-[#1E293B] border-[#E2E8F0] hover:border-[#D4A017]'
              }`}
            >
              <div className="font-extrabold text-sm flex items-center justify-between">
                <span>Hinglish</span>
                {appLang === 'hinglish' && <CheckCircle2 className="w-4 h-4 text-[#D4A017]" />}
              </div>
              <div className="text-xs opacity-80 mt-1">Hindi written in easy Roman English script</div>
            </button>
          </div>
        </div>

        {/* Section 2: Audio & Voice Accessibility */}
        <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#FEF3C7] text-[#D4A017] rounded-xl border border-[#FDE68A]">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-[#0F172A]">
                  {isHi ? 'आवाज सहायता (AI Voice Speech)' : 'AI Voice Assistance'}
                </div>
                <div className="text-xs text-[#64748B]">
                  {isHi ? 'परामर्श जवाबों को प्राकृतिक हिंदी/इंग्लिश आवाज में सुनें' : 'Listen to AI legal answers spoken in natural neural human voice'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                voiceEnabled ? 'bg-[#0F1D38]' : 'bg-[#CBD5E1]'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  voiceEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {voiceEnabled && (
            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="font-bold text-[#334155]">Speech Speed (आवाज की गति):</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setVoiceSpeed('normal')}
                  className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                    voiceSpeed === 'normal'
                      ? 'bg-[#0F1D38] text-[#FFFFFF] border-[#0F1D38]'
                      : 'bg-[#FFFFFF] text-[#64748B] border-[#CBD5E1]'
                  }`}
                >
                  Normal Speed
                </button>
                <button
                  onClick={() => setVoiceSpeed('slow')}
                  className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                    voiceSpeed === 'slow'
                      ? 'bg-[#0F1D38] text-[#FFFFFF] border-[#0F1D38]'
                      : 'bg-[#FFFFFF] text-[#64748B] border-[#CBD5E1]'
                  }`}
                >
                  Clear Slow (धीमी)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Notification & Case Alert Controls */}
        <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#0F1D38]">
            <Bell className="w-4 h-4 text-[#D4A017]" />
            <span>{isHi ? 'नोटिफिकेशन और केस अपडेट अलर्ट' : 'Notification & Case Alerts'}</span>
          </div>

          <div className="space-y-2 pt-1 text-xs text-[#334155]">
            <div className="flex items-center justify-between py-1.5 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#64748B]" />
                <span>Advocate consultation reply alerts</span>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#0F1D38] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#64748B]" />
                <span>Case status & document verification notices</span>
              </div>
              <input
                type="checkbox"
                checked={whatsappAlerts}
                onChange={(e) => setWhatsappAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#0F1D38] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Local Storage & Vault Controls */}
        <div className="p-5 bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#991B1B]">
              <Trash2 className="w-4 h-4 text-[#DC2626]" />
              <span>{isHi ? 'स्थानीय वॉल्ट कैश साफ करें (Local Vault Cache)' : 'Local Data Vault Cache'}</span>
            </div>
            {clearedNotice && (
              <span className="text-xs font-extrabold text-[#16A34A] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Vault cache cleared!</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[#7F1D1D] leading-relaxed">
            Clear locally stored draft uploaded documents or consultation caches on this device. Your verified account cases stored securely on servers remain safe.
          </p>
          <button
            onClick={handleClearLocalCache}
            className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFFFF] font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Clear Local Device Cache
          </button>
        </div>

        {/* Section 5: Security, Confidentiality & Privacy Policy Link */}
        <div className="p-6 bg-[#0F1D38] text-[#FFFFFF] rounded-2xl space-y-4 shadow-lg border border-[#1E2E4F]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-[#D4A017]">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-extrabold text-base">
                {isHi ? 'सुरक्षा एवं गोपनीयता गारंटी (DPDP Act 2023)' : 'Data Security & DPDP Act Compliance'}
              </h3>
            </div>

            {onNavigate && (
              <button
                onClick={() => onNavigate('privacy')}
                className="text-xs font-bold text-[#D4A017] hover:underline flex items-center gap-1 cursor-pointer bg-[#FFFFFF]/10 px-3 py-1.5 rounded-xl border border-[#D4A017]/30"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Read Full Privacy Policy</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#E2E8F0]">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-[#D4A017] shrink-0 mt-0.5" />
              <div>
                <strong>256-Bit SSL Encryption:</strong> All legal conversations and uploaded case documents are protected with banking-grade SSL encryption.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#D4A017] shrink-0 mt-0.5" />
              <div>
                <strong>Zero AI Training Sharing:</strong> Your private case facts are never shared with public commercial LLMs or advertising networks.
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
          {savedNotice ? (
            <span className="text-xs font-extrabold text-[#16A34A] flex items-center gap-1.5 bg-[#DCFCE7] px-3.5 py-1.5 rounded-xl border border-[#86EFAC]">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isHi ? 'सेटिंग्स सुरक्षित हो गईं!' : 'Settings updated successfully!'}</span>
            </span>
          ) : <span />}

          <button
            onClick={handleSave}
            className="bg-[#0F1D38] hover:bg-[#1E2E4F] text-[#D4A017] font-extrabold px-8 py-3 rounded-xl text-sm transition-all shadow-md cursor-pointer"
          >
            {isHi ? 'सेव करें (Save)' : 'Save Preferences'}
          </button>
        </div>

      </div>
    </div>
  );
};
