import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  variant?: 'burgundy' | 'dark' | 'light';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = false,
  variant = 'burgundy',
  className = '',
}) => {
  // Size classes
  const iconSizes = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-9 h-9 text-base',
    lg: 'w-12 h-12 text-xl',
    xl: 'w-16 h-16 text-3xl',
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const taglineSizes = {
    sm: 'text-[9px] tracking-[0.22em]',
    md: 'text-[10px] tracking-[0.25em]',
    lg: 'text-xs tracking-[0.28em]',
    xl: 'text-sm tracking-[0.3em]',
  };

  // Color mappings
  const primaryColor = variant === 'light' ? '#F5F0E8' : variant === 'dark' ? '#111111' : '#8B1E3F';
  const textColor = variant === 'light' ? '#FFFFFF' : '#111111';

  return (
    <div className={`flex flex-col items-start select-none ${className}`}>
      <div className="flex items-center gap-2">
        {/* Minimalist Lowercase "d" Icon Symbol */}
        <div
          className={`${iconSizes[size]} flex items-center justify-center rounded-2xl font-bold font-serif shadow-sm transition-transform hover:scale-105`}
          style={{
            backgroundColor: primaryColor,
            color: '#F5F0E8',
          }}
          title="drippy logo"
        >
          <span className="font-extrabold tracking-tighter leading-none italic font-sans" style={{ fontSize: '120%' }}>
            d
          </span>
        </div>

        {/* Lowercase Wordmark */}
        <span
          className={`font-extrabold tracking-tight ${textSizes[size]} font-sans lowercase`}
          style={{ color: textColor }}
        >
          drippy
        </span>
      </div>

      {/* Official Tagline */}
      {showTagline && (
        <span
          className={`font-semibold uppercase text-[#777777] mt-1 ${taglineSizes[size]}`}
          style={{ letterSpacing: '0.22em' }}
        >
          DRIP. SERVED DAILY.
        </span>
      )}
    </div>
  );
};
