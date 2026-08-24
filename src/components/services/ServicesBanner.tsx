import React from 'react';
import { useTranslation } from '../../i18n';
import {
  Code2,
  FileSpreadsheet,
  Building2,
  Cpu,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  Zap,
} from 'lucide-react';

interface ServicesBannerProps {
  onOpenServices: (defaultTab?: string) => void;
  onOpenConsultation?: () => void;
}

export const ServicesBanner: React.FC<ServicesBannerProps> = ({
  onOpenServices,
  onOpenConsultation,
}) => {
  const { t, language } = useTranslation();

  const pillars = [
    {
      id: 'coding',
      icon: Code2,
      titleVi: 'Dạy Học Lập Trình',
      titleEn: 'Coding Courses',
      descVi: 'Python, Web Fullstack, C++, AI & Thuật toán thực chiến',
      descEn: 'Python, Fullstack Web, C++, AI & Practical Algorithms',
      bgClass: 'bg-sky-50 border-sky-200/80 text-sky-700 hover:border-sky-300',
      iconBg: 'bg-sky-500 text-white',
    },
    {
      id: 'office',
      icon: FileSpreadsheet,
      titleVi: 'Tin Học Văn Phòng',
      titleEn: 'Office & Excel Pro',
      descVi: 'Word chuẩn mẫu, 50+ hàm Excel, Dashboard & Google Sheets',
      descEn: 'Official Word, 50+ Excel formulas, Dashboards & Sheets',
      bgClass: 'bg-emerald-50 border-emerald-200/80 text-emerald-700 hover:border-emerald-300',
      iconBg: 'bg-emerald-500 text-white',
    },
    {
      id: 'digital_transformation',
      icon: Building2,
      titleVi: 'Chuyển Đổi Số DN',
      titleEn: 'Digital Transformation',
      descVi: 'Số hóa quy trình, đám mây, tích hợp AI & đào tạo nhân sự',
      descEn: 'Digitize workflows, cloud systems, AI integration & training',
      bgClass: 'bg-indigo-50 border-indigo-200/80 text-indigo-700 hover:border-indigo-300',
      iconBg: 'bg-indigo-500 text-white',
    },
    {
      id: 'automation_data',
      icon: Cpu,
      titleVi: 'Tự Động Hóa Dữ Liệu',
      titleEn: 'Workflow Automation',
      descVi: 'Bot RPA, đối soát đơn hàng tự động, Power BI & CRM/ERP',
      descEn: 'RPA bots, automated reconciliation, Power BI & CRM/ERP',
      bgClass: 'bg-amber-50 border-amber-200/80 text-amber-700 hover:border-amber-300',
      iconBg: 'bg-amber-500 text-white',
    },
  ];

  return (
    <div
      id="services-promo-banner"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 shadow-sm border border-slate-700/60"
    >
      {/* Decorative background ambient glows */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'vi' ? 'Đào Tạo & Dịch Vụ Doanh Nghiệp' : 'Academy & Enterprise Services'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {t.services.bannerTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t.services.bannerSubtitle}
            </p>
          </div>

          {/* Quick Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onOpenServices('consultation')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{t.services.consultationBtn}</span>
            </button>
            <button
              onClick={() => onOpenServices('all')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>{t.services.exploreBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Pillars Interactive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
          {pillars.map((p) => {
            const IconComponent = p.icon;
            const title = language === 'vi' ? p.titleVi : p.titleEn;
            const desc = language === 'vi' ? p.descVi : p.descEn;

            return (
              <div
                key={p.id}
                onClick={() => onOpenServices(p.id)}
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-400/40 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl ${p.iconBg} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 group-hover:text-sky-300 transition-colors">
                      {language === 'vi' ? 'Xem chi tiết' : 'Details'}
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors mb-1">
                    {title}
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                    {desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>{language === 'vi' ? 'Cam kết chất lượng 100%' : '100% Quality Guaranteed'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
