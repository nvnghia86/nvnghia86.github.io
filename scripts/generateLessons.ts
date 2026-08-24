import fs from 'fs';
import path from 'path';

interface RawUnit {
  id: number;
  name: string;
  start: number;
  end: number;
  lessonCount: number;
  color: string;
  icon: string;
  subtitle: string;
  description: string;
}

const UNITS_META: RawUnit[] = [
  { id: 1, name: "Hàng cơ sở", start: 1, end: 23, lessonCount: 23, color: "#0284c7", icon: "Keyboard", subtitle: "F, J, D, K, S, L, A, ;", description: "Làm quen với các phím cơ sở và tư thế đặt 10 ngón chuẩn." },
  { id: 2, name: "Hàng trên", start: 24, end: 51, lessonCount: 28, color: "#16a34a", icon: "ArrowUpCircle", subtitle: "R, U, E, I, W, O, Q, P, T, Y", description: "Vươn ngón tay lên hàng phím trên để gõ các nguyên âm và phụ âm." },
  { id: 3, name: "Hàng dưới", start: 52, end: 88, lessonCount: 37, color: "#d97706", icon: "ArrowDownCircle", subtitle: "V, M, C, ,, X, ., Z, /, B, N", description: "Di chuyển ngón tay xuống hàng dưới để mở rộng bảng chữ cái." },
  { id: 4, name: "Cơ bản 1", start: 89, end: 126, lessonCount: 38, color: "#2563eb", icon: "BookOpen", subtitle: "Từ ngữ & câu cơ bản", description: "Luyện tập ghép từ và câu tiếng Việt cơ bản với nhịp gõ chuẩn." },
  { id: 5, name: "Từ dễ nhầm 1", start: 127, end: 137, lessonCount: 11, color: "#7c3aed", icon: "AlertCircle", subtitle: "Phân biệt cặp phím dễ nhầm", description: "Tập trung rèn luyện phản xạ ngón tay với các phím đối xứng." },
  { id: 6, name: "Phím Shift", start: 138, end: 191, lessonCount: 54, color: "#9333ea", icon: "ArrowBigUp", subtitle: "Phím Shift trái & phải, chữ hoa", description: "Thành thạo phối hợp hai tay khi dùng phím Shift để gõ chữ in hoa." },
  { id: 7, name: "Cụm từ phổ biến 1", start: 192, end: 202, lessonCount: 11, color: "#0891b2", icon: "Zap", subtitle: "Cụm từ thường gặp cấp 1", description: "Rèn luyện tốc độ với các cụm từ phổ biến trong giao tiếp hàng ngày." },
  { id: 8, name: "Cơ bản 2", start: 203, end: 233, lessonCount: 31, color: "#4f46e5", icon: "BookOpen", subtitle: "Nâng cao độ chuẩn xác", description: "Tăng cường độ chính xác và giảm thiểu số lỗi gõ nhầm." },
  { id: 9, name: "Từ dễ nhầm 2", start: 234, end: 244, lessonCount: 11, color: "#a855f7", icon: "AlertCircle", subtitle: "Tập trung khắc phục lỗi phím", description: "Rèn luyện các vị trí phím ngón út và ngón áp út." },
  { id: 10, name: "Chữ số", start: 245, end: 274, lessonCount: 30, color: "#ea580c", icon: "Hash", subtitle: "Hàng phím số 1 - 0", description: "Luyện ngón vươn lên hàng phím số trên cùng mà không cần nhìn bàn phím." },
  { id: 11, name: "Cụm từ phổ biến 2", start: 275, end: 285, lessonCount: 11, color: "#059669", icon: "Zap", subtitle: "Cụm từ thường gặp cấp 2", description: "Tăng phản xạ gõ từ ngữ tiếng Việt thông dụng." },
  { id: 12, name: "Cơ bản 3", start: 286, end: 316, lessonCount: 31, color: "#0284c7", icon: "BookOpen", subtitle: "Tạo nhịp gõ đều đặn", description: "Giữ nhịp điệu gõ ổn định, mượt mà và tự nhiên." },
  { id: 13, name: "Ký hiệu", start: 317, end: 346, lessonCount: 30, color: "#0d9488", icon: "Code2", subtitle: "Ký hiệu toán học & câu", description: "Luyện gõ các dấu câu, dấu ngoặc và ký hiệu văn bản." },
  { id: 14, name: "Cụm từ phổ biến 3", start: 347, end: 357, lessonCount: 11, color: "#10b981", icon: "Zap", subtitle: "Cụm từ thường gặp cấp 3", description: "Gia tăng tốc độ gõ cụm từ dài và phức tạp." },
  { id: 15, name: "Nâng cao 1", start: 358, end: 388, lessonCount: 31, color: "#f59e0b", icon: "Flame", subtitle: "Luyện tập nâng cao phần 1", description: "Thử thách gõ liên tục với độ dài văn bản tăng dần." },
  { id: 16, name: "Ký hiệu nâng cao", start: 389, end: 418, lessonCount: 30, color: "#6366f1", icon: "Code2", subtitle: "Ký hiệu lập trình & soạn thảo", description: "Luyện các ký hiệu chuyên biệt như @, #, $, %, ^, &, *, +, =." },
  { id: 17, name: "Từ dễ nhầm 3", start: 419, end: 429, lessonCount: 11, color: "#8b5cf6", icon: "AlertCircle", subtitle: "Khắc phục triệt để lỗi phím", description: "Tổng hợp các bài luyện ngón tinh gọn cho phản xạ tối đa." },
  { id: 18, name: "Nâng cao 2", start: 430, end: 460, lessonCount: 31, color: "#ec4899", icon: "Flame", subtitle: "Luyện tập nâng cao phần 2", description: "Rèn luyện khả năng ghi nhớ ngón tay tự động không cần suy nghĩ." },
  { id: 19, name: "Nâng cao 3", start: 461, end: 491, lessonCount: 31, color: "#f43f5e", icon: "Flame", subtitle: "Luyện tập nâng cao phần 3", description: "Tối ưu hóa thời gian nghỉ giữa các phím để đạt tốc độ cao." },
  { id: 20, name: "Nâng cao 4", start: 492, end: 524, lessonCount: 33, color: "#e11d48", icon: "Flame", subtitle: "Luyện tập nâng cao phần 4", description: "Thực hành gõ trôi chảy các đoạn văn bản dài." },
  { id: 21, name: "Nâng cao 5", start: 525, end: 557, lessonCount: 33, color: "#d946ef", icon: "Flame", subtitle: "Luyện tập nâng cao phần 5", description: "Luyện tập sức bền ngón tay và khả năng tập trung cao độ." },
  { id: 22, name: "Nâng cao 6", start: 558, end: 590, lessonCount: 33, color: "#8b5cf6", icon: "Flame", subtitle: "Luyện tập nâng cao phần 6", description: "Tập phản xạ gõ nhanh các cấu trúc câu đa dạng." },
  { id: 23, name: "Nâng cao 7", start: 591, end: 621, lessonCount: 31, color: "#3b82f6", icon: "Flame", subtitle: "Luyện tập nâng cao phần 7", description: "Đẩy giới hạn tốc độ vượt ngưỡng 40+ WPM." },
  { id: 24, name: "Nâng cao 8", start: 622, end: 652, lessonCount: 31, color: "#06b6d4", icon: "Flame", subtitle: "Luyện tập nâng cao phần 8", description: "Chuẩn bị cho các bài thi gõ văn phòng và chứng chỉ." },
  { id: 25, name: "Nâng cao 9", start: 653, end: 685, lessonCount: 33, color: "#14b8a6", icon: "Flame", subtitle: "Luyện tập nâng cao phần 9", description: "Hoàn thiện kỹ năng 10 ngón với độ chính xác tuyệt đối." },
  { id: 26, name: "Gõ tiếng Việt", start: 686, end: 710, lessonCount: 25, color: "#059669", icon: "Sparkles", subtitle: "ă, â, ê, ô, ơ, ư, đ & Dấu Telex", description: "Quy tắc gõ nguyên âm có dấu và 5 dấu thanh tiếng Việt Telex chuẩn." }
];

