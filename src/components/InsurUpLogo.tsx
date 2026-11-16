import React from 'react';

interface InsurUpLogoProps {
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export const InsurUpLogo: React.FC<InsurUpLogoProps> = ({
  theme = 'dark',
  size = 'md',
}) => {
  const iconDimensions =
    size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-9 h-9' : 'w-7 h-7';
  const textClass =
    size === 'sm'
      ? 'text-lg'
      : size === 'lg'
        ? 'text-2xl'
        : 'text-xl';

  return (
    <div className="inline-flex items-center gap-2.5 select-none whitespace-nowrap shrink-0">
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={iconDimensions}
        aria-hidden="true"
      >
        {/* Top-left blue block */}
        <path
          d="M11 3H19L16 14H8L11 3Z"
          fill="#2563EB"
        />
        {/* Bottom-right blue block */}
        <path
          d="M20 22H28L25 33H17L20 22Z"
          fill="#2563EB"
        />
        {/* Left-bottom light cyan block */}
        <path
          d="M3 19L14 16V24L3 27V19Z"
          fill="#60A5FA"
        />
        {/* Right-top light cyan block */}
        <path
          d="M22 12L33 9V17L22 20V12Z"
          fill="#60A5FA"
        />
      </svg>
      <span
        className={`font-display font-bold tracking-tight ${textClass} ${
          theme === 'light' ? 'text-white' : 'text-slate-900'
        }`}
      >
        InsurUp
      </span>
    </div>
  );
};
