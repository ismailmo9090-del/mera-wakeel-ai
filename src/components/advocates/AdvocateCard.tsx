import React from 'react';
import { MapPin, Star, ChevronRight, ShieldCheck, Scale, IndianRupee } from 'lucide-react';
import { type Lawyer } from '../../types/database';

interface AdvocateCardProps {
  advocate: Lawyer;
  onRequest: (advocate: Lawyer) => void;
  onRate: (advocate: Lawyer) => void;
  onProfile: (advocate: Lawyer) => void;
}

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80';

export const displayName = (l: Lawyer): string => {
  const raw = l.profile?.full_name || 'Advocate';
  return /^adv\.?\s/i.test(raw) ? raw : `Adv. ${raw}`;
};

export const initials = (l: Lawyer): string =>
  (l.profile?.full_name || 'A')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const feeText = (l: Lawyer): string =>
  l.consultation_fee_range ? l.consultation_fee_range : 'On Request';

/**
 * Single advocate card bound to real directory data. Photo (with verified
 * badge), identity/location, experience + rating stats, specialty tag chips
 * (first 3 + overflow count), and consultation fee + action buttons.
 */
export const AdvocateCard: React.FC<AdvocateCardProps> = ({ advocate, onRequest, onRate, onProfile }) => {
  const name = displayName(advocate);
  const city = advocate.profile?.city || '';
  const state = advocate.profile?.state || '';
  const specialty = advocate.specialty?.[0] || 'Legal Advocate';
  const tags = advocate.specialty || [];
  const shownTags = tags.slice(0, 3);
  const extraTags = tags.length - shownTags.length;

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#D97706] rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ease-out flex flex-col justify-between gap-5">
      {/* Top row: photo + identity */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {advocate.profile_photo_url ? (
            <img
              src={advocate.profile_photo_url}
              alt={name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#E2E8F0] bg-[#F1F5F9]"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#E2E8F0] text-[#475569] flex items-center justify-center font-extrabold text-lg border-2 border-[#E2E8F0]">
              {initials(advocate)}
            </div>
          )}
          {advocate.is_verified && (
            <span
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#D97706] text-[#FFFFFF] border-2 border-[#FFFFFF] flex items-center justify-center"
              title="Verified Advocate"
            >
              <ShieldCheck className="w-3 h-3" />
            </span>
          )}
        </div>

        <div className="space-y-1 min-w-0">
          <h3 className="text-[15px] font-extrabold text-[#0F172A] truncate">{name}</h3>
          <p className="text-xs font-bold text-[#D97706] truncate">{specialty}</p>
          <p className="text-[11px] text-[#64748B] flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#94A3B8] shrink-0" />
            <span className="truncate">
              {[city, state].filter(Boolean).join(', ') || 'India'}
            </span>
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5">
          <p className="text-[10px] text-[#64748B] font-bold">Experience</p>
          <p className="text-sm font-extrabold text-[#0F172A]">
            {advocate.years_experience || 0} Yrs
          </p>
        </div>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5">
          <p className="text-[10px] text-[#64748B] font-bold">Rating</p>
          <p className="text-sm font-extrabold text-[#D97706] flex items-center justify-center gap-1">
            <Star className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
            {advocate.rating_avg || 0}
            <span className="text-[#94A3B8] font-semibold text-[10px]">({advocate.review_count || 0})</span>
          </p>
        </div>
      </div>

      {/* Tag chips */}
      <div className="flex flex-wrap gap-1.5 min-h-[26px]">
        {shownTags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-[#F1F5F9] text-[#334155] text-[10px] font-bold rounded-full border border-[#E2E8F0]"
          >
            {tag}
          </span>
        ))}
        {extraTags > 0 && (
          <span className="px-2 py-1 bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold rounded-full border border-[#FDE68A]">
            +{extraTags} more
          </span>
        )}
      </div>

      {/* Bottom row: fee + actions */}
      <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#64748B]">Consultation</span>
          <span className="text-xs font-extrabold text-[#0F172A] flex items-center gap-1">
            <IndianRupee className="w-3 h-3 text-[#D97706]" />
            {feeText(advocate)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onRequest(advocate)}
            className="px-2 py-2 bg-[#D97706] hover:bg-[#B45309] text-[#FFFFFF] text-[11px] font-extrabold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <Scale className="w-3.5 h-3.5" />
            Request
          </button>
          <button
            type="button"
            onClick={() => onRate(advocate)}
            className="px-2 py-2 bg-[#FFFFFF] border border-[#D97706] text-[#D97706] hover:bg-[#FEF3C7] text-[11px] font-extrabold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <Star className="w-3.5 h-3.5" />
            Rate
          </button>
          <button
            type="button"
            onClick={() => onProfile(advocate)}
            className="px-2 py-2 bg-[#0A1628] hover:bg-[#1E293B] text-[#FFFFFF] text-[11px] font-extrabold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            Profile
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvocateCard;