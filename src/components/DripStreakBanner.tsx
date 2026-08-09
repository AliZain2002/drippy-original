import React from 'react';
import { Flame, Trophy, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface DripStreakBannerProps {
  user: UserProfile;
  onOpenCreateLook?: () => void;
}

export const DripStreakBanner: React.FC<DripStreakBannerProps> = ({
  user,
  onOpenCreateLook,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#8B1E3F] to-[#5C1329] text-[#F5F0E8] p-5 shadow-md border border-[#8B1E3F]/30">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          {/* Flame Icon Container */}
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
            <Flame className="w-7 h-7 text-amber-400 fill-amber-400 animate-bounce" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white font-sans">
                {user.currentStreak} DAY DRIP STREAK
              </span>
            </div>
            <p className="text-xs text-[#F5F0E8]/80 font-medium mt-0.5">
              Keep the drip going. Tomorrow's drip is waiting.
            </p>
          </div>
        </div>

        {onOpenCreateLook && (
          <button
            onClick={onOpenCreateLook}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#F5F0E8] text-[#8B1E3F] font-bold text-xs shadow-sm hover:bg-white active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#8B1E3F]" />
            <span>Generate Fit</span>
          </button>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#F5F0E8]/70 font-medium">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-300" />
          <span>Longest Streak: <strong className="text-white">{user.longestStreak} Days</strong></span>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#F5F0E8]/60">
          DRIP. SERVED DAILY.
        </span>
      </div>
    </div>
  );
};
