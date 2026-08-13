import React from 'react';

/**
 * Loading placeholder that mirrors the AdvocateCard layout with a soft
 * gray pulse, shown while the real directory data is being fetched.
 */
export const AdvocateCardSkeleton: React.FC = () => (
  <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 flex flex-col gap-5">
    {/* Photo + identity */}
    <div className="flex items-start gap-4">
      <div className="w-16 h-16 rounded-full bg-slate-200 animate-pulse" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3.5 bg-slate-200 animate-pulse rounded-full w-3/4" />
        <div className="h-3 bg-slate-200 animate-pulse rounded-full w-1/2" />
        <div className="h-3 bg-slate-200 animate-pulse rounded-full w-2/3" />
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 gap-2">
      <div className="h-16 bg-slate-200/70 animate-pulse rounded-xl" />
      <div className="h-16 bg-slate-200/70 animate-pulse rounded-xl" />
    </div>

    {/* Tags */}
    <div className="flex gap-1.5">
      <div className="h-6 w-20 bg-slate-200 animate-pulse rounded-full" />
      <div className="h-6 w-16 bg-slate-200 animate-pulse rounded-full" />
      <div className="h-6 w-14 bg-slate-200 animate-pulse rounded-full" />
    </div>

    {/* Footer */}
    <div className="pt-3 border-t border-slate-100 space-y-3">
      <div className="flex justify-between">
        <div className="h-3 w-20 bg-slate-200 animate-pulse rounded-full" />
        <div className="h-3 w-16 bg-slate-200 animate-pulse rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="h-9 bg-slate-200 animate-pulse rounded-xl" />
        <div className="h-9 bg-slate-200 animate-pulse rounded-xl" />
        <div className="h-9 bg-slate-200 animate-pulse rounded-xl" />
      </div>
    </div>
  </div>
);

export default AdvocateCardSkeleton;