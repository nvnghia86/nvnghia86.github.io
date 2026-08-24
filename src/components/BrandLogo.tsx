import React from 'react';
import { useTranslation } from '../i18n';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'icon-only';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  className = '',
  size = 'md',
}) => {
  const { t, language } = useTranslation();

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Visual Emblem */}
      <div className={`relative shrink-0 rounded-2xl overflow-hidden shadow-xs hover:scale-105 transition-transform ${iconSizes[size]}`}>
        <img
          src="./logo-ico.svg"
          alt="Hi Space Icon"
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Brand Text & Slogan */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-extrabold tracking-tight text-slate-900 font-heading ${titleSizes[size]}`}>
              Hi <span className="text-sky-600">Space</span>
            </span>
          </div>
          {variant === 'full' && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-normal mt-0.5 line-clamp-1">
              {t.nav.brandSubtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
