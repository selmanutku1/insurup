import React from 'react';

interface InsurUpLogoProps {
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  href?: string | null;
}

export const InsurUpLogo: React.FC<InsurUpLogoProps> = ({
  theme = 'dark',
  size = 'md',
  iconOnly = false,
  href = iconOnly ? null : 'https://www.insurup.com',
}) => {
  const heightClass = iconOnly
    ? size === 'sm'
      ? 'h-6 w-6'
      : size === 'lg'
        ? 'h-9 w-9'
        : 'h-7 w-7'
    : size === 'sm'
      ? 'h-5'
      : size === 'lg'
        ? 'h-8'
        : 'h-7';

  const logoSrc = iconOnly
    ? '/assets/insurup-icon.png'
    : theme === 'light'
      ? '/assets/insurup-light.png'
      : '/assets/aistudio/insurup_680ecac2.png';

  const imgElement = (
    <img
      src={logoSrc}
      alt="InsurUp"
      className={`${heightClass} ${iconOnly ? '' : 'w-auto'} object-contain select-none shrink-0`}
    />
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center select-none whitespace-nowrap shrink-0"
      >
        {imgElement}
      </a>
    );
  }

  return (
    <div className="inline-flex items-center select-none whitespace-nowrap shrink-0">
      {imgElement}
    </div>
  );
};
