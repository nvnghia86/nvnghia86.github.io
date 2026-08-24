import React, { useState } from 'react';
import { Lesson } from '../types';
import { useTranslation } from '../i18n';
import { Zap, X, Sparkles, BookOpen, Key } from 'lucide-react';

interface CustomPracticeModalProps {
  onStartCustomLesson: (lesson: Lesson) => void;
  onClose: () => void;
}

export const CustomPracticeModal: React.FC<CustomPracticeModalProps> = ({
  onStartCustomLesson,
  onClose,
}) => {
  const { t, language } = useTranslation();
  const [tab, setTab] = useState<'text' | 'keys'>('text');
  const [customTitle, setCustomTitle] = useState(
    language === 'vi' ? 'Bài Luyện Gõ Tiếng Việt Tự Chọn' : 'Custom Typing Drill'
  );
  const [customText, setCustomText] = useState(
    language === 'vi'
      ? 'Học tập chăm chỉ mỗi ngày. Giữ thẳng lưng, các ngón tay thả lỏng đặt nhẹ nhàng trên hàng phím cơ sở và duy trì nhịp gõ đều đặn.'
      : 'Practice makes permanent. Focus on light, relaxed fingertips and maintaining a steady rhythmic cadence without looking down at the keyboard.'
  );
  const [selectedFocusKeys, setSelectedFocusKeys] = useState<string[]>(['f', 'j', 'd', 'k']);
  const [targetWpm, setTargetWpm] = useState(30);

  const alphabet = 'abcdefghijklmnopqrstuvwxyzăâêôơưđ0123456789,.;:!?'.split('');

  const sampleVietnameseTexts = [
    {
      title: 'Tục ngữ Việt Nam',
      text: 'Có công mài sắt có ngày nên kim. Ăn quả nhớ kẻ trồng cây, uống nước nhớ nguồn.',
    },
    {
      title: 'Văn bản văn phòng',
      text: 'Cộng hòa Xã hội Chủ nghĩa Việt Nam. Độc lập - Tự do - Hạnh phúc. Biên bản bàn giao công tác.',
    },
    {
      title: 'Luyện 7 nguyên âm có dấu',
      text: 'ă â ê ô ơ ư đ. ăn cơm ấm áp êm đềm ốc sên ớt cay ưa chuộng đường đi.',
    },
  ];

  const toggleKey = (k: string) => {
    if (selectedFocusKeys.includes(k)) {
      setSelectedFocusKeys(selectedFocusKeys.filter((x) => x !== k));
    } else {
      setSelectedFocusKeys([...selectedFocusKeys, k]);
    }
  };

  const handleStartTextLesson = () => {
    const rawParagraphs = customText
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const content = rawParagraphs.length > 0 ? rawParagraphs : [customText.trim()];

    const customLesson: Lesson = {
      id: 999,
      unitId: 1,
      unitTitle: 'Custom Drill',
      title: customTitle || 'Custom Practice',
      type: 'lesson',
      description: 'User-created custom practice exercise.',
      targetKeys: ['custom'],
      content,
      minAccuracy: 90,
      targetWpm,
    };

    onStartCustomLesson(customLesson);
  };

  const handleStartGeneratedKeysLesson = () => {
    if (selectedFocusKeys.length === 0) return;

    // Generate 4 rhythmic drill lines using selected keys
    const lines: string[] = [];
    for (let l = 0; l < 4; l++) {
      const words: string[] = [];
      for (let w = 0; w < 6; w++) {
        let word = '';
        const wordLen = 2 + Math.floor(Math.random() * 4);
        for (let c = 0; c < wordLen; c++) {
          const randKey = selectedFocusKeys[Math.floor(Math.random() * selectedFocusKeys.length)];
          word += randKey;
        }
        words.push(word);
      }
      lines.push(words.join(' '));
    }

    const customLesson: Lesson = {
      id: 999,
      unitId: 1,
      unitTitle: 'Custom Key Drill',
      title: `Focus Drill (${selectedFocusKeys.join(', ')})`,
      type: 'lesson',
      description: 'Focus drill on selected keys.',
      targetKeys: selectedFocusKeys,
      content: lines,
      minAccuracy: 90,
      targetWpm,
    };

    onStartCustomLesson(customLesson);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-xl w-full text-slate-800 flex flex-col relative animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-blue-600 fill-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t.customPractice.modalTitle}</h2>
            <p className="text-xs text-slate-500">{t.customPractice.modalSubtitle}</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 mb-6">
          <button
            onClick={() => setTab('text')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'text' ? 'bg-white text-blue-700 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> {t.customPractice.pasteTab}
          </button>
          <button
            onClick={() => setTab('keys')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'keys' ? 'bg-white text-blue-700 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> {t.customPractice.focusKeysTab}
          </button>
        </div>

        {tab === 'text' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                {t.customPractice.lessonTitle}:
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={t.customPractice.titlePlaceholder}
                className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-600 font-medium shadow-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase text-slate-500">
                  {t.customPractice.lessonContent}:
                </label>
                {language === 'vi' && (
                  <span className="text-[11px] text-slate-400 font-medium">Chọn mẫu nhanh:</span>
                )}
              </div>

              {language === 'vi' && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {sampleVietnameseTexts.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomTitle(sample.title);
                        setCustomText(sample.text);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer"
                    >
                      {sample.title}
                    </button>
                  ))}
                </div>
              )}

              <textarea
                rows={4}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={t.customPractice.contentPlaceholder}
                className="w-full bg-slate-50 text-slate-900 p-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:border-blue-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                {t.customPractice.targetWpm} ({targetWpm} WPM):
              </label>
              <input
                type="range"
                min="15"
                max="80"
                value={targetWpm}
                onChange={(e) => setTargetWpm(parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <button
              onClick={handleStartTextLesson}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> {t.customPractice.startDrill}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                {t.customPractice.clickKeysPrompt}
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                {alphabet.map((char) => {
                  const isSelected = selectedFocusKeys.includes(char);
                  return (
                    <button
                      key={char}
                      onClick={() => toggleKey(char)}
                      className={`w-8 h-8 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs scale-105'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {char}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                {t.customPractice.targetWpm} ({targetWpm} WPM):
              </label>
              <input
                type="range"
                min="15"
                max="80"
                value={targetWpm}
                onChange={(e) => setTargetWpm(parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <button
              onClick={handleStartGeneratedKeysLesson}
              disabled={selectedFocusKeys.length === 0}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> {t.customPractice.generateDrill}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
