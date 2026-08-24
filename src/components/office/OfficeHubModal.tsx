import React, { useState, useMemo } from 'react';
import {
  OFFICE_TOPICS,
  OFFICE_SHORTCUTS_COLLECTION,
  OfficeTopic,
  OfficeSoftware,
  OfficeLevel,
} from '../../data/officeData';
import {
  SAMPLE_SPREADSHEETS,
  evaluateExcelFormula,
  SampleSpreadsheet,
  EvaluationResult,
} from '../../utils/excelEvaluator';
import { Lesson } from '../../types';
import { useTranslation } from '../../i18n';
import { LanguageSelector } from '../LanguageSelector';
import {
  Search,
  BookOpen,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Calculator,
  Command,
  Copy,
  Check,
  Play,
  ArrowRight,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  X,
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2,
  ExternalLink,
  Code2,
  Flame,
} from 'lucide-react';

interface OfficeHubModalProps {
  onClose: () => void;
  onStartDrill?: (lesson: Lesson) => void;
}

type MainTab = 'curriculum' | 'lookup' | 'tips' | 'sandbox' | 'shortcuts';

export const OfficeHubModal: React.FC<OfficeHubModalProps> = ({
  onClose,
  onStartDrill,
}) => {
  const { t, language } = useTranslation();
  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState<MainTab>('curriculum');
  const [selectedSoftware, setSelectedSoftware] = useState<'all' | OfficeSoftware>('all');
  const [selectedLevel, setSelectedLevel] = useState<'all' | OfficeLevel>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<OfficeTopic | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sandbox states
  const [selectedSheetId, setSelectedSheetId] = useState<string>('sales');
  const [sandboxFormula, setSandboxFormula] = useState<string>('=SUMIFS(E2:E8, B2:B8, "Hà Nội", C2:C8, "Laptop Dell")');
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  // Current selected sheet
  const currentSheet = useMemo(() => {
    return SAMPLE_SPREADSHEETS.find((s) => s.id === selectedSheetId) || SAMPLE_SPREADSHEETS[0];
  }, [selectedSheetId]);

  // Run initial evaluation for sandbox
  React.useEffect(() => {
    if (sandboxFormula) {
      const res = evaluateExcelFormula(sandboxFormula, currentSheet);
      setEvaluationResult(res);
    }
  }, [sandboxFormula, currentSheet]);

  // Filter topics
  const filteredTopics = useMemo(() => {
    return OFFICE_TOPICS.filter((topic) => {
      if (selectedSoftware !== 'all' && topic.software !== selectedSoftware) return false;
      if (selectedLevel !== 'all' && topic.level !== selectedLevel) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = topic.title.toLowerCase().includes(q);
        const matchVnTitle = topic.vietnameseTitle.toLowerCase().includes(q);
        const matchDesc = topic.shortDescription.toLowerCase().includes(q);
        const matchSyntax = topic.syntax?.toLowerCase().includes(q);
        const matchCategory = topic.categoryName.toLowerCase().includes(q);
        const matchShortcuts = topic.shortcutKeys?.some((k) => k.toLowerCase().includes(q));
        return matchTitle || matchVnTitle || matchDesc || matchSyntax || matchCategory || matchShortcuts;
      }
      return true;
    });
  }, [selectedSoftware, selectedLevel, searchQuery]);

  // Filter shortcuts
  const filteredShortcuts = useMemo(() => {
    return OFFICE_SHORTCUTS_COLLECTION.filter((sc) => {
      if (selectedSoftware !== 'all' && sc.software !== selectedSoftware) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return sc.keys.toLowerCase().includes(q) || sc.desc.toLowerCase().includes(q) || sc.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedSoftware, searchQuery]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Launch Typing Drill with topic practice drills
  const handleLaunchPracticeDrill = (topic: OfficeTopic) => {
    if (!onStartDrill) return;

    const drillLesson: Lesson = {
      id: Date.now(),
      unitId: 99,
      unitTitle: `Thực Hành Gõ ${topic.software === 'excel' ? 'Excel' : 'Word'}`,
      unitSubtitle: topic.title,
      title: `Luyện Gõ: ${topic.title}`,
      type: 'lesson',
      description: `Rèn luyện tốc độ và độ chính xác khi gõ cú pháp: ${topic.vietnameseTitle}`,
      targetKeys: ['=', '(', ')', '$', '"', ',', ':', '+', '-', '*', '/'],
      content: topic.practiceDrills.length > 0 ? topic.practiceDrills : [topic.syntax || topic.title],
      minAccuracy: 95,
      targetWpm: 25,
    };

    onClose();
    onStartDrill(drillLesson);
  };

  // Send topic formula to Sandbox
  const handleSendToSandbox = (formula: string) => {
    setSandboxFormula(formula);
    setActiveTab('sandbox');
    setSelectedTopic(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-hidden">
      {/* Container Dialog */}
      <div className="relative w-full max-w-6xl h-[90vh] max-h-[850px] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* ========================================================================= */}
        {/* 1. MODAL TOP HEADER */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {t.officeHub.modalTitle}
                </h2>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {t.officeHub.badgeLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t.officeHub.modalSubtitle}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector variant="pill" />

            <button
              onClick={() => {
                onClose();
                onStartDrill({
                  id: 65,
                  unitId: 10,
                  unitTitle: 'Unit 10: Arcade Typing Games',
                  title: 'Data Entry Speed Run (Đua Xe Nhập Dữ Liệu)',
                  type: 'game',
                  gameType: 'data_entry_speed_run',
                  description: 'Đua xe siêu tốc trên đường cao tốc công sở! Nhập chính xác mã hóa đơn, số tiền kế toán, công thức Excel và danh bạ để kích hoạt Nitro tăng tốc về đích.',
                  targetKeys: ['all keys', 'numbers', 'symbols'],
                  content: ['HD-2026-8942 VNPOST-99238-HCM 15,450,000 VND =VLOOKUP(A2,D:F,3,0) =SUMIFS(E2:E100,B2:B100,"Hanoi")'],
                  minAccuracy: 90,
                  targetWpm: 40,
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
              title="Mini-Game"
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Mini-Game:</span>
              <span>{t.nav.speedRun}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={t.common.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. SUBHEADER: NAVIGATION TABS & SEARCH BAR */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-900/90 border-b border-slate-800/80 shrink-0">
          
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'curriculum'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t.officeHub.tabs.curriculum}</span>
            </button>

            <button
              onClick={() => setActiveTab('lookup')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'lookup'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>{t.officeHub.tabs.lookup}</span>
            </button>

            <button
              onClick={() => setActiveTab('tips')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'tips'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              <span>{t.officeHub.tabs.tips}</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 bg-amber-400/30 text-amber-300 rounded font-black">
                {t.common.hot}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'sandbox'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>{t.officeHub.tabs.sandbox}</span>
            </button>

            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'shortcuts'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Command className="w-4 h-4" />
              <span>{t.officeHub.tabs.shortcuts}</span>
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative flex-1 max-w-md min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.officeHub.searchPlaceholder}
              className="w-full pl-10 pr-9 py-2 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>


        {/* ========================================================================= */}
        {/* 3. FILTER CHIPS (Software & Level) */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2 bg-slate-950/40 border-b border-slate-800/40 text-xs shrink-0">
          {/* Software Filters */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Ứng dụng:
            </span>
            <button
              onClick={() => setSelectedSoftware('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedSoftware === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setSelectedSoftware('word')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                selectedSoftware === 'word'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800/60 text-slate-400 hover:text-blue-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Microsoft Word</span>
            </button>
            <button
              onClick={() => setSelectedSoftware('excel')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                selectedSoftware === 'excel'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800/60 text-slate-400 hover:text-emerald-300'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Microsoft Excel</span>
            </button>
          </div>

          {/* Level Filters */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium mr-1">Cấp độ:</span>
            {(['all', 'basic', 'intermediate', 'advanced'] as const).map((lvl) => {
              const labels = {
                all: 'Tất cả',
                basic: 'Cơ bản (Beginner)',
                intermediate: 'Trung cấp (Intermediate)',
                advanced: 'Nâng cao (Advanced)',
              };
              return (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedLevel === lvl
                      ? lvl === 'basic'
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                        : lvl === 'intermediate'
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                        : lvl === 'advanced'
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                        : 'bg-slate-700 text-white'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {labels[lvl]}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. MAIN CONTENT VIEW AREA */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 1: CURRICULUM ROADMAP (LỘ TRÌNH HỌC TẬP TỪNG BƯỚC) */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'curriculum' && (
            <div className="space-y-6">
              {/* Word & Excel Level Cards Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* WORD TRACK */}
                <div className="bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 p-5 rounded-3xl border border-blue-500/30 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">Khóa Học Microsoft Word</h3>
                        <p className="text-xs text-blue-300">Chuẩn hóa văn bản hành chính & Báo cáo đồ án</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                      {OFFICE_TOPICS.filter((t) => t.software === 'word').length} Chủ đề
                    </span>
                  </div>

                  {/* Level Steps */}
                  <div className="space-y-2.5">
                    {/* Basic */}
                    <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-xs font-black text-emerald-400 uppercase">Cấp độ 1: Cơ bản</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Font chữ, Paragraph, Căn lề NĐ 30/2020, Giãn dòng, Khổ A4 & Header/Footer
                        </p>
                      </div>
                    </div>

                    {/* Intermediate */}
                    <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="text-xs font-black text-amber-400 uppercase">Cấp độ 2: Trung cấp</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Bảng biểu (Repeat Header), Tab Stop (dòng chấm .....), Mục lục tự động Heading 1/2
                        </p>
                      </div>
                    </div>

                    {/* Advanced */}
                    <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-400" />
                          <span className="text-xs font-black text-rose-400 uppercase">Cấp độ 3: Nâng cao</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Trộn thư Mail Merge hàng loạt, Section Break xoay ngang 1 trang độc lập & Phím tắt
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* EXCEL TRACK */}
                <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 p-5 rounded-3xl border border-emerald-500/30 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">Khóa Học Microsoft Excel</h3>
                        <p className="text-xs text-emerald-300">Xử lý số liệu, Báo cáo tài chính & Phân tích dữ liệu</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      {OFFICE_TOPICS.filter((t) => t.software === 'excel').length} Chủ đề
                    </span>
                  </div>

                  {/* Level Steps */}
                  <div className="space-y-2.5">
                    {/* Basic */}
                    <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-xs font-black text-emerald-400 uppercase">Cấp độ 1: Cơ bản</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Các hàm nền tảng: SUM, AVERAGE, COUNT, COUNTA, MIN, MAX & Phím tắt AutoSum
                        </p>
                      </div>
                    </div>

                    {/* Intermediate */}
                    <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="text-xs font-black text-amber-400 uppercase">Cấp độ 2: Trung cấp</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Hàm điều kiện: IF, SUMIF/SUMIFS, COUNTIF, Xử lý chuỗi (LEFT, RIGHT, MID, TRIM) & Định dạng có điều kiện
                        </p>
                      </div>
                    </div>

                    {/* Advanced */}
                    <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-400" />
                          <span className="text-xs font-black text-rose-400 uppercase">Cấp độ 3: Nâng cao</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Hàm dò tìm VLOOKUP, XLOOKUP, INDEX + MATCH, PivotTable phân tích đa chiều & Data Validation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Topic Cards Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Danh Sách Bài Học & Kỹ Năng ({filteredTopics.length})
                  </h3>
                  <span className="text-xs text-slate-400">Nhấp vào từng bài để xem cú pháp & thực hành tương tác</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTopics.map((topic) => (
                    <div
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic)}
                      className="group p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 transition-all cursor-pointer shadow-md hover:shadow-xl flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        {/* Tags Header */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 ${
                              topic.software === 'word'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {topic.software === 'word' ? <FileText className="w-3 h-3" /> : <FileSpreadsheet className="w-3 h-3" />}
                            {topic.software.toUpperCase()}
                          </span>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              topic.level === 'basic'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : topic.level === 'intermediate'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {topic.level === 'basic' ? 'Cơ bản' : topic.level === 'intermediate' ? 'Trung cấp' : 'Nâng cao'}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-black text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                          {topic.title}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {topic.vietnameseTitle}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500 font-mono truncate max-w-[150px]">
                          {topic.categoryName}
                        </span>
                        <span className="text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                          Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 2: LOOKUP & CHEAT-SHEET ENGINE (TRA CỨU NHANH) */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'lookup' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Tìm thấy <strong className="text-white">{filteredTopics.length}</strong> kết quả tra cứu phù hợp
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 shadow-lg space-y-4 transition-all"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase ${
                              topic.software === 'word'
                                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                                : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {topic.software.toUpperCase()}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              topic.level === 'basic'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : topic.level === 'intermediate'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {topic.level === 'basic' ? 'Cơ bản' : topic.level === 'intermediate' ? 'Trung cấp' : 'Nâng cao'}
                          </span>
                          <h4 className="text-base font-black text-white">{topic.title}</h4>
                        </div>
                        <p className="text-xs text-emerald-400 font-medium mt-1">
                          {topic.vietnameseTitle}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {topic.software === 'excel' && topic.syntax && (
                          <button
                            onClick={() => handleSendToSandbox(topic.example.formulaOrSteps || topic.syntax || '')}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Chạy Thử</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleLaunchPracticeDrill(topic)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Luyện Gõ</span>
                        </button>
                      </div>
                    </div>

                    {/* Syntax block if available */}
                    {topic.syntax && (
                      <div className="relative p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 flex items-center justify-between">
                        <code>{topic.syntax}</code>
                        <button
                          onClick={() => handleCopy(topic.syntax || '', topic.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Sao chép cú pháp"
                        >
                          {copiedId === topic.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    {/* Example & Explanation */}
                    <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/60 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-slate-300 font-bold">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Tình huống thực tế: {topic.example.scenario}</span>
                      </div>
                      <div className="pl-5 text-slate-400">
                        <p><strong className="text-slate-300">Cách thực hiện:</strong> <span className="font-mono text-blue-300">{topic.example.formulaOrSteps}</span></p>
                        <p className="mt-1"><strong className="text-slate-300">Kết quả:</strong> <span className="text-emerald-400 font-bold">{topic.example.result}</span></p>
                        <p className="mt-1 text-slate-400 italic">{topic.example.explanation}</p>
                      </div>
                    </div>

                    {/* Pro Tips / Common Mistakes */}
                    {topic.commonMistakes && topic.commonMistakes.length > 0 && (
                      <div className="p-2.5 bg-rose-950/30 rounded-xl border border-rose-800/40 text-xs text-rose-300 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-rose-200">Lưu ý tránh lỗi:</strong> {topic.commonMistakes.join(' • ')}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 3: PRO TIPS & HACKS GALLERY (MẸO & THỦ THUẬT ĐỈNH CAO) */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'tips' && (
            <div className="space-y-6">
              {/* Header Hero Banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      Tuyển Tập Mẹo & Tuyệt Chiêu Văn Phòng Siêu Nhanh
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                        Pro Hacks
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Giúp bạn rút ngắn 80% thời gian xử lý dữ liệu, định dạng văn bản chuẩn công văn và xử lý tình huống thực tế.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onStartDrill?.({
                        id: 65,
                        unitId: 10,
                        unitTitle: 'Unit 10: Arcade Typing Games',
                        title: 'Data Entry Speed Run (Đua Xe Nhập Dữ Liệu)',
                        type: 'game',
                        gameType: 'data_entry_speed_run',
                        description: 'Đua xe siêu tốc trên đường cao tốc công sở! Nhập chính xác mã hóa đơn, số tiền kế toán, công thức Excel và danh bạ để kích hoạt Nitro tăng tốc về đích.',
                        targetKeys: ['all keys', 'numbers', 'symbols'],
                        content: ['HD-2026-8942 VNPOST-99238-HCM 15,450,000 VND =VLOOKUP(A2,D:F,3,0) =SUMIFS(E2:E100,B2:B100,"Hanoi")'],
                        minAccuracy: 90,
                        targetWpm: 40,
                      });
                    }}
                    className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Flame className="w-4 h-4 fill-current" />
                    <span>Thử Thách Đua Xe Nhập Liệu</span>
                  </button>
                </div>
              </div>

              {/* Grid of Tip Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OFFICE_TOPICS.filter(
                  (t) =>
                    t.category === 'advanced_tricks' ||
                    t.category === 'shortcuts' ||
                    t.category === 'tricks_security' ||
                    t.category === 'data_analysis' ||
                    t.id.includes('flash_fill') ||
                    t.id.includes('borders') ||
                    t.id.includes('keep_with_next') ||
                    t.id.includes('compare') ||
                    t.id.includes('autocorrect') ||
                    t.id.includes('datedif') ||
                    t.id.includes('unique')
                )
                  .filter((t) => {
                    if (selectedSoftware !== 'all' && t.software !== selectedSoftware) return false;
                    return true;
                  })
                  .map((topic) => (
                    <div
                      key={topic.id}
                      className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 flex flex-col justify-between space-y-4 transition-all group shadow-lg hover:shadow-amber-500/10"
                    >
                      <div className="space-y-3">
                        {/* Top badges */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                topic.software === 'word'
                                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {topic.software.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-amber-400 font-bold bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                              ⚡ {topic.categoryName}
                            </span>
                          </div>

                          {topic.shortcutKeys && topic.shortcutKeys.length > 0 && (
                            <div className="flex items-center gap-1 font-mono text-[10px] font-black text-amber-300 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                              {topic.shortcutKeys.join(' + ')}
                            </div>
                          )}
                        </div>

                        {/* Title & Desc */}
                        <div>
                          <h4 className="text-sm sm:text-base font-black text-white group-hover:text-amber-300 transition-colors">
                            {topic.title}
                          </h4>
                          <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                            {topic.vietnameseTitle}
                          </p>
                        </div>

                        {/* Practical Steps / Syntax box */}
                        {topic.syntax && (
                          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-1 text-xs">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                              <span>Thao tác nhanh:</span>
                              <button
                                onClick={() => handleCopy(topic.syntax || '', topic.id)}
                                className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                              >
                                {copiedId === topic.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>Copy</span>
                              </button>
                            </div>
                            <code className="block font-mono text-xs text-amber-300 whitespace-pre-wrap">
                              {topic.syntax}
                            </code>
                          </div>
                        )}

                        {/* Pro Tip note */}
                        {topic.proTips && topic.proTips.length > 0 && (
                          <div className="p-2.5 bg-amber-950/20 rounded-xl border border-amber-600/30 text-[11px] text-amber-200/90 flex items-start gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{topic.proTips[0]}</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => setSelectedTopic(topic)}
                          className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Xem chi tiết ví dụ ➔
                        </button>

                        <div className="flex items-center gap-2">
                          {topic.software === 'excel' && (
                            <button
                              onClick={() => handleSendToSandbox(topic.example.formulaOrSteps || topic.syntax || '')}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition-colors cursor-pointer"
                              title="Thử trong Sandbox"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleLaunchPracticeDrill(topic)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Luyện Gõ</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 4: INTERACTIVE EXCEL SANDBOX (MÁY TÍNH CÔNG THỨC TRỰC QUAN) */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'sandbox' && (
            <div className="space-y-6">
              {/* Sandbox Top Info & Spreadsheet Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-amber-400" />
                    Trình Thử Nghiệm & Đánh Giá Công Thức Excel Tương Tác
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Nhập công thức bất kỳ bắt đầu bằng dấu "=" để xem kết quả tính toán và giải thích tức thì
                  </p>
                </div>

                {/* Sample Sheet Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Bảng mẫu:</span>
                  {SAMPLE_SPREADSHEETS.map((sheet) => (
                    <button
                      key={sheet.id}
                      onClick={() => setSelectedSheetId(sheet.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedSheetId === sheet.id
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {sheet.name.split('(')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample Spreadsheet Table Viewer */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>📊 {currentSheet.name}</span>
                  <span className="text-slate-500 font-mono">{currentSheet.rows.length} Dòng dữ liệu</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                        <th className="p-2.5 border-r border-slate-800 w-10 text-center font-bold text-slate-500">#</th>
                        {currentSheet.headers.map((h, i) => (
                          <th key={i} className="p-2.5 border-r border-slate-800/60 font-bold text-emerald-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentSheet.rows.map((row, rIdx) => {
                        const isHighlighted = evaluationResult?.matchedRows?.includes(rIdx);
                        return (
                          <tr
                            key={rIdx}
                            className={`border-b border-slate-800/40 transition-colors ${
                              isHighlighted
                                ? 'bg-amber-500/20 font-bold text-amber-200'
                                : rIdx % 2 === 0
                                ? 'bg-slate-950/40'
                                : 'bg-slate-900/20'
                            }`}
                          >
                            <td className="p-2.5 border-r border-slate-800/60 text-center text-slate-500 font-bold">
                              {rIdx + 2}
                            </td>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2.5 border-r border-slate-800/40 text-slate-300">
                                {typeof cell === 'number' ? cell.toLocaleString('vi-VN') : cell}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Interactive Formula Input Bar */}
              <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs rounded-lg border border-emerald-500/30">
                    fx
                  </span>
                  <input
                    type="text"
                    value={sandboxFormula}
                    onChange={(e) => setSandboxFormula(e.target.value)}
                    placeholder='Nhập công thức: =SUM(E2:E8) hoặc =VLOOKUP("Nguyễn Văn Nam", A2:E8, 5, 0)...'
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl font-mono text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    onClick={() => {
                      const res = evaluateExcelFormula(sandboxFormula, currentSheet);
                      setEvaluationResult(res);
                    }}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Tính Toán
                  </button>
                </div>

                {/* Quick Formula Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400 font-bold">Mẫu thử nhanh:</span>
                  {[
                    '=SUM(E2:E8)',
                    '=AVERAGE(E2:E8)',
                    '=SUMIF(B2:B8, "Hà Nội", E2:E8)',
                    '=COUNTIF(C2:C8, "Laptop Dell")',
                    '=MAX(E2:E8)',
                    '=VLOOKUP("Nguyễn Văn Nam", A2:E8, 5, 0)',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSandboxFormula(preset)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 font-mono text-[11px] border border-slate-700/60 cursor-pointer transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Calculation Output Card */}
                {evaluationResult && (
                  <div
                    className={`p-4 rounded-xl border mt-3 flex items-start justify-between gap-4 ${
                      evaluationResult.success
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {evaluationResult.success ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-400" />
                        )}
                        <span className="font-mono text-xl font-black text-white">
                          Kết quả: {evaluationResult.value}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        {evaluationResult.explanation || evaluationResult.error}
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopy(String(evaluationResult.value), 'result')}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedId === 'result' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Sao Chép</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 4: SHORTCUT MATRIX (BẢNG PHÍM TẮT TOÀN DIỆN) */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Hiển thị <strong className="text-white">{filteredShortcuts.length}</strong> phím tắt chuyên nghiệp
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredShortcuts.map((sc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            sc.software === 'word'
                              ? 'bg-blue-600/20 text-blue-300'
                              : 'bg-emerald-600/20 text-emerald-300'
                          }`}
                        >
                          {sc.software}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold bg-slate-900 px-2 py-0.5 rounded">
                          {sc.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{sc.desc}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 font-mono font-black text-xs text-amber-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 shadow-inner">
                      {sc.keys}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* 5. TOPIC DETAIL MODAL OVERLAY (IF CLICKED FROM CURRICULUM) */}
        {/* ========================================================================= */}
        {selectedTopic && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center animate-fadeIn overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-200 my-auto">
              
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase ${
                        selectedTopic.software === 'word'
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                          : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {selectedTopic.software.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-full">
                      {selectedTopic.categoryName}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1.5">{selectedTopic.title}</h3>
                  <p className="text-xs text-emerald-400 font-medium mt-0.5">{selectedTopic.vietnameseTitle}</p>
                </div>

                <button
                  onClick={() => setSelectedTopic(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedTopic.shortDescription}
              </p>

              {/* Syntax */}
              {selectedTopic.syntax && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>Cú pháp chuẩn:</span>
                    <button
                      onClick={() => handleCopy(selectedTopic.syntax || '', 'modal_syntax')}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'modal_syntax' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Sao chép</span>
                    </button>
                  </div>
                  <code className="block font-mono text-sm text-amber-300 whitespace-pre-wrap">
                    {selectedTopic.syntax}
                  </code>
                </div>
              )}

              {/* Parameters Breakdown */}
              {selectedTopic.parameters && selectedTopic.parameters.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Giải thích các tham số:</h4>
                  <div className="space-y-1.5">
                    {selectedTopic.parameters.map((p, i) => (
                      <div key={i} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                        <strong className="text-blue-300 font-mono">{p.name}</strong>
                        {p.optional && <span className="text-slate-500 ml-1">(Tùy chọn)</span>}:{' '}
                        <span className="text-slate-300">{p.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real World Example */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" /> Ví dụ thực tế: {selectedTopic.example.scenario}
                </h4>
                <p className="text-slate-300">
                  <strong>Thực hiện:</strong> <span className="font-mono text-blue-300">{selectedTopic.example.formulaOrSteps}</span>
                </p>
                <p className="text-slate-300">
                  <strong>Kết quả:</strong> <span className="text-emerald-400 font-bold">{selectedTopic.example.result}</span>
                </p>
                <p className="text-slate-400 italic">{selectedTopic.example.explanation}</p>
              </div>

              {/* Pro Tips / Mistakes */}
              {selectedTopic.proTips && selectedTopic.proTips.length > 0 && (
                <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-600/40 text-xs text-amber-200">
                  <strong>💡 Mẹo vàng chuyên nghiệp:</strong> {selectedTopic.proTips.join(' • ')}
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {selectedTopic.software === 'excel' && (
                  <button
                    onClick={() => handleSendToSandbox(selectedTopic.example.formulaOrSteps || selectedTopic.syntax || '')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>Thử Nghiệm Trong Sandbox</span>
                  </button>
                )}
                <button
                  onClick={() => handleLaunchPracticeDrill(selectedTopic)}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/30 cursor-pointer transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Luyện Gõ Cú Pháp Này</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