// Content map for lessons
const lessonsData: Array<{ id: number; number: number; unit: string; title: string; focus: string; text: string }> = [
  // 1-23: Hàng cơ sở
  { id: 1, number: 1, unit: "Hàng cơ sở", title: "Bài 1", focus: "Hàng cơ sở · Bài 1", text: "f j f j" },
  { id: 2, number: 2, unit: "Hàng cơ sở", title: "Bài 2", focus: "Hàng cơ sở · Bài 2", text: "d k d k" },
  { id: 3, number: 3, unit: "Hàng cơ sở", title: "Bài 3", focus: "Hàng cơ sở · Bài 3", text: "s l s l" },
  { id: 4, number: 4, unit: "Hàng cơ sở", title: "Bài 4", focus: "Hàng cơ sở · Bài 4", text: "a ; a ;" },
  { id: 5, number: 5, unit: "Hàng cơ sở", title: "Bài 5", focus: "Hàng cơ sở · Bài 5", text: "fj dk sl a;" },
  { id: 6, number: 6, unit: "Hàng cơ sở", title: "Bài 6", focus: "Hàng cơ sở · Bài 6", text: "fjd ksl; fjdk" },
  { id: 7, number: 7, unit: "Hàng cơ sở", title: "Bài 7", focus: "Hàng cơ sở · Bài 7", text: "asdf jkl;" },
  { id: 8, number: 8, unit: "Hàng cơ sở", title: "Bài 8", focus: "Hàng cơ sở · Bài 8", text: "ff jj dd kk" },
  { id: 9, number: 9, unit: "Hàng cơ sở", title: "Bài 9", focus: "Hàng cơ sở · Bài 9", text: "aa ss ll ;;" },
  { id: 10, number: 10, unit: "Hàng cơ sở", title: "Bài 10", focus: "Hàng cơ sở · Bài 10", text: "fjdk sl;a" },
  { id: 11, number: 11, unit: "Hàng cơ sở", title: "Bài 11", focus: "Hàng cơ sở · Bài 11", text: "asdf jkl; asdf" },
  { id: 12, number: 12, unit: "Hàng cơ sở", title: "Bài 12", focus: "Hàng cơ sở · Bài 12", text: "j k l ; j k l ;" },
  { id: 13, number: 13, unit: "Hàng cơ sở", title: "Bài 13", focus: "Hàng cơ sở · Bài 13", text: "f j f j" },
  { id: 14, number: 14, unit: "Hàng cơ sở", title: "Bài 14", focus: "Hàng cơ sở · Bài 14", text: "d k d k" },
  { id: 15, number: 15, unit: "Hàng cơ sở", title: "Bài 15", focus: "Hàng cơ sở · Bài 15", text: "s l s l" },
  { id: 16, number: 16, unit: "Hàng cơ sở", title: "Bài 16", focus: "Hàng cơ sở · Bài 16", text: "a ; a ;" },
  { id: 17, number: 17, unit: "Hàng cơ sở", title: "Bài 17", focus: "Hàng cơ sở · Bài 17", text: "fj dk sl a;" },
  { id: 18, number: 18, unit: "Hàng cơ sở", title: "Bài 18", focus: "Hàng cơ sở · Bài 18", text: "fjd ksl; fjdk" },
  { id: 19, number: 19, unit: "Hàng cơ sở", title: "Bài 19", focus: "Hàng cơ sở · Bài 19", text: "asdf jkl;" },
  { id: 20, number: 20, unit: "Hàng cơ sở", title: "Bài 20", focus: "Hàng cơ sở · Bài 20", text: "ff jj dd kk" },
  { id: 21, number: 21, unit: "Hàng cơ sở", title: "Bài 21", focus: "Hàng cơ sở · Bài 21", text: "aa ss ll ;;" },
  { id: 22, number: 22, unit: "Hàng cơ sở", title: "Bài 22", focus: "Hàng cơ sở · Bài 22", text: "fjdk sl;a" },
  { id: 23, number: 23, unit: "Hàng cơ sở", title: "Bài 23", focus: "Hàng cơ sở · Bài 23", text: "asdf jkl; asdf" },

  // 24-51: Hàng trên
  { id: 24, number: 24, unit: "Hàng trên", title: "Bài 24", focus: "Hàng trên · Bài 24", text: "r u r u" },
  { id: 25, number: 25, unit: "Hàng trên", title: "Bài 25", focus: "Hàng trên · Bài 25", text: "e i e i" },
  { id: 26, number: 26, unit: "Hàng trên", title: "Bài 26", focus: "Hàng trên · Bài 26", text: "w o w o" },
  { id: 27, number: 27, unit: "Hàng trên", title: "Bài 27", focus: "Hàng trên · Bài 27", text: "q p q p" },
  { id: 28, number: 28, unit: "Hàng trên", title: "Bài 28", focus: "Hàng trên · Bài 28", text: "t y t y" },
  { id: 29, number: 29, unit: "Hàng trên", title: "Bài 29", focus: "Hàng trên · Bài 29", text: "ru ei wo qp" },
  { id: 30, number: 30, unit: "Hàng trên", title: "Bài 30", focus: "Hàng trên · Bài 30", text: "ruei tyop" },
  { id: 31, number: 31, unit: "Hàng trên", title: "Bài 31", focus: "Hàng trên · Bài 31", text: "qwerty uiop" },
  { id: 32, number: 32, unit: "Hàng trên", title: "Bài 32", focus: "Hàng trên · Bài 32", text: "r u r u" },
  { id: 33, number: 33, unit: "Hàng trên", title: "Bài 33", focus: "Hàng trên · Bài 33", text: "e i e i" },
  { id: 34, number: 34, unit: "Hàng trên", title: "Bài 34", focus: "Hàng trên · Bài 34", text: "w o w o" },
  { id: 35, number: 35, unit: "Hàng trên", title: "Bài 35", focus: "Hàng trên · Bài 35", text: "q p q p" },
  { id: 36, number: 36, unit: "Hàng trên", title: "Bài 36", focus: "Hàng trên · Bài 36", text: "t y t y" },
  { id: 37, number: 37, unit: "Hàng trên", title: "Bài 37", focus: "Hàng trên · Bài 37", text: "ru ei wo qp" },
  { id: 38, number: 38, unit: "Hàng trên", title: "Bài 38", focus: "Hàng trên · Bài 38", text: "ruei tyop" },
  { id: 39, number: 39, unit: "Hàng trên", title: "Bài 39", focus: "Hàng trên · Bài 39", text: "qwerty uiop" },
  { id: 40, number: 40, unit: "Hàng trên", title: "Bài 40", focus: "Hàng trên · Bài 40", text: "r u r u" },
  { id: 41, number: 41, unit: "Hàng trên", title: "Bài 41", focus: "Hàng trên · Bài 41", text: "e i e i" },
  { id: 42, number: 42, unit: "Hàng trên", title: "Bài 42", focus: "Hàng trên · Bài 42", text: "w o w o" },
  { id: 43, number: 43, unit: "Hàng trên", title: "Bài 43", focus: "Hàng trên · Bài 43", text: "q p q p" },
  { id: 44, number: 44, unit: "Hàng trên", title: "Bài 44", focus: "Hàng trên · Bài 44", text: "t y t y" },
  { id: 45, number: 45, unit: "Hàng trên", title: "Bài 45", focus: "Hàng trên · Bài 45", text: "ru ei wo qp" },
  { id: 46, number: 46, unit: "Hàng trên", title: "Bài 46", focus: "Hàng trên · Bài 46", text: "ruei tyop" },
  { id: 47, number: 47, unit: "Hàng trên", title: "Bài 47", focus: "Hàng trên · Bài 47", text: "qwerty uiop" },
  { id: 48, number: 48, unit: "Hàng trên", title: "Bài 48", focus: "Hàng trên · Bài 48", text: "r u r u" },
  { id: 49, number: 49, unit: "Hàng trên", title: "Bài 49", focus: "Hàng trên · Bài 49", text: "e i e i" },
  { id: 50, number: 50, unit: "Hàng trên", title: "Bài 50", focus: "Hàng trên · Bài 50", text: "w o w o" },
  { id: 51, number: 51, unit: "Hàng trên", title: "Bài 51", focus: "Hàng trên · Bài 51", text: "q p q p" },

  // 52-88: Hàng dưới
  { id: 52, number: 52, unit: "Hàng dưới", title: "Bài 52", focus: "Hàng dưới · Bài 52", text: "v m v m" },
  { id: 53, number: 53, unit: "Hàng dưới", title: "Bài 53", focus: "Hàng dưới · Bài 53", text: "c , c ," },
  { id: 54, number: 54, unit: "Hàng dưới", title: "Bài 54", focus: "Hàng dưới · Bài 54", text: "x . x ." },
  { id: 55, number: 55, unit: "Hàng dưới", title: "Bài 55", focus: "Hàng dưới · Bài 55", text: "z / z /" },
  { id: 56, number: 56, unit: "Hàng dưới", title: "Bài 56", focus: "Hàng dưới · Bài 56", text: "b n b n" },
  { id: 57, number: 57, unit: "Hàng dưới", title: "Bài 57", focus: "Hàng dưới · Bài 57", text: "v m c , x ." },
  { id: 58, number: 58, unit: "Hàng dưới", title: "Bài 58", focus: "Hàng dưới · Bài 58", text: "z x c v b n m" },
  { id: 59, number: 59, unit: "Hàng dưới", title: "Bài 59", focus: "Hàng dưới · Bài 59", text: "v m v m" },
  { id: 60, number: 60, unit: "Hàng dưới", title: "Bài 60", focus: "Hàng dưới · Bài 60", text: "c , c ," },
  { id: 61, number: 61, unit: "Hàng dưới", title: "Bài 61", focus: "Hàng dưới · Bài 61", text: "x . x ." },
  { id: 62, number: 62, unit: "Hàng dưới", title: "Bài 62", focus: "Hàng dưới · Bài 62", text: "z / z /" },
  { id: 63, number: 63, unit: "Hàng dưới", title: "Bài 63", focus: "Hàng dưới · Bài 63", text: "b n b n" },
  { id: 64, number: 64, unit: "Hàng dưới", title: "Bài 64", focus: "Hàng dưới · Bài 64", text: "v m c , x ." },
  { id: 65, number: 65, unit: "Hàng dưới", title: "Bài 65", focus: "Hàng dưới · Bài 65", text: "z x c v b n m" },
  { id: 66, number: 66, unit: "Hàng dưới", title: "Bài 66", focus: "Hàng dưới · Bài 66", text: "v m v m" },
  { id: 67, number: 67, unit: "Hàng dưới", title: "Bài 67", focus: "Hàng dưới · Bài 67", text: "c , c ," },
  { id: 68, number: 68, unit: "Hàng dưới", title: "Bài 68", focus: "Hàng dưới · Bài 68", text: "x . x ." },
  { id: 69, number: 69, unit: "Hàng dưới", title: "Bài 69", focus: "Hàng dưới · Bài 69", text: "z / z /" },
  { id: 70, number: 70, unit: "Hàng dưới", title: "Bài 70", focus: "Hàng dưới · Bài 70", text: "b n b n" },
  { id: 71, number: 71, unit: "Hàng dưới", title: "Bài 71", focus: "Hàng dưới · Bài 71", text: "v m c , x ." },
  { id: 72, number: 72, unit: "Hàng dưới", title: "Bài 72", focus: "Hàng dưới · Bài 72", text: "z x c v b n m" },
  { id: 73, number: 73, unit: "Hàng dưới", title: "Bài 73", focus: "Hàng dưới · Bài 73", text: "v m v m" },
  { id: 74, number: 74, unit: "Hàng dưới", title: "Bài 74", focus: "Hàng dưới · Bài 74", text: "c , c ," },
  { id: 75, number: 75, unit: "Hàng dưới", title: "Bài 75", focus: "Hàng dưới · Bài 75", text: "x . x ." },
  { id: 76, number: 76, unit: "Hàng dưới", title: "Bài 76", focus: "Hàng dưới · Bài 76", text: "z / z /" },
  { id: 77, number: 77, unit: "Hàng dưới", title: "Bài 77", focus: "Hàng dưới · Bài 77", text: "b n b n" },
  { id: 78, number: 78, unit: "Hàng dưới", title: "Bài 78", focus: "Hàng dưới · Bài 78", text: "v m c , x ." },
  { id: 79, number: 79, unit: "Hàng dưới", title: "Bài 79", focus: "Hàng dưới · Bài 79", text: "z x c v b n m" },
  { id: 80, number: 80, unit: "Hàng dưới", title: "Bài 80", focus: "Hàng dưới · Bài 80", text: "v m v m" },
  { id: 81, number: 81, unit: "Hàng dưới", title: "Bài 81", focus: "Hàng dưới · Bài 81", text: "c , c ," },
  { id: 82, number: 82, unit: "Hàng dưới", title: "Bài 82", focus: "Hàng dưới · Bài 82", text: "x . x ." },
  { id: 83, number: 83, unit: "Hàng dưới", title: "Bài 83", focus: "Hàng dưới · Bài 83", text: "z / z /" },
  { id: 84, number: 84, unit: "Hàng dưới", title: "Bài 84", focus: "Hàng dưới · Bài 84", text: "b n b n" },
  { id: 85, number: 85, unit: "Hàng dưới", title: "Bài 85", focus: "Hàng dưới · Bài 85", text: "v m c , x ." },
  { id: 86, number: 86, unit: "Hàng dưới", title: "Bài 86", focus: "Hàng dưới · Bài 86", text: "z x c v b n m" },
  { id: 87, number: 87, unit: "Hàng dưới", title: "Bài 87", focus: "Hàng dưới · Bài 87", text: "v m v m" },
  { id: 88, number: 88, unit: "Hàng dưới", title: "Bài 88", focus: "Hàng dưới · Bài 88", text: "c , c ," }
];

// Generate repeat patterns for Basic/Advanced and specific phrases
const commonPhrases = [
  "giữ tay trên hàng cơ sở",
  "gõ chậm và ưu tiên chính xác",
  "kiên trì mỗi ngày",
  "luyện gõ đúng từng phím"
];

// Fill 89 to 126 (Cơ bản 1)
for (let i = 89; i <= 126; i++) {
  const text = commonPhrases[(i - 89) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Cơ bản 1",
    title: `Bài ${i}`,
    focus: `Cơ bản 1 · Bài ${i}`,
    text
  });
}

// Fill 127 to 137 (Từ dễ nhầm 1)
for (let i = 127; i <= 137; i++) {
  const text = commonPhrases[(i - 127 + 2) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Từ dễ nhầm 1",
    title: `Bài ${i}`,
    focus: `Từ dễ nhầm 1 · Bài ${i}`,
    text
  });
}

// Shift patterns (138 to 191)
const shiftPatterns = [
  "f j f j r u r u",
  "d k d k e i e i",
  "s l s l w o w o",
  "a ; a ; q p q p",
  "fj dk sl a; t y t y",
  "fjd ksl; fjdk ru ei wo qp",
  "asdf jkl; ruei tyop",
  "ff jj dd kk qwerty uiop",
  "aa ss ll ;; r u r u",
  "fjdk sl;a e i e i",
  "asdf jkl; asdf w o w o",
  "j k l ; j k l ; q p q p",
  "f j f j t y t y",
  "d k d k ru ei wo qp",
  "s l s l ruei tyop",
  "a ; a ; qwerty uiop",
  "fj dk sl a; r u r u",
  "fjd ksl; fjdk e i e i",
  "asdf jkl; w o w o",
  "ff jj dd kk q p q p",
  "aa ss ll ;; t y t y",
  "fjdk sl;a ru ei wo qp",
  "asdf jkl; asdf ruei tyop",
  "j k l ; j k l ; qwerty uiop"
];

for (let i = 138; i <= 191; i++) {
  const text = shiftPatterns[(i - 138) % shiftPatterns.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Phím Shift",
    title: `Bài ${i}`,
    focus: `Phím Shift · Bài ${i}`,
    text
  });
}

// Fill 192 to 202 (Cụm từ phổ biến 1)
for (let i = 192; i <= 202; i++) {
  const text = commonPhrases[(i - 192 + 3) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Cụm từ phổ biến 1",
    title: `Bài ${i}`,
    focus: `Cụm từ phổ biến 1 · Bài ${i}`,
    text
  });
}

// Fill 203 to 233 (Cơ bản 2)
for (let i = 203; i <= 233; i++) {
  const text = commonPhrases[(i - 203 + 2) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Cơ bản 2",
    title: `Bài ${i}`,
    focus: `Cơ bản 2 · Bài ${i}`,
    text
  });
}

// Fill 234 to 244 (Từ dễ nhầm 2)
for (let i = 234; i <= 244; i++) {
  const text = commonPhrases[(i - 234 + 1) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Từ dễ nhầm 2",
    title: `Bài ${i}`,
    focus: `Từ dễ nhầm 2 · Bài ${i}`,
    text
  });
}

// Fill 245 to 274 (Chữ số)
const numberPatterns = [
  "5 8 5 8", "6 9 6 9", "7 0 7 0", "8 1 8 1", "9 2 9 2", "0 3 0 3",
  "1 4 1 4", "2 5 2 5", "3 6 3 6", "4 7 4 7"
];
for (let i = 245; i <= 274; i++) {
  const text = numberPatterns[(i - 245) % numberPatterns.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Chữ số",
    title: `Bài ${i}`,
    focus: `Chữ số · Bài ${i}`,
    text
  });
}

