import React from 'react';
import { Logo } from './Logo';
import { UserProfile } from '../types';
import { Flame, Bell } from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  onOpenStreakModal?: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenStreakModal,
  onOpenProfile,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F5F0E8]/90 backdrop-blur-md px-4 py-3 border-b border-[#D8D0C4]/60 flex items-center justify-between">
      <Logo size="sm" showTagline={false} />

      <div className="flex items-center gap-2.5">
        {/* Streak Quick Indicator */}
        <button
          onClick={onOpenStreakModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#8B1E3F]/10 border border-[#8B1E3F]/20 text-[#8B1E3F] hover:bg-[#8B1E3F]/15 transition-all active:scale-95"
          title="Drip Streak"
        >
          <Flame className="w-4 h-4 fill-[#8B1E3F] animate-pulse" />
          <span className="font-bold text-sm leading-none">{user.currentStreak}</span>
        </button>

        {/* User Profile Avatar */}
        <button
          onClick={onOpenProfile}
          className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#111111]/10 hover:border-[#8B1E3F] transition-all active:scale-95"
          title={user.name}
        >
          <img
            src={user.profileImage}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </header>
  );
};
