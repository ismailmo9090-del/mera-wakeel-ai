import React, { useState } from 'react';
import { Star, X, Check, Award, MessageSquare, User } from 'lucide-react';
import { submitLawyerReview, trackEvent } from '../lib/supabase';
import { Logo } from './Logo';

interface ReviewModalProps {
  lawyerId: string;
  lawyerName: string;
  citizenId: string;
  lawyerPhotoUrl?: string;
  specialty?: string[];
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  lawyerId,
  lawyerName,
  citizenId,
  lawyerPhotoUrl,
  specialty,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      await submitLawyerReview(lawyerId, citizenId, rating, reviewText.trim());
      trackEvent('review_submitted', { lawyer_id: lawyerId, rating, user_id: citizenId });
      setSubmitted(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.warn('Error submitting review:', err);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0F172A] border border-[#1E2E4F] rounded-3xl shadow-2xl overflow-hidden text-white my-auto">
        
        {/* Header */}
        <div className="p-4 bg-[#070D18] border-b border-[#1E2E4F] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo variant="light" className="scale-90 origin-left" />
            <div className="hidden sm:block text-[11px] bg-[#F5A623]/20 text-[#F5A623] px-2 py-0.5 rounded-full font-bold">
              Feedback Form
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Thank You for Your Feedback!</h4>
            <p className="text-xs text-slate-300">Your review and rating have been recorded to help other citizens.</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            
            {/* Advocate Card Info */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              {lawyerPhotoUrl ? (
                <img src={lawyerPhotoUrl} alt={lawyerName} className="w-12 h-12 rounded-full object-cover border border-[#F5A623]/30" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#1E2E4F] flex items-center justify-center text-[#F5A623]">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold text-white">{lawyerName}</h4>
                <p className="text-[11px] text-amber-400 font-medium">Verified Legal Advocate</p>
                {specialty && specialty.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-0.5">{specialty.slice(0, 2).join(' • ')}</p>
                )}
              </div>
            </div>

            {/* Star Rating Select */}
            <div className="text-center space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Select Consultation Star Rating</label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        (hoverRating || rating) >= star
                          ? 'text-[#F5A623] fill-[#F5A623]'
                          : 'text-slate-600 fill-slate-800'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-amber-400 font-semibold">
                {rating === 5 ? '⭐ Excellent Legal Consultation' :
                 rating === 4 ? '⭐ Very Good Guidance' :
                 rating === 3 ? '⭐ Satisfactory' :
                 rating === 2 ? '⭐ Needs Improvement' : '⭐ Poor Experience'}
              </p>
            </div>

            {/* Text Feedback */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#F5A623]" />
                <span>Write Your Review (Optional)</span>
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience (e.g. Adv. explained property deed clauses clearly and guided on next court steps...)"
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F5A623]"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 bg-[#F5A623] hover:bg-[#D98800] text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span className="animate-pulse">Submitting Review...</span>
              ) : (
                <span>Submit Advocate Review</span>
              )}
            </button>

          </div>
        )}
      </div>
    </div>
  );
};