// Fill 275 to 285 (Cụm từ phổ biến 2)
for (let i = 275; i <= 285; i++) {
  const text = commonPhrases[(i - 275 + 2) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Cụm từ phổ biến 2",
    title: `Bài ${i}`,
    focus: `Cụm từ phổ biến 2 · Bài ${i}`,
    text
  });
}

// Fill 286 to 316 (Cơ bản 3)
for (let i = 286; i <= 316; i++) {
  const text = commonPhrases[(i - 286 + 1) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Cơ bản 3",
    title: `Bài ${i}`,
    focus: `Cơ bản 3 · Bài ${i}`,
    text
  });
}

// Fill 317 to 346 (Ký hiệu)
for (let i = 317; i <= 346; i++) {
  const text = commonPhrases[(i - 317) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Ký hiệu",
    title: `Bài ${i}`,
    focus: `Ký hiệu · Bài ${i}`,
    text
  });
}

// Fill 347 to 357 (Cụm từ phổ biến 3)
for (let i = 347; i <= 357; i++) {
  const text = commonPhrases[(i - 347 + 2) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Cụm từ phổ biến 3",
    title: `Bài ${i}`,
    focus: `Cụm từ phổ biến 3 · Bài ${i}`,
    text
  });
}

// Fill 358 to 388 (Nâng cao 1)
for (let i = 358; i <= 388; i++) {
  const text = commonPhrases[(i - 358 + 1) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Nâng cao 1",
    title: `Bài ${i}`,
    focus: `Nâng cao 1 · Bài ${i}`,
    text
  });
}

