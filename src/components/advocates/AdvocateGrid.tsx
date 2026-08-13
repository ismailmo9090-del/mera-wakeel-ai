import React from 'react';
import { type Lawyer } from '../../types/database';
import { AdvocateCard } from './AdvocateCard';

interface AdvocateGridProps {
  advocates: Lawyer[];
  onRequest: (advocate: Lawyer) => void;
  onRate: (advocate: Lawyer) => void;
  onProfile: (advocate: Lawyer) => void;
}

/**
 * Responsive grid of real advocate cards — 3 columns desktop, 2 tablet,
 * 1 mobile. Renders exactly one <AdvocateCard /> per directory record.
 */
export const AdvocateGrid: React.FC<AdvocateGridProps> = ({ advocates, onRequest, onRate, onProfile }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {advocates.map((advocate) => (
      <AdvocateCard
        key={advocate.id}
        advocate={advocate}
        onRequest={onRequest}
        onRate={onRate}
        onProfile={onProfile}
      />
    ))}
  </div>
);

export default AdvocateGrid;