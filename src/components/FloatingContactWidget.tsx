import React, { useState, useCallback } from 'react';
import {
  Phone,
  MessageCircle,
  X,
  Copy,
  Check,
  Headphones,
  Sparkles,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Clock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { PROMO_CONTACT_INFO } from '../data/servicesData';

interface FloatingContactWidgetProps {
  onOpenServices?: (tab?: string) => void;
}

export const FloatingContactWidget: React.FC<FloatingContactWidgetProps> = ({
  onOpenServices,
}) => {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const cleanPhone = PROMO_CONTACT_INFO.hotline.replace(/\D/g, '');
  const zaloUrl = `https://zalo.me/${cleanPhone}`;
  const phoneUrl = `tel:${cleanPhone}`;

  const handleCopyPhone = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(PROMO_CONTACT_INFO.hotline);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2200);
  }, []);

  const handleOpenConsultation = useCallback(() => {
    setIsOpen(false);
    if (onOpenServices) {
      onOpenServices('all');
    }
  }, [onOpenServices]);

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="group flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-full shadow-lg border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 text-xs font-semibold"
          title={t.services.contactBubble.tooltip}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <Headphones className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          <span>Hỗ Trợ 24/7</span>
          <ChevronUp className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 font-sans antialiased pointer-events-none">
      {/* 1. Expandable Contact Popup Card */}
      {isOpen && (
        <div className="pointer-events-auto w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Top Banner Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-inner">
                  <Headphones className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-heading font-bold text-sm text-white tracking-wide">
                      {t.services.contactBubble.title}
                    </h4>
                    <span className="inline-flex items-center gap-1 bg-emerald-500/30 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[10px] text-emerald-200 font-medium border border-emerald-400/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      24/7
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-100/90 leading-tight mt-0.5">
                    {t.services.contactBubble.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
                  title="Thu nhỏ"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
                  title={t.common.close}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Action List */}
          <div className="p-4 space-y-3 bg-slate-50/50">
            {/* Primary Action 1: Zalo Chat Bubble Button */}
            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50/80 hover:from-sky-100 hover:to-blue-100/90 border border-sky-200/80 hover:border-sky-300 text-slate-800 transition-all duration-200 shadow-sm hover:shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0068FF] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <span className="tracking-tighter font-extrabold text-sm">Zalo</span>
                </div>
                <div>
                  <div className="font-heading font-semibold text-xs text-blue-950 flex items-center gap-1">
                    {t.services.contactBubble.chatZalo}
                    <ExternalLink className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {PROMO_CONTACT_INFO.zalo}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-white rounded-lg border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                Chat Ngay
              </span>
            </a>

            {/* Primary Action 2: Call Hotline Button */}
            <a
              href={phoneUrl}
              className="group flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50/80 hover:from-emerald-100 hover:to-teal-100/90 border border-emerald-200/80 hover:border-emerald-300 text-slate-800 transition-all duration-200 shadow-sm hover:shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <Phone className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="font-heading font-semibold text-xs text-emerald-950 flex items-center gap-1">
                    {t.services.contactBubble.callHotline}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 font-bold text-emerald-700">
                    {PROMO_CONTACT_INFO.hotline}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-white rounded-lg border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                Gọi Ngay
              </span>
            </a>

            {/* Quick Helper Tools */}
            <div className="pt-1 flex items-center gap-2 text-xs">
              <button
                onClick={handleCopyPhone}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium transition-colors text-[11px]"
              >
                {copiedPhone ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">{t.services.contactBubble.phoneCopied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t.services.contactBubble.copyPhone}</span>
                  </>
                )}
              </button>

              {onOpenServices && (
                <button
                  onClick={handleOpenConsultation}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-sm transition-all text-[11px]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.services.contactBubble.requestConsultation}</span>
                </button>
              )}
            </div>

            {/* Info Footer */}
            <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {language === 'vi'
                    ? PROMO_CONTACT_INFO.workingHoursVi
                    : PROMO_CONTACT_INFO.workingHoursEn}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a
                  href={`mailto:${PROMO_CONTACT_INFO.email}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {PROMO_CONTACT_INFO.email}
                </a>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Cam kết tư vấn miễn phí & giải đáp trong 30 phút</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Floating Action Bubble Buttons */}
      <div className="pointer-events-auto flex items-center gap-2.5">
        {/* Quick Zalo Floating Circle Button */}
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-[#0068FF] text-white shadow-lg hover:shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white"
          title="Chat Zalo ngay (0987.654.321)"
        >
          <span className="font-extrabold text-[13px] tracking-tighter">Zalo</span>
          {/* Ping animation indicator */}
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-400 border-2 border-white"></span>
          </span>
          {/* Hover Tooltip */}
          <span className="absolute right-14 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-2.5 py-1 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Chat Zalo: {PROMO_CONTACT_INFO.zalo}
          </span>
        </a>

        {/* Quick Hotline Call Floating Circle Button */}
        <a
          href={phoneUrl}
          className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg hover:shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white"
          title="Gọi Hotline ngay (0987.654.321)"
        >
          <Phone className="w-5 h-5 animate-pulse" />
          {/* Hover Tooltip */}
          <span className="absolute right-14 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-2.5 py-1 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Gọi Hotline: {PROMO_CONTACT_INFO.hotline}
          </span>
        </a>

        {/* Master Floating Menu Toggle Trigger */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`group relative flex items-center justify-center w-14 h-14 rounded-full text-white shadow-xl transition-all duration-300 border-2 border-white ${
            isOpen
              ? 'bg-slate-800 hover:bg-slate-900 rotate-90 scale-105'
              : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 hover:scale-110 active:scale-95'
          }`}
          title={isOpen ? t.common.close : t.services.contactBubble.tooltip}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              {/* Online Green Pulsing Indicator */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>
          )}

          {/* Master Tooltip */}
          {!isOpen && (
            <span className="absolute right-16 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.services.contactBubble.tooltip}</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
