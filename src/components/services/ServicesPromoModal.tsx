import React, { useState } from 'react';
import { useTranslation } from '../../i18n';
import { SERVICES_DATA, PROMO_CONTACT_INFO, ServiceItem } from '../../data/servicesData';
import { ConsultationInquiry } from '../../types';
import { saveConsultationInquiry } from '../../utils/storage';
import {
  Code2,
  FileSpreadsheet,
  Building2,
  Cpu,
  X,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
  Send,
  Copy,
  Check,
  ChevronRight,
  Layers,
  Award,
  Users,
  Briefcase,
  HelpCircle,
  PhoneCall,
  ExternalLink,
} from 'lucide-react';

interface ServicesPromoModalProps {
  initialTab?: string;
  onClose: () => void;
}

export const ServicesPromoModal: React.FC<ServicesPromoModalProps> = ({
  initialTab = 'all',
  onClose,
}) => {
  const { t, language } = useTranslation();

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedServiceForConsult, setSelectedServiceForConsult] = useState<
    'coding' | 'office' | 'digital_transformation' | 'automation_data' | 'all'
  >(
    initialTab === 'coding' ||
      initialTab === 'office' ||
      initialTab === 'digital_transformation' ||
      initialTab === 'automation_data'
      ? initialTab
      : 'all'
  );

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Copy helpers
  const [copiedHotline, setCopiedHotline] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyHotline = () => {
    navigator.clipboard.writeText(PROMO_CONTACT_INFO.hotline);
    setCopiedHotline(true);
    setTimeout(() => setCopiedHotline(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PROMO_CONTACT_INFO.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setFormError(t.services.form.requiredError);
      return;
    }

    setFormError('');
    const newInquiry: ConsultationInquiry = {
      id: 'inq_' + Date.now(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      organization: organization.trim() || undefined,
      serviceCategory: selectedServiceForConsult,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    saveConsultationInquiry(newInquiry);
    setFormSubmitted(true);
  };

  const handleSelectServiceTab = (serviceId: string) => {
    setActiveTab(serviceId);
    if (
      serviceId === 'coding' ||
      serviceId === 'office' ||
      serviceId === 'digital_transformation' ||
      serviceId === 'automation_data'
    ) {
      setSelectedServiceForConsult(serviceId);
    }
  };

  const handleOpenConsultationFor = (
    serviceId: 'coding' | 'office' | 'digital_transformation' | 'automation_data'
  ) => {
    setSelectedServiceForConsult(serviceId);
    setActiveTab('consultation');
  };

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code2':
        return <Code2 className="w-5 h-5" />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="w-5 h-5" />;
      case 'Building2':
        return <Building2 className="w-5 h-5" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const filteredServices =
    activeTab === 'all' || activeTab === 'consultation'
      ? SERVICES_DATA
      : SERVICES_DATA.filter((s) => s.id === activeTab);

  return (
    <div
      id="services-promo-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto"
    >
      <div
        id="services-promo-modal-card"
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden my-auto"
      >
        {/* 1. Modal Top Bar Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-800">
                  Hi Space Pro Solutions
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight">
                {t.services.modalTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={t.common.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => handleSelectServiceTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.services.tabs.all}</span>
          </button>

          <button
            onClick={() => handleSelectServiceTab('coding')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'coding'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-700 border border-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{t.services.tabs.coding}</span>
          </button>

          <button
            onClick={() => handleSelectServiceTab('office')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'office'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{t.services.tabs.office}</span>
          </button>

          <button
            onClick={() => handleSelectServiceTab('digital_transformation')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'digital_transformation'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t.services.tabs.digitalTransformation}</span>
          </button>

          <button
            onClick={() => handleSelectServiceTab('automation_data')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'automation_data'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-700 border border-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{t.services.tabs.automationData}</span>
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1 shrink-0" />

          <button
            onClick={() => setActiveTab('consultation')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'consultation'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
            <span>{t.services.consultationBtn}</span>
          </button>
        </div>

        {/* 3. Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-100/60">
          {activeTab !== 'consultation' ? (
            <>
              {/* Introduction Banner inside modal */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      {t.services.bannerTitle}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {t.services.modalSubtitle}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('consultation')}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{t.services.consultationBtn}</span>
                  </button>
                </div>
              </div>

              {/* Service Cards List */}
              <div className="space-y-8">
                {filteredServices.map((service) => {
                  const title = language === 'vi' ? service.titleVi : service.titleEn;
                  const badge = language === 'vi' ? service.badgeVi : service.badgeEn;
                  const shortDesc = language === 'vi' ? service.shortDescVi : service.shortDescEn;
                  const fullDesc = language === 'vi' ? service.fullDescVi : service.fullDescEn;
                  const highlights = language === 'vi' ? service.highlightsVi : service.highlightsEn;
                  const targetAudience =
                    language === 'vi' ? service.targetAudienceVi : service.targetAudienceEn;
                  const syllabus =
                    language === 'vi'
                      ? service.syllabusOrDeliverablesVi
                      : service.syllabusOrDeliverablesEn;
                  const duration =
                    language === 'vi' ? service.durationOrTimelineVi : service.durationOrTimelineEn;
                  const format = language === 'vi' ? service.formatVi : service.formatEn;

                  return (
                    <div
                      key={service.id}
                      id={`service-detail-${service.id}`}
                      className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden"
                    >
                      {/* Card Header */}
                      <div className="p-6 sm:p-7 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0 shadow-2xs">
                              {getServiceIcon(service.icon)}
                            </div>
                            <div>
                              <div className="inline-flex items-center gap-2 mb-1">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
                                  {badge}
                                </span>
                              </div>
                              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                                {title}
                              </h3>
                            </div>
                          </div>

                          <button
                            onClick={() => handleOpenConsultationFor(service.id)}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <span>{language === 'vi' ? 'Nhận Tư Vấn Khóa Này' : 'Request This Program'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
                          {fullDesc}
                        </p>

                        {/* Format & Timeline Pill */}
                        <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-200/60 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-700">{t.services.durationLabel}:</span>
                            <span>{duration}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-700">{t.services.formatLabel}:</span>
                            <span>{format}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Details Body */}
                      <div className="p-6 sm:p-7 space-y-6">
                        {/* 1. Key Highlights */}
                        <div className="space-y-3">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span>{t.services.highlightsTitle}</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {highlights.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs text-slate-700"
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 2. Target Audience */}
                        <div className="space-y-3">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-sky-500" />
                            <span>{t.services.targetAudienceTitle}</span>
                          </h4>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
                            {targetAudience.map((aud, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-1.5" />
                                <span>{aud}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* 3. Detailed Syllabus / Solution Deliverables */}
                        <div className="space-y-3">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-indigo-500" />
                            <span>{t.services.syllabusTitle}</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {syllabus.map((mod, idx) => (
                              <div
                                key={idx}
                                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 transition-colors shadow-2xs flex flex-col justify-between"
                              >
                                <div>
                                  <h5 className="font-bold text-xs sm:text-sm text-slate-900 mb-1">
                                    {mod.title}
                                  </h5>
                                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                                    {mod.description}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                                  {mod.tags.map((tag, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 4. Tech Stack */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            {t.services.techStackTitle}:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {service.techStack.map((tech, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs font-bold text-slate-700"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}

          {/* Consultation & Booking Form Section */}
          <div
            id="services-consultation-section"
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Form */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'vi' ? 'Tư Vấn Miễn Phí 100%' : '100% Free Consultation'}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {t.services.form.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    {t.services.form.subtitle}
                  </p>
                </div>

                {formSubmitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-fade-in">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <Check className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-extrabold text-emerald-900">
                      {t.services.form.successTitle}
                    </h4>
                    <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
                      {t.services.form.successDesc}
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setFormSubmitted(false);
                          setFullName('');
                          setPhone('');
                          setEmail('');
                          setNotes('');
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        {language === 'vi' ? 'Gửi Thêm Yêu Cầu Khác' : 'Submit Another Request'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitForm} className="space-y-4">
                    {formError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                        {formError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {t.services.form.fullNameLabel} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder={t.services.form.fullNamePlaceholder}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs sm:text-sm text-slate-900 transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {t.services.form.phoneLabel} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={t.services.form.phonePlaceholder}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs sm:text-sm text-slate-900 font-mono transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {t.services.form.emailLabel}
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t.services.form.emailPlaceholder}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs sm:text-sm text-slate-900 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {t.services.form.orgLabel}
                        </label>
                        <input
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          placeholder={t.services.form.orgPlaceholder}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs sm:text-sm text-slate-900 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t.services.form.serviceLabel}
                      </label>
                      <select
                        value={selectedServiceForConsult}
                        onChange={(e) =>
                          setSelectedServiceForConsult(
                            e.target.value as
                              | 'coding'
                              | 'office'
                              | 'digital_transformation'
                              | 'automation_data'
                              | 'all'
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs sm:text-sm text-slate-900 font-semibold bg-white transition-colors cursor-pointer"
                      >
                        <option value="all">{t.services.tabs.all}</option>
                        <option value="coding">{t.services.tabs.coding}</option>
                        <option value="office">{t.services.tabs.office}</option>
                        <option value="digital_transformation">
                          {t.services.tabs.digitalTransformation}
                        </option>
                        <option value="automation_data">{t.services.tabs.automationData}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t.services.form.notesLabel}
                      </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t.services.form.notesPlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs sm:text-sm text-slate-900 transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{t.services.form.submitBtn}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Right Column: Direct Contact Info & Guarantees */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6 lg:pl-4 lg:border-l lg:border-slate-200/80">
                <div className="space-y-4">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-sky-600" />
                    <span>{t.services.contactDirectTitle}</span>
                  </h4>

                  {/* Hotline Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {t.services.hotline} / {t.services.zalo}
                        </span>
                        <div className="text-sm font-black text-slate-900 font-mono">
                          {PROMO_CONTACT_INFO.hotline}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleCopyHotline}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title={t.common.copy}
                    >
                      {copiedHotline ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Email Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="max-w-[180px] sm:max-w-xs truncate">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {t.services.email}
                        </span>
                        <div className="text-xs font-bold text-slate-900 font-mono truncate">
                          {PROMO_CONTACT_INFO.email}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleCopyEmail}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title={t.common.copy}
                    >
                      {copiedEmail ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Working Hours & Locations */}
                  <div className="space-y-2 text-xs text-slate-600 pt-2">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-700">{t.services.workingHours}: </span>
                        <span>
                          {language === 'vi'
                            ? PROMO_CONTACT_INFO.workingHoursVi
                            : PROMO_CONTACT_INFO.workingHoursEn}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-700">{t.services.location}: </span>
                        <span>
                          {language === 'vi'
                            ? PROMO_CONTACT_INFO.addressVi
                            : PROMO_CONTACT_INFO.addressEn}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-2">
                  <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {language === 'vi'
                        ? 'Cam kết đồng hành & hỗ trợ trọn đời'
                        : 'Lifetime Advisory & Technical Support'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {language === 'vi'
                      ? 'Đội ngũ chuyên gia CNTT và giảng viên giàu kinh nghiệm thực chiến, đồng hành cùng bạn và doanh nghiệp từ bước đầu tiên đến thành công.'
                      : 'Experienced software engineers and senior corporate mentors supporting your transformation journey from day one to tangible results.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Hi Space Education & Tech</span>
            <span>•</span>
            <span>{language === 'vi' ? 'Đào tạo & Chuyển đổi số' : 'Training & Digital Services'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
