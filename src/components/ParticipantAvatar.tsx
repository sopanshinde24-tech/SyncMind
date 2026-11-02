import React, { useState } from 'react';
import { Participant } from '../core/types';

interface ParticipantAvatarProps {
  name: string;
  participants: Participant[];
  size?: 'sm' | 'md' | 'lg';
}

export const ParticipantAvatar: React.FC<ParticipantAvatarProps> = ({
  name,
  participants,
  size = 'sm',
}) => {
  const [imgError, setImgError] = useState(false);
  const participant = participants.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );

  const initials =
    participant?.initials ||
    name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() ||
    'U';

  const dimensions =
    size === 'lg'
      ? 'w-10 h-10 text-sm'
      : size === 'md'
      ? 'w-8 h-8 text-xs'
      : 'w-6 h-6 text-[11px]';

  if (participant?.avatarUrl && !imgError) {
    return (
      <img
        src={participant.avatarUrl}
        alt={`${name} avatar`}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${dimensions} rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100`}
      />
    );
  }

  return (
    <div
      aria-label={`${name} initials`}
      className={`${dimensions} rounded-full bg-slate-800 text-white font-medium flex items-center justify-center shrink-0 border border-slate-700`}
    >
      {initials}
    </div>
  );
};