// Fill 389 to 418 (Ký hiệu nâng cao)
for (let i = 389; i <= 418; i++) {
  const text = commonPhrases[(i - 389) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Ký hiệu nâng cao",
    title: `Bài ${i}`,
    focus: `Ký hiệu nâng cao · Bài ${i}`,
    text
  });
}

// Fill 419 to 429 (Từ dễ nhầm 3)
for (let i = 419; i <= 429; i++) {
  const text = commonPhrases[(i - 419 + 2) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Từ dễ nhầm 3",
    title: `Bài ${i}`,
    focus: `Từ dễ nhầm 3 · Bài ${i}`,
    text
  });
}

// Fill 430 to 460 (Nâng cao 2)
for (let i = 430; i <= 460; i++) {
  const text = commonPhrases[(i - 430 + 1) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Nâng cao 2",
    title: `Bài ${i}`,
    focus: `Nâng cao 2 · Bài ${i}`,
    text
  });
}

// Fill 461 to 491 (Nâng cao 3)
for (let i = 461; i <= 491; i++) {
  const text = commonPhrases[(i - 461) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Nâng cao 3",
    title: `Bài ${i}`,
    focus: `Nâng cao 3 · Bài ${i}`,
    text
  });
}

// Fill 492 to 524 (Nâng cao 4)
for (let i = 492; i <= 524; i++) {
  const text = commonPhrases[(i - 492 + 3) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Nâng cao 4",
    title: `Bài ${i}`,
    focus: `Nâng cao 4 · Bài ${i}`,
    text
  });
}

