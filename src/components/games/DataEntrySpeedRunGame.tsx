import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Lesson, LessonResult, UserSettings } from '../../types';
import { soundEngine } from '../../utils/soundEngine';
import { triggerConfetti } from '../../utils/confetti';
import {
  ArrowLeft,
  RotateCcw,
  Zap,
  Trophy,
  Gauge,
  Flame,
  Award,
  Sparkles,
  Play,
  ShieldAlert,
  ChevronRight,
  Database,
  Hash,
  DollarSign,
  UserCheck,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';

export type SpeedRunMode =
  | 'invoice_code'
  | 'finance_currency'
  | 'names_email'
  | 'excel_formula'
  | 'phone_id'
  | 'grand_prix';

interface SpeedRunItem {
  id: string;
  category: string;
  label: string;
  text: string;
  description: string;
  iconType: 'code' | 'dollar' | 'user' | 'formula' | 'phone' | 'grand';
}

const DATA_ENTRY_PACKS: Record<SpeedRunMode, { title: string; subtitle: string; icon: string; items: SpeedRunItem[] }> = {
  invoice_code: {
    title: 'Mã Hóa Đơn & Serial',
    subtitle: 'Luyện nhập mã đơn hàng, SKU, vận đơn & ký tự gạch nối',
    icon: 'Hash',
    items: [
      { id: '1', category: 'Hóa Đơn GTGT', label: 'Số Hóa Đơn', text: 'HD-2026-8942', description: 'Hóa đơn bán hàng tháng 8', iconType: 'code' },
      { id: '2', category: 'Vận Đơn', label: 'Mã Vận Chuyển', text: 'VNPOST-99238-HCM', description: 'Bưu gửi hỏa tốc liên tỉnh', iconType: 'code' },
      { id: '3', category: 'Mã Kho', label: 'SKU Sản Phẩm', text: 'SKU-8849-DELL-XPS', description: 'Mã linh kiện điện tử kho A1', iconType: 'code' },
      { id: '4', category: 'Lô Hàng', label: 'Mã Số Lô', text: 'LOT#2026-BATCH-09', description: 'Kiểm định xuất nhập khẩu', iconType: 'code' },
      { id: '5', category: 'Mã Hợp Đồng', label: 'Số Hợp Đồng', text: 'HDKT-2026/FPT-HCM', description: 'Hợp đồng kinh tế phần mềm', iconType: 'code' },
      { id: '6', category: 'Mã Phiếu Chi', label: 'Chứng Từ Kế Toán', text: 'PC-08/2026-9021', description: 'Phiếu thanh toán công tác phí', iconType: 'code' },
    ],
  },
  finance_currency: {
    title: 'Kế Toán & Doanh Thu',
    subtitle: 'Luyện gõ số tiền, dấu phẩy phân cách, đơn vị VNĐ và USD',
    icon: 'DollarSign',
    items: [
      { id: '1', category: 'Doanh Thu', label: 'Doanh Số Bán Hàng', text: '15,450,000 VND', description: 'Đơn hàng bán lẻ ca 1', iconType: 'dollar' },
      { id: '2', category: 'Ngoại Tệ', label: 'Thanh Toán Quốc Tế', text: '$12,850.50 USD', description: 'Hợp đồng gia công nước ngoài', iconType: 'dollar' },
      { id: '3', category: 'Lợi Nhuận', label: 'Lợi Nhuận Thuần', text: '250,000,000 đ', description: 'Báo cáo quý 3 ban giám đốc', iconType: 'dollar' },
      { id: '4', category: 'Thuế VAT', label: 'Tiền Thuế 8%', text: '1,236,000 VNĐ', description: 'Kê khai thuế điện tử tháng', iconType: 'dollar' },
      { id: '5', category: 'Tạm Ứng', label: 'Chi Phí Sản Xuất', text: '89,500,000 VND', description: 'Nhập vật tư xưởng sản xuất', iconType: 'dollar' },
      { id: '6', category: 'Giá Trị Hợp Đồng', label: 'Tổng Thanh Quyết Toán', text: '$450,000.00 USD', description: 'Dự án thầu tòa nhà thông minh', iconType: 'dollar' },
    ],
  },
  names_email: {
    title: 'Họ Tên & Email Công Sở',
    subtitle: 'Luyện nhập danh bạ nhân sự, khách hàng & địa chỉ email',
    icon: 'UserCheck',
    items: [
      { id: '1', category: 'Nhân Sự', label: 'Trưởng Phòng KD', text: 'Nguyen Van An', description: 'Phòng Phát Triển Kinh Doanh', iconType: 'user' },
      { id: '2', category: 'Email', label: 'Email Công Ty', text: 'tran.thi.mai@company.vn', description: 'Hòm thư nội bộ bộ phận Kế toán', iconType: 'user' },
      { id: '3', category: 'Khách Hàng', label: 'Đại Diện Pháp Luật', text: 'Le Quoc Bao', description: 'Tổng Giám Đốc Công Ty Alpha', iconType: 'user' },
      { id: '4', category: 'Email', label: 'Email Học Viện', text: 'pham.minh.tri@fpt.edu.vn', description: 'Chuyên viên đào tạo nhân sự', iconType: 'user' },
      { id: '5', category: 'Nhân Sự', label: 'Chuyên Viên IT', text: 'Hoang Thi Thu Ha', description: 'Quản trị hệ thống máy chủ', iconType: 'user' },
      { id: '6', category: 'Email', label: 'Email Hỗ Trợ', text: 'support-team@techcorp.com', description: 'Cổng tiếp nhận hỗ trợ khách hàng', iconType: 'user' },
    ],
  },
  excel_formula: {
    title: 'Siêu Công Thức Excel F1',
    subtitle: 'Luyện gõ thần tốc các hàm VLOOKUP, SUMIFS, XLOOKUP, INDEX',
    icon: 'FileSpreadsheet',
    items: [
      { id: '1', category: 'Dò Tìm', label: 'Công Thức VLOOKUP', text: '=VLOOKUP(A2,D:F,3,0)', description: 'Tìm kiếm chính xác đơn giá sản phẩm', iconType: 'formula' },
      { id: '2', category: 'Thống Kê', label: 'Công Thức SUMIFS', text: '=SUMIFS(E2:E100,B2:B100,"Hanoi")', description: 'Tính tổng doanh thu theo điều kiện vùng', iconType: 'formula' },
      { id: '3', category: 'Siêu Hàm', label: 'Công Thức XLOOKUP', text: '=XLOOKUP(ID,A:A,B:B,"N/A")', description: 'Dò tìm 2 chiều thế hệ mới linh hoạt', iconType: 'formula' },
      { id: '4', category: 'Điều Kiện', label: 'Công Thức Logic IF', text: '=IF(C2>=8,"Gioi","Kha")', description: 'Xếp loại năng lực nhân viên tháng', iconType: 'formula' },
      { id: '5', category: 'Dò Tìm 2 Chiều', label: 'Cặp Đôi INDEX-MATCH', text: '=INDEX(C2:C50,MATCH(E2,A2:A50,0))', description: 'Tra cứu chuyên nghiệp không giới hạn cột', iconType: 'formula' },
      { id: '6', category: 'Đếm Có Điều Kiện', label: 'Công Thức COUNTIFS', text: '=COUNTIFS(D2:D100,">5000",C2:C100,"HCM")', description: 'Đếm số đơn hàng giá trị cao tại HCM', iconType: 'formula' },
    ],
  },
  phone_id: {
    title: 'Số Điện Thoại & CCCD',
    subtitle: 'Luyện nhập số di động, mã vùng cố định & dãy số định danh 12 số',
    icon: 'Phone',
    items: [
      { id: '1', category: 'Di Động', label: 'Hotline Viettel', text: '0988.765.432', description: 'Số di động tư vấn khách hàng', iconType: 'phone' },
      { id: '2', category: 'Định Danh', label: 'Số Thẻ CCCD', text: '079201004829', description: 'Căn cước công dân gắn chip', iconType: 'phone' },
      { id: '3', category: 'Bàn Cố Định', label: 'Tổng Đài Hà Nội', text: '(024) 3823.9988', description: 'Văn phòng đại diện miền Bắc', iconType: 'phone' },
      { id: '4', category: 'Di Động', label: 'Hotline Vinaphone', text: '0912.345.678', description: 'Đường dây nóng hỗ trợ kỹ thuật', iconType: 'phone' },
      { id: '5', category: 'Mã Số Thuế', label: 'MST Doanh Nghiệp', text: '0101234567-001', description: 'Mã số thuế chi nhánh công ty', iconType: 'phone' },
      { id: '6', category: 'Định Danh', label: 'Số CCCD Miền Trung', text: '048195003112', description: 'Hồ sơ bảo hiểm xã hội nhân sự', iconType: 'phone' },
    ],
  },
  grand_prix: {
    title: 'Grand Prix Toàn Năng',
    subtitle: 'Thử thách tổng hợp: Mã hóa đơn ➔ Tiền tệ ➔ Công thức ➔ CCCD',
    icon: 'Layers',
    items: [
      { id: '1', category: 'Hóa Đơn', label: 'Mã Giao Dịch', text: 'INV-2026/HN-9812', description: 'Mã giao dịch bán buôn', iconType: 'grand' },
      { id: '2', category: 'Số Tiền', label: 'Thanh Toán Sau Thuế', text: '86,400,000 VND', description: 'Chuyển khoản liên ngân hàng', iconType: 'grand' },
      { id: '3', category: 'Công Thức', label: 'Tính Chiết Khấu', text: '=IF(E2>50000000,E2*0.05,0)', description: 'Công thức tự động giảm giá 5%', iconType: 'grand' },
      { id: '4', category: 'Khách Hàng', label: 'Họ Tên & MST', text: 'Vuong Dinh Hai (0319283741)', description: 'Thông tin xuất hóa đơn đỏ', iconType: 'grand' },
      { id: '5', category: 'Tra Cứu', label: 'Công Thức XLOOKUP', text: '=XLOOKUP("VIP-01",A:A,F:F)', description: 'Tra cứu hạn mức tín dụng khách VIP', iconType: 'grand' },
      { id: '6', category: 'Xác Nhận', label: 'Mã Xác Thực Ký Số', text: 'AUTH-TOKEN: 9948-2831-OK', description: 'Xác thực chữ ký điện tử hợp lệ', iconType: 'grand' },
    ],
  },
};

const CAR_OPTIONS = [
  {
    id: 'f1_lightning',
    name: 'F1 XLOOKUP Lightning',
    speedLabel: 'Siêu Tốc 950 HP',
    color: 'from-cyan-500 to-blue-600',
    border: 'border-cyan-400',
    carColor: '#06b6d4',
    accentColor: '#3b82f6',
    flameColor: '#00f2fe',
    description: 'Tối ưu cho dân chuyên nghiệp thích tốc độ cao',
  },
  {
    id: 'sedan_office',
    name: 'Sedan Executive Office',
    speedLabel: 'Cân Bằng 600 HP',
    color: 'from-emerald-500 to-teal-700',
    border: 'border-emerald-400',
    carColor: '#10b981',
    accentColor: '#0d9488',
    flameColor: '#34d399',
    description: 'Đầm chắc, êm ái, thích hợp luyện tập độ chuẩn xác',
  },
  {
    id: 'cybertruck',
    name: 'CyberTruck BigData 4x4',
    speedLabel: 'Mô-men Xoắn 1200 Nm',
    color: 'from-purple-500 to-pink-600',
    border: 'border-purple-400',
    carColor: '#a855f7',
    accentColor: '#ec4899',
    flameColor: '#f43f5e',
    description: 'Càn lướt mọi dữ liệu phức tạp, tăng tốc Nitro mạnh mẽ',
  },
  {
    id: 'hyperspace',
    name: 'HyperSpace MailMerge Pod',
    speedLabel: 'Phản Lực Mach 3',
    color: 'from-amber-500 to-orange-600',
    border: 'border-amber-400',
    carColor: '#f59e0b',
    accentColor: '#ea580c',
    flameColor: '#f97316',
    description: 'Chiến xa công nghệ cao với động cơ phản lực đôi',
  },
];

interface DataEntrySpeedRunGameProps {
  lesson?: Lesson;
  settings?: UserSettings;
  onFinish: (result: LessonResult) => void;
  onBack: () => void;
}

export const DataEntrySpeedRunGame: React.FC<DataEntrySpeedRunGameProps> = ({
  lesson,
  settings,
  onFinish,
  onBack,
}) => {
  // Game Configuration State
  const [selectedMode, setSelectedMode] = useState<SpeedRunMode>('invoice_code');
  const [selectedCarIndex, setSelectedCarIndex] = useState(0);
  const [gameState, setGameState] = useState<'lobby' | 'countdown' | 'racing' | 'finished'>('lobby');

  // Items stream queue
  const currentPack = DATA_ENTRY_PACKS[selectedMode];
  const items = currentPack.items;

  // Active Typing State
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [charIndexInItem, setCharIndexInItem] = useState(0);
  const [hasMistakeInCurrentChar, setHasMistakeInCurrentChar] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  // Racing Progress & Metrics
  const [playerDistance, setPlayerDistance] = useState(0); // 0 to 100
  const [bot1Distance, setBot1Distance] = useState(0); // Intern (35 WPM)
  const [bot2Distance, setBot2Distance] = useState(0); // Chief Accountant (55 WPM)
  const [bot3Distance, setBot3Distance] = useState(0); // AutoBot AI (75 WPM)

  // Nitro & Combos
  const [nitroMeter, setNitroMeter] = useState(0); // 0 to 100
  const [isNitroActive, setIsNitroActive] = useState(false);
  const [currentCombo, setCurrentCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [nitroTriggerCount, setNitroTriggerCount] = useState(0);

  // Performance Stats
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [totalKeysPressed, setTotalKeysPressed] = useState(0);
  const [correctKeysPressed, setCorrectKeysPressed] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [countdownNum, setCountdownNum] = useState(3);
  const [currentSpeedWpm, setCurrentSpeedWpm] = useState(0);
  const [gear, setGear] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeCar = CAR_OPTIONS[selectedCarIndex];

  // Total characters in race
  const totalRaceChars = useMemo(() => {
    return items.reduce((acc, item) => acc + item.text.length, 0);
  }, [items]);

  // Overall typed characters across previous finished items + current index
  const totalTypedOverall = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < currentItemIndex; i++) {
      sum += items[i].text.length;
    }
    return sum + charIndexInItem;
  }, [items, currentItemIndex, charIndexInItem]);

  // Focus container when racing starts
  useEffect(() => {
    if (gameState === 'racing') {
      containerRef.current?.focus();
    }
  }, [gameState]);

  // Start Countdown Sequence
  const handleStartRace = useCallback(() => {
    setGameState('countdown');
    setCountdownNum(3);
    setCurrentItemIndex(0);
    setCharIndexInItem(0);
    setHasMistakeInCurrentChar(false);
    setPlayerDistance(0);
    setBot1Distance(0);
    setBot2Distance(0);
    setBot3Distance(0);
    setNitroMeter(0);
    setIsNitroActive(false);
    setCurrentCombo(0);
    setMaxCombo(0);
    setNitroTriggerCount(0);
    setTotalKeysPressed(0);
    setCorrectKeysPressed(0);
    setErrorsCount(0);
    setGear(1);
    soundEngine.playEngineRev();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (gameState !== 'countdown') return;

    if (countdownNum > 0) {
      const t = setTimeout(() => {
        soundEngine.playKeyClick(false);
        setCountdownNum((c) => c - 1);
      }, 950);
      return () => clearTimeout(t);
    } else {
      soundEngine.playVictoryFanfare();
      setGameState('racing');
      setStartTime(Date.now());
    }
  }, [gameState, countdownNum]);

  // Nitro decay timer
  useEffect(() => {
    if (!isNitroActive) return;
    const t = setTimeout(() => {
      setIsNitroActive(false);
    }, 2800);
    return () => clearTimeout(t);
  }, [isNitroActive]);

  // Bot Racing Simulation Loop
  useEffect(() => {
    if (gameState !== 'racing') return;

    const interval = setInterval(() => {
      const step = 0.28;
      // Bot 1 (Intern): ~34 WPM
      setBot1Distance((p) => Math.min(100, p + step * (0.85 + Math.random() * 0.3)));
      // Bot 2 (Accountant): ~52 WPM
      setBot2Distance((p) => Math.min(100, p + step * (1.25 + Math.random() * 0.4)));
      // Bot 3 (AI Bot): ~76 WPM
      setBot3Distance((p) => Math.min(100, p + step * (1.75 + Math.random() * 0.45)));
    }, 250);

    return () => clearInterval(interval);
  }, [gameState]);

  // Realtime WPM & Gear Calculation
  useEffect(() => {
    if (gameState !== 'racing' || !startTime) return;

    const interval = setInterval(() => {
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      if (elapsedMinutes > 0.01) {
        const words = totalTypedOverall / 5;
        const wpm = Math.round(words / elapsedMinutes);
        setCurrentSpeedWpm(wpm);

        // Gear shifts
        if (wpm < 25) setGear(1);
        else if (wpm < 45) setGear(2);
        else if (wpm < 65) setGear(3);
        else if (wpm < 90) setGear(4);
        else setGear(5);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [gameState, startTime, totalTypedOverall]);

  // Finish Race Handler
  const handleCompleteRace = useCallback(() => {
    const finishedAt = Date.now();
    setEndTime(finishedAt);
    setGameState('finished');
    soundEngine.playVictoryFanfare();
    triggerConfetti();

    const elapsedSeconds = startTime ? Math.max(1, Math.round((finishedAt - startTime) / 1000)) : 30;
    const finalAccuracy = totalKeysPressed > 0 ? Math.round((correctKeysPressed / totalKeysPressed) * 100) : 100;
    const finalWpm = Math.round((totalTypedOverall / 5) / (elapsedSeconds / 60));

    let stars = 3;
    if (finalWpm >= 65 && finalAccuracy >= 95) stars = 5;
    else if (finalWpm >= 45 && finalAccuracy >= 90) stars = 4;
    else if (finalWpm < 25 || finalAccuracy < 80) stars = 2;

    const result: LessonResult = {
      lessonId: lesson?.id || 9901,
      stars,
      wpm: finalWpm,
      rawWpm: finalWpm,
      accuracy: finalAccuracy,
      timeSeconds: elapsedSeconds,
      errorCount: errorsCount,
      wrongKeys: {},
      completedAt: new Date().toISOString(),
    };

    // Delay finish callback if caller wants result modal
  }, [
    startTime,
    totalKeysPressed,
    correctKeysPressed,
    totalTypedOverall,
    errorsCount,
    lesson,
  ]);

  // Key Down Engine
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (gameState !== 'racing') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
        return;
      }

      // Ignore modifiers
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta' || e.key === 'CapsLock') {
        return;
      }

      const currentItem = items[currentItemIndex];
      if (!currentItem) return;

      const expectedChar = currentItem.text[charIndexInItem];
      const inputChar = e.key;

      setTotalKeysPressed((prev) => prev + 1);

      if (inputChar === expectedChar) {
        // Correct character typed
        soundEngine.playKeyClick(expectedChar === ' ');
        setCorrectKeysPressed((prev) => prev + 1);
        setHasMistakeInCurrentChar(false);

        // Update Combos & Nitro
        const newCombo = currentCombo + 1;
        setCurrentCombo(newCombo);
        if (newCombo > maxCombo) setMaxCombo(newCombo);

        // Increase Nitro
        const nitroGain = isNitroActive ? 0 : 3.5;
        const newNitro = Math.min(100, nitroMeter + nitroGain);
        setNitroMeter(newNitro);

        // Auto trigger Nitro boost when filled!
        if (newNitro >= 100 && !isNitroActive) {
          setIsNitroActive(true);
          setNitroMeter(0);
          setNitroTriggerCount((prev) => prev + 1);
          soundEngine.playNitroBoost();
        }

        const nextCharIdx = charIndexInItem + 1;
        const isItemDone = nextCharIdx >= currentItem.text.length;

        if (isItemDone) {
          soundEngine.playGearShift();
          const nextItemIdx = currentItemIndex + 1;
          if (nextItemIdx >= items.length) {
            // FINISHED ALL ITEMS!
            setPlayerDistance(100);
            handleCompleteRace();
          } else {
            setCurrentItemIndex(nextItemIdx);
            setCharIndexInItem(0);
            const overallProg = Math.round(((totalTypedOverall + 1) / totalRaceChars) * 100);
            setPlayerDistance(Math.min(99, overallProg));
          }
        } else {
          setCharIndexInItem(nextCharIdx);
          const overallProg = Math.round(((totalTypedOverall + 1) / totalRaceChars) * 100);
          setPlayerDistance(Math.min(99, overallProg));
        }
      } else {
        // WRONG KEY
        soundEngine.playBrakeSkid();
        setErrorsCount((prev) => prev + 1);
        setHasMistakeInCurrentChar(true);
        setCurrentCombo(0); // Reset combo
        setShakeTrigger((prev) => prev + 1);
      }
    },
    [
      gameState,
      items,
      currentItemIndex,
      charIndexInItem,
      currentCombo,
      maxCombo,
      nitroMeter,
      isNitroActive,
      totalTypedOverall,
      totalRaceChars,
      handleCompleteRace,
      onBack,
    ]
  );

  // Current item details
  const activeItem = items[currentItemIndex] || items[0];

  // Final Results calculation
  const totalElapsedSec = useMemo(() => {
    if (!startTime) return 0;
    const end = endTime || Date.now();
    return Math.max(1, Math.round((end - startTime) / 1000));
  }, [startTime, endTime]);

  const finalAccuracy = totalKeysPressed > 0 ? Math.round((correctKeysPressed / totalKeysPressed) * 100) : 100;
  const finalWpm = Math.round((totalTypedOverall / 5) / (totalElapsedSec / 60));

  // Determine Rank
  const playerRank = useMemo(() => {
    const list = [
      { name: 'Player', distance: playerDistance },
      { name: 'Bot1', distance: bot1Distance },
      { name: 'Bot2', distance: bot2Distance },
      { name: 'Bot3', distance: bot3Distance },
    ].sort((a, b) => b.distance - a.distance);
    return list.findIndex((r) => r.name === 'Player') + 1;
  }, [playerDistance, bot1Distance, bot2Distance, bot3Distance]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased outline-none flex flex-col justify-between select-none relative overflow-hidden"
    >
      {/* Dynamic Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-40" />

      {/* Top Header Navigation */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Thoát Game</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black text-lg">
              🏎️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-wide">
                  Data Entry Speed Run
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Đua Xe Nhập Liệu
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentPack.title} • {currentPack.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry HUD (when racing) */}
        {gameState === 'racing' && (
          <div className="flex items-center gap-4">
            {/* Speedometer Gauge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 shadow-inner">
              <Gauge className="w-4 h-4 text-cyan-400 animate-pulse" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 leading-none">Tốc độ</div>
                <div className="text-sm font-black text-cyan-300 leading-tight flex items-baseline gap-1">
                  <span>{currentSpeedWpm}</span>
                  <span className="text-[10px] font-normal text-slate-400">WPM</span>
                </div>
              </div>
            </div>

            {/* Gear Indicator */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-col items-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">Cấp Số</span>
              <span className="text-sm font-black text-amber-400 leading-tight">
                {isNitroActive ? 'NITRO' : `SỐ ${gear}`}
              </span>
            </div>

            {/* Nitro Gauge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700">
              <Flame className={`w-4 h-4 ${isNitroActive ? 'text-orange-400 animate-bounce' : 'text-slate-500'}`} />
              <div className="w-24">
                <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 mb-0.5">
                  <span>N2O Boost</span>
                  <span>{isNitroActive ? 'BỨT TỐC!' : `${Math.round(nitroMeter)}%`}</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-150 ${
                      isNitroActive
                        ? 'bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 animate-pulse'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                    style={{ width: `${isNitroActive ? 100 : nitroMeter}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Arena */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-10 max-w-5xl mx-auto w-full">
        {/* ================= STATE 1: LOBBY & VEHICLE SELECT ================= */}
        {gameState === 'lobby' && (
          <div className="w-full space-y-6">
            {/* Mode Category Selector */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
                1. Chọn Chủ Đề Dữ Liệu Thi Đấu
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(Object.keys(DATA_ENTRY_PACKS) as SpeedRunMode[]).map((modeKey) => {
                  const pack = DATA_ENTRY_PACKS[modeKey];
                  const isSelected = selectedMode === modeKey;
                  return (
                    <button
                      key={modeKey}
                      onClick={() => {
                        setSelectedMode(modeKey);
                        soundEngine.playKeyClick();
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-br from-blue-900/60 to-indigo-900/60 border-blue-400 shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/40'
                          : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-white">{pack.title}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-md shadow-cyan-400 animate-ping" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {pack.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vehicle & Garage Selector */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
                2. Chọn Chiến Xa Công Sở Của Bạn
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CAR_OPTIONS.map((car, idx) => {
                  const isSelected = selectedCarIndex === idx;
                  return (
                    <button
                      key={car.id}
                      onClick={() => {
                        setSelectedCarIndex(idx);
                        soundEngine.playKeyClick();
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                        isSelected
                          ? `bg-gradient-to-br ${car.color} bg-opacity-20 ${car.border} shadow-lg ring-2 ring-white/20`
                          : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                            {car.speedLabel}
                          </span>
                          <span className="text-xl">🏎️</span>
                        </div>
                        <div className="text-sm font-black text-white">{car.name}</div>
                        <p className="text-[10px] text-slate-400">{car.description}</p>
                      </div>

                      {/* Mini car SVG preview */}
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-center">
                        <div
                          className="w-16 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-md"
                          style={{ backgroundColor: car.carColor }}
                        >
                          TURBO
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launch Action Button */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Quy tắc: Nhập chính xác từng trường dữ liệu để bứt tốc vượt 3 đối thủ AI!</span>
              </div>

              <button
                onClick={handleStartRace}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-slate-950 font-black text-base shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>BẮT ĐẦU ĐUA XE TỐC ĐỘ</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STATE 2: COUNTDOWN 3-2-1 ================= */}
        {gameState === 'countdown' && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">
              Chuẩn Bị Vào Vị Trí Xuất Phát
            </div>
            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-7xl font-black text-white shadow-2xl shadow-orange-500/50 animate-bounce">
              {countdownNum === 0 ? 'GO!' : countdownNum}
            </div>
            <p className="text-sm text-slate-400 font-medium">
              Đặt 10 ngón tay lên bàn phím và sẵn sàng bứt tốc Nitro!
            </p>
          </div>
        )}

        {/* ================= STATE 3: ACTIVE RACING ARENA ================= */}
        {gameState === 'racing' && (
          <div className="w-full space-y-6">
            {/* 3D Animated Racing Highway Track */}
            <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl overflow-hidden space-y-3">
              {/* Highway Road Marks Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500 via-slate-900 to-black" />

              {/* Lane 1: Player Car */}
              <div className="relative space-y-1">
                <div className="flex justify-between text-[11px] font-black text-cyan-400 uppercase">
                  <span className="flex items-center gap-1.5">
                    <span>🏎️ Bạn ({activeCar.name})</span>
                    {isNitroActive && (
                      <span className="px-1.5 py-0.2 rounded bg-orange-500 text-slate-950 font-black text-[9px] animate-pulse">
                        NITRO ON!
                      </span>
                    )}
                  </span>
                  <span>{Math.round(playerDistance)}% Về Đích</span>
                </div>
                <div className="h-10 bg-slate-950 rounded-xl relative overflow-hidden border border-cyan-500/30 flex items-center px-2">
                  {/* Road Striped Lines */}
                  <div className="absolute inset-0 flex items-center justify-around opacity-20">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="w-4 h-1 bg-white rounded-full" />
                    ))}
                  </div>

                  {/* Finish Line Flag */}
                  <div className="absolute right-2 top-0 bottom-0 w-3 bg-[repeating-linear-gradient(45deg,#000,#000_4px,#fff_4px,#fff_8px)] opacity-60" />

                  {/* Player Car Sprite */}
                  <div
                    className="absolute transition-all duration-150 flex items-center gap-1 z-10"
                    style={{ left: `calc(${playerDistance * 0.88}% + 4px)` }}
                  >
                    {isNitroActive && (
                      <div className="text-sm animate-pulse -mr-1">🔥</div>
                    )}
                    <div
                      className="px-2 py-1 rounded-md text-[10px] font-black text-white shadow-lg border border-white/30 flex items-center gap-1"
                      style={{ backgroundColor: activeCar.carColor }}
                    >
                      <span>🏎️</span>
                      <span className="hidden sm:inline">YOU</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lane 2: Bot 1 (Thực Tập Sinh) */}
              <div className="relative space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>🤖 Bot Thực Tập Sinh (35 WPM)</span>
                  <span>{Math.round(bot1Distance)}%</span>
                </div>
                <div className="h-8 bg-slate-950/80 rounded-xl relative overflow-hidden border border-slate-800 flex items-center px-2">
                  <div
                    className="absolute transition-all duration-200 flex items-center z-10"
                    style={{ left: `calc(${bot1Distance * 0.88}% + 4px)` }}
                  >
                    <div className="px-2 py-0.5 rounded bg-slate-700 text-[9px] font-bold text-slate-300 border border-slate-600 flex items-center gap-1">
                      <span>🚗</span>
                      <span>Bot 1</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lane 3: Bot 2 (Kế Toán Trưởng) */}
              <div className="relative space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-amber-400/80">
                  <span>🤖 Bot Kế Toán Trưởng (55 WPM)</span>
                  <span>{Math.round(bot2Distance)}%</span>
                </div>
                <div className="h-8 bg-slate-950/80 rounded-xl relative overflow-hidden border border-slate-800 flex items-center px-2">
                  <div
                    className="absolute transition-all duration-200 flex items-center z-10"
                    style={{ left: `calc(${bot2Distance * 0.88}% + 4px)` }}
                  >
                    <div className="px-2 py-0.5 rounded bg-amber-700/80 text-[9px] font-bold text-amber-100 border border-amber-500/50 flex items-center gap-1">
                      <span>🚙</span>
                      <span>Bot 2</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lane 4: Bot 3 (Siêu AI Automation) */}
              <div className="relative space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-purple-400/80">
                  <span>⚡ Bot Siêu AI Automation (75 WPM)</span>
                  <span>{Math.round(bot3Distance)}%</span>
                </div>
                <div className="h-8 bg-slate-950/80 rounded-xl relative overflow-hidden border border-slate-800 flex items-center px-2">
                  <div
                    className="absolute transition-all duration-200 flex items-center z-10"
                    style={{ left: `calc(${bot3Distance * 0.88}% + 4px)` }}
                  >
                    <div className="px-2 py-0.5 rounded bg-purple-700/80 text-[9px] font-bold text-purple-100 border border-purple-500/50 flex items-center gap-1">
                      <span>🛸</span>
                      <span>AI Bot</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Data Item Clipboard & Input Display */}
            <div
              className={`rounded-3xl bg-slate-900 border p-6 sm:p-8 transition-all relative overflow-hidden shadow-2xl ${
                hasMistakeInCurrentChar
                  ? 'border-rose-500 shadow-rose-500/20 animate-shake'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header Info */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Mục {currentItemIndex + 1}/{items.length}: {activeItem.category}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {activeItem.label}
                  </span>
                </div>

                {/* Combo Display */}
                {currentCombo > 2 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 text-xs font-black animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>COMBO x{currentCombo}!</span>
                  </div>
                )}
              </div>

              {/* Large High-Contrast Typing Prompter */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center font-mono text-2xl sm:text-4xl select-none min-h-[100px] flex items-center justify-center flex-wrap gap-y-2">
                {activeItem.text.split('').map((char, index) => {
                  const isTyped = index < charIndexInItem;
                  const isCurrent = index === charIndexInItem;
                  const isError = isCurrent && hasMistakeInCurrentChar;

                  if (char === ' ') {
                    let spaceClass = 'bg-slate-900 text-slate-500 border border-dashed border-slate-700';
                    if (isTyped) {
                      spaceClass = 'bg-emerald-950 text-emerald-400 border border-emerald-600 font-bold';
                    } else if (isError) {
                      spaceClass = 'bg-rose-950 text-rose-300 border border-rose-500 font-black';
                    } else if (isCurrent) {
                      spaceClass = 'bg-[#42c998] text-slate-950 border border-[#2eb986] font-black shadow-md';
                    }

                    return (
                      <span
                        key={index}
                        className={`inline-flex items-center justify-center min-w-[2.2em] sm:min-w-[2.8em] h-[1.3em] mx-1.5 sm:mx-2 px-2 py-0.5 rounded-lg text-xs sm:text-base font-sans ${spaceClass}`}
                        title="Space"
                      >
                        ␣
                      </span>
                    );
                  }

                  let charClass = 'text-slate-600 font-normal bg-transparent';
                  if (isTyped) {
                    charClass = 'text-emerald-400 font-bold bg-transparent';
                  } else if (isError) {
                    charClass = 'text-rose-300 bg-rose-950/80 font-black border border-rose-500';
                  } else if (isCurrent) {
                    charClass = 'bg-[#42c998] text-slate-950 font-black shadow-md';
                  }

                  return (
                    <span
                      key={index}
                      className={`inline-flex items-center justify-center min-w-[1.2ch] h-[1.3em] mx-[1px] px-1 py-0.5 rounded-md ${charClass}`}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>

              {/* Context Description Footnote */}
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>{activeItem.description}</span>
                <span className="font-mono text-cyan-400">
                  Ký tự tiếp theo: <strong className="text-white text-sm bg-slate-800 px-2 py-0.5 rounded">{activeItem.text[charIndexInItem] === ' ' ? 'Space' : activeItem.text[charIndexInItem]}</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STATE 4: RACE FINISHED / PODIUM ================= */}
        {gameState === 'finished' && (
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            {/* Trophy & Rank Badge */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-600 flex items-center justify-center shadow-xl shadow-orange-500/30 text-4xl">
                {playerRank === 1 ? '🥇' : playerRank === 2 ? '🥈' : playerRank === 3 ? '🥉' : '🏁'}
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {playerRank === 1 ? 'XUẤT SẮC VỀ ĐÍCH HẠNG 1!' : `HOÀN THÀNH HẠNG #${playerRank}`}
                </h2>
                <p className="text-sm text-slate-400">
                  {playerRank === 1
                    ? 'Bạn đã đánh bại toàn bộ đối thủ AI với tốc độ nhập liệu siêu phàm!'
                    : 'Kỹ năng nhập liệu rất tốt! Hãy tiếp tục luyện tập để chinh phục Hạng 1 Vàng.'}
                </p>
              </div>
            </div>

            {/* Performance Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Tốc Độ</div>
                <div className="text-2xl font-black text-cyan-400">{finalWpm} <span className="text-xs font-normal">WPM</span></div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Độ Chính Xác</div>
                <div className="text-2xl font-black text-emerald-400">{finalAccuracy}%</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Thời Gian</div>
                <div className="text-2xl font-black text-amber-400">{totalElapsedSec}s</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Max Combo</div>
                <div className="text-2xl font-black text-purple-400">x{maxCombo}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleStartRace}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Đua Lại Ngay</span>
              </button>

              <button
                onClick={() => setGameState('lobby')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Đổi Chủ Đề Dữ Liệu</span>
              </button>

              <button
                onClick={() => {
                  onFinish({
                    lessonId: lesson?.id || 9901,
                    stars: playerRank === 1 ? 5 : playerRank === 2 ? 4 : 3,
                    wpm: finalWpm,
                    rawWpm: finalWpm,
                    accuracy: finalAccuracy,
                    timeSeconds: totalElapsedSec,
                    errorCount: errorsCount,
                    wrongKeys: {},
                    completedAt: new Date().toISOString(),
                  });
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Lưu & Trở Về</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Footer Tip */}
      <footer className="relative z-10 border-t border-slate-800/60 bg-slate-900/60 px-6 py-3 text-center text-xs text-slate-500">
        Mẹo dân văn phòng: Duy trì nhịp gõ đều đặn với cụm phím số & ký tự đặc biệt sẽ tích lũy Nitro bứt phá ngoạn mục!
      </footer>
    </div>
  );
};
