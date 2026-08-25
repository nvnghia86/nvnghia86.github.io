import { Lesson, Unit, Badge } from '../types';
import curriculumData from './vietnameseCurriculum.json';

export const UNITS: Unit[] = curriculumData.units as Unit[];

const CONTINUOUS_TEXT_UNITS = new Set([5, 6, 7, 8, 11, 12, 13]);
const CONTINUOUS_TEXT_LESSON_IDS = new Set([69, 77]);
const VIETNAMESE_DIACRITIC_PATTERN = /[ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/u;

function makeContinuousText(lines: string[]): string {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((text, line) => {
      if (!text) return line;
      return /[.!?]$/.test(text) ? `${text} ${line}` : `${text}; ${line}`;
    }, '');
}

// Sentence-focused Vietnamese lessons are one continuous native-IME exercise.
// Key, number, punctuation and code drills retain their authored four-line rhythm.
export const LESSONS: Lesson[] = (curriculumData.lessons as Lesson[]).map((lesson) => {
  const shouldBeContinuous =
    (CONTINUOUS_TEXT_UNITS.has(lesson.unitId) || CONTINUOUS_TEXT_LESSON_IDS.has(lesson.id)) &&
    lesson.content.length > 1 &&
    VIETNAMESE_DIACRITIC_PATTERN.test(lesson.content.join(' '));

  return shouldBeContinuous
    ? { ...lesson, content: [makeContinuousText(lesson.content)] }
    : lesson;
});

export const BADGES: Badge[] = [
  {
    id: 'first_lesson',
    name: 'Bước Đầu Tiên',
    description: 'Hoàn thành bài tập gõ 10 ngón đầu tiên trong lộ trình.',
    icon: 'Sparkles',
    requirement: 'Hoàn thành Bài 1',
  },
  {
    id: 'home_starter',
    name: 'Hàng Cơ Sở Star',
    description: 'Thành thạo các phím F, J, D, K, S, L, A, ; trên hàng cơ sở.',
    icon: 'Keyboard',
    requirement: 'Đạt 3+ sao ở Bài 1',
  },
  {
    id: 'home_words_master',
    name: 'Bậc Thầy Hàng Cơ Sở',
    description: 'Chinh phục trọn vẹn toàn bộ 10 bài tập của Unit Hàng phím cơ sở.',
    icon: 'Award',
    requirement: 'Hoàn thành Bài 10',
  },
  {
    id: 'top_row_master',
    name: 'Quán Quân Hàng Trên',
    description: 'Vươn ngón thành thạo lên hàng phím trên (Q, W, E, R, T, Y, U, I, O, P).',
    icon: 'ArrowUpCircle',
    requirement: 'Hoàn thành Bài 20',
  },
  {
    id: 'bottom_row_master',
    name: 'Bậc Thầy Hàng Dưới',
    description: 'Làm chủ toàn bộ các phím hàng dưới và dấu phẩy, chấm, gạch chéo.',
    icon: 'ShieldCheck',
    requirement: 'Hoàn thành Bài 30',
  },
  {
    id: 'telex_vowels_master',
    name: 'Bậc Thầy Nguyên Âm Telex',
    description: 'Gõ thành thạo nguyên âm có dấu tiếng Việt (ă, â, ê, ô, ơ, ư, đ).',
    icon: 'Sparkles',
    requirement: 'Hoàn thành Bài 44',
  },
  {
    id: 'telex_tones_master',
    name: 'Bậc Thầy Dấu Thanh Telex',
    description: 'Làm chủ 5 dấu thanh tiếng Việt Telex: Sắc, Huyền, Hỏi, Ngã, Nặng.',
    icon: 'Crown',
    requirement: 'Hoàn thành Bài 53',
  },
  {
    id: 'shift_master',
    name: 'Phù Thủy Phím Shift',
    description: 'Thành thạo phối hợp hai tay khi gõ chữ in hoa và phím Shift.',
    icon: 'ArrowBigUp',
    requirement: 'Hoàn thành Bài 59',
  },
  {
    id: 'number_master',
    name: 'Chuyên Gia Chữ Số',
    description: 'Gõ chữ số 0-9 với tốc độ cao và độ chính xác tuyệt đối.',
    icon: 'Hash',
    requirement: 'Hoàn thành Bài 65',
  },
  {
    id: 'code_wizard',
    name: 'Chuyên Gia Ký Hiệu & Code',
    description: 'Làm chủ các ký hiệu đặc biệt, dấu ngoặc, email, URL và cú pháp lập trình.',
    icon: 'Code2',
    requirement: 'Hoàn thành Bài 77',
  },
  {
    id: 'speed_demon_40',
    name: 'Thần Tốc 40+ WPM',
    description: 'Vượt mốc tốc độ 40 từ/phút với độ chính xác cao.',
    icon: 'Flame',
    requirement: 'Đạt 40+ WPM ở bất kỳ bài tập nào',
  },
  {
    id: 'literature_master',
    name: 'Bậc Thầy Thành Ngữ & Đoạn Văn',
    description: 'Chinh phục toàn bộ các bài tập thành ngữ và ứng dụng văn bản thực tế.',
    icon: 'BookOpen',
    requirement: 'Hoàn thành Bài 89',
  },
  {
    id: 'test_30_wpm',
    name: 'Chứng Chỉ 30 WPM',
    description: 'Đạt chuẩn tốc độ gõ văn phòng 30 WPM với 5 sao.',
    icon: 'Medal',
    requirement: 'Đạt 5 sao ở bài kiểm tra',
  },
  {
    id: 'test_50_wpm',
    name: 'Chứng Chỉ 50 WPM Pro',
    description: 'Đạt chuẩn tốc độ chuyên nghiệp 50 WPM.',
    icon: 'Zap',
    requirement: 'Đạt 50+ WPM ở bài kiểm tra',
  },
  {
    id: 'grand_master_710',
    name: 'Đại Kiện Tướng 94 Bài Tiếng Việt',
    description: 'Hoàn thành xuất sắc toàn bộ 94 bài học trong lộ trình gõ 10 ngón tiếng Việt chuẩn!',
    icon: 'Trophy',
    requirement: 'Hoàn thành Bài 94',
  },
  {
    id: 'game_ninja',
    name: 'Word Ninja',
    description: 'Chiến thắng chế độ Arcade Word Ninja rơi chữ.',
    icon: 'Swords',
    requirement: 'Hoàn thành trò chơi Word Ninja',
  },
  {
    id: 'game_balloon',
    name: 'Balloon Master',
    description: 'Bắn vỡ toàn bộ các bóng bay từ vựng trong Balloon Pop.',
    icon: 'CircleDot',
    requirement: 'Hoàn thành trò chơi Balloon Pop',
  },
  {
    id: 'game_racer',
    name: 'Speedway Champion',
    description: 'Về đích hạng nhất tại giải đua Speedway Grand Prix.',
    icon: 'Car',
    requirement: 'Hoàn thành trò chơi Speedway Racer',
  },
  {
    id: 'game_monster',
    name: 'Monster Slayer',
    description: 'Đánh bại Boss quái vật tại Đấu Trường Monster PK Battle.',
    icon: 'Swords',
    requirement: 'Hoàn thành trận chiến Monster PK',
  },
  {
    id: 'game_speed_run',
    name: 'Vua Đua Xe Dữ Liệu F1',
    description: 'Chinh phục đường đua nhập liệu văn phòng Data Entry Speed Run.',
    icon: 'Flame',
    requirement: 'Hoàn thành game Đua Xe Nhập Liệu',
  },
  {
    id: 'perfectionist_100',
    name: 'Hoàn Hảo 100%',
    description: 'Gõ bài tập với độ chính xác tuyệt đối 100% không một lỗi sai.',
    icon: 'CheckCircle2',
    requirement: 'Đạt 100% chính xác ở bài bất kỳ',
  },
];