// Fill 525 to 557 (Nâng cao 5)
for (let i = 525; i <= 557; i++) {
  const text = commonPhrases[(i - 525) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Nâng cao 5",
    title: `Bài ${i}`,
    focus: `Nâng cao 5 · Bài ${i}`,
    text
  });
}

// Fill 558 to 590 (Nâng cao 6)
for (let i = 558; i <= 590; i++) {
  const text = commonPhrases[(i - 558 + 1) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Nâng cao 6",
    title: `Bài ${i}`,
    focus: `Nâng cao 6 · Bài ${i}`,
    text
  });
}

// Fill 591 to 621 (Nâng cao 7)
for (let i = 591; i <= 621; i++) {
  const text = commonPhrases[(i - 591 + 2) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Nâng cao 7",
    title: `Bài ${i}`,
    focus: `Nâng cao 7 · Bài ${i}`,
    text
  });
}

// Fill 622 to 652 (Nâng cao 8)
for (let i = 622; i <= 652; i++) {
  const text = commonPhrases[(i - 622 + 1) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Nâng cao 8",
    title: `Bài ${i}`,
    focus: `Nâng cao 8 · Bài ${i}`,
    text
  });
}

// Fill 653 to 685 (Nâng cao 9)
for (let i = 653; i <= 685; i++) {
  const text = commonPhrases[(i - 653) % commonPhrases.length];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Nâng cao 9",
    title: `Bài ${i}`,
    focus: `Nâng cao 9 · Bài ${i}`,
    text
  });
}

// Vietnamese Telex lessons (686 to 710)
const viPatterns = [
  "ă â", "ê ô", "ơ ư", "đ Đ", "á à ả ã ạ", "é è ẻ ẽ ẹ", "ó ò ỏ õ ọ",
  "ớ ờ ở ỡ ợ", "ứ ừ ử ữ ự", "tiếng Việt", "gõ đúng trước", "gõ nhanh sau",
  "ă â", "ê ô", "ơ ư", "đ Đ", "á à ả ã ạ", "é è ẻ ẽ ẹ", "ó ò ỏ õ ọ",
  "ớ ờ ở ỡ ợ", "ứ ừ ử ữ ự", "tiếng Việt", "gõ đúng trước", "gõ nhanh sau", "ă â"
];

for (let i = 686; i <= 710; i++) {
  const text = viPatterns[i - 686];
  lessonsData.push({
    id: i,
    number: i,
    unit: "Gõ tiếng Việt",
    title: `Bài ${i}`,
    focus: `Gõ tiếng Việt · Bài ${i}`,
    text
  });
}

// Sort by lesson ID
lessonsData.sort((a, b) => a.id - b.id);

console.log(`Generated ${lessonsData.length} lessons.`);

// Create Units with lesson IDs
const units = UNITS_META.map(u => {
  const unitLessons = lessonsData.filter(l => l.unit === u.name);
  return {
    id: u.id,
    title: `Unit ${u.id}: ${u.name}`,
    subtitle: u.subtitle,
    color: u.color,
    icon: u.icon,
    description: u.description,
    lessonIds: unitLessons.map(l => l.id)
  };
});

// Map unit id lookup
const unitNameToId: Record<string, number> = {};
UNITS_META.forEach(u => { unitNameToId[u.name] = u.id; });

// Format lessons
const formattedLessons = lessonsData.map(l => {
  const unitId = unitNameToId[l.unit] || 1;
  const unitMeta = UNITS_META.find(u => u.id === unitId);
  const targetKeys = Array.from(new Set(l.text.replace(/\s+/g, '').split(''))).slice(0, 8);
  
  // Assign target WPM based on unit progression
  let targetWpm = 15;
  if (unitId >= 2 && unitId <= 3) targetWpm = 20;
  else if (unitId >= 4 && unitId <= 7) targetWpm = 25;
  else if (unitId >= 8 && unitId <= 14) targetWpm = 30;
  else if (unitId >= 15 && unitId <= 20) targetWpm = 35;
  else if (unitId >= 21 && unitId <= 25) targetWpm = 45;
  else if (unitId === 26) targetWpm = 30;

  // Assign interactive type (some are mini games / tests / practice)
  let type: 'lesson' | 'game' | 'test' | 'story' = 'lesson';
  let gameType: any = undefined;

  if (l.id === 23) {
    type = 'test';
  } else if (l.id === 51) {
    type = 'game';
    gameType = 'falling_words';
  } else if (l.id === 88) {
    type = 'game';
    gameType = 'balloons';
  } else if (l.id === 191) {
    type = 'game';
    gameType = 'racer';
  } else if (l.id === 274) {
    type = 'game';
    gameType = 'data_entry_speed_run';
  } else if (l.id === 710) {
    type = 'game';
    gameType = 'monster_battle';
  } else if (l.id % 25 === 0) {
    type = 'test';
  }

  return {
    id: l.id,
    unitId: unitId,
    unitTitle: `Unit ${unitId}: ${l.unit}`,
    unitSubtitle: unitMeta?.subtitle || '',
    title: `Bài ${l.id}: ${l.focus}`,
    type: type,
    description: `Thực hành gõ 10 ngón: ${l.text}`,
    targetKeys: targetKeys.length > 0 ? targetKeys : ['f', 'j'],
    content: [l.text],
    minAccuracy: 85,
    targetWpm: targetWpm,
    ...(gameType ? { gameType } : {})
  };
});

// Write to src/data/vietnameseCurriculum.json
fs.writeFileSync(
  path.join(process.cwd(), 'src/data/vietnameseCurriculum.json'),
  JSON.stringify({ units, lessons: formattedLessons }, null, 2),
  'utf-8'
);

console.log("Successfully wrote src/data/vietnameseCurriculum.json");
