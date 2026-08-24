import fs from 'fs';
import path from 'path';

interface RawUnitInput {
  id: string | number;
  name: string;
  start: number;
  end: number;
  lessonCount: number;
}

interface RawLessonInput {
  id: string | number;
  number: number;
  unit: string;
  title: string;
  focus: string;
  text: string;
  language?: string;
  mode?: string;
}

const inputUnits: RawUnitInput[] = [
  { id: 1, name: "1. Hàng phím cơ sở (Home Row)", start: 1, end: 10, lessonCount: 10 },
  { id: 2, name: "2. Hàng phím trên (Top Row)", start: 11, end: 20, lessonCount: 10 },
  { id: 3, name: "3. Hàng phím dưới (Bottom Row)", start: 21, end: 30, lessonCount: 10 },
  { id: 4, name: "4. Luyện tổ hợp phím chữ không dấu", start: 31, end: 35, lessonCount: 5 },
  { id: 5, name: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ)", start: 36, end: 44, lessonCount: 9 },
  { id: 6, name: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng)", start: 45, end: 53, lessonCount: 9 },
  { id: 7, name: "7. Phím Shift & Chữ in hoa", start: 54, end: 59, lessonCount: 6 },
  { id: 8, name: "8. Hàng phím số (Numbers 0 - 9)", start: 60, end: 65, lessonCount: 6 },
  { id: 9, name: "9. Ký hiệu cơ bản & Dấu câu", start: 66, end: 71, lessonCount: 6 },
  { id: 10, name: "10. Ký hiệu nâng cao & Lập trình", start: 72, end: 77, lessonCount: 6 },
  { id: 11, name: "11. Luyện phân biệt từ dễ nhầm lẫn", start: 78, end: 83, lessonCount: 6 },
  { id: 12, name: "12. Cụm từ & Thành ngữ phổ biến", start: 84, end: 89, lessonCount: 6 },
  { id: 13, name: "13. Đoạn văn thực hành nâng cao & Ứng dụng thực tế", start: 90, end: 94, lessonCount: 5 }
];

const unitMeta: Record<number, { color: string; icon: string; subtitle: string; description: string }> = {
  1: { color: "#0284c7", icon: "Keyboard", subtitle: "F, J, D, K, S, L, A, ;, G, H", description: "Luyện 10 ngón tay trên hàng phím cơ sở với các ngón định vị và tổ hợp mở rộng." },
  2: { color: "#16a34a", icon: "ArrowUpCircle", subtitle: "R, U, E, I, W, O, Q, P, T, Y", description: "Vươn ngón tay lên hàng phím trên để gõ các nguyên âm và phụ âm." },
  3: { color: "#d97706", icon: "ArrowDownCircle", subtitle: "V, M, C, ,, X, ., Z, /, B, N", description: "Hạ ngón tay xuống hàng phím dưới để hoàn thiện toàn bộ bảng chữ cái." },
  4: { color: "#2563eb", icon: "BookOpen", subtitle: "Cụm từ âm tiết mở & chuyển dòng", description: "Rèn luyện nhịp điệu gõ đều đặn và sự nhịp nhàng giữa hai bàn tay." },
  5: { color: "#059669", icon: "Sparkles", subtitle: "aa, aw, ee, oo, ow, uw, dd", description: "Thành thạo quy tắc Telex cho 7 nguyên âm có dấu mũ/móc và chữ Đ." },
  6: { color: "#10b981", icon: "Zap", subtitle: "S, F, R, X, J", description: "Quy tắc bỏ dấu thanh Telex chuẩn xác trên các nguyên âm tiếng Việt." },
  7: { color: "#9333ea", icon: "ArrowBigUp", subtitle: "Shift trái & phải, địa danh, tên riêng", description: "Thành thạo phối hợp hai tay dùng phím Shift khi viết hoa danh từ riêng." },
  8: { color: "#ea580c", icon: "Hash", subtitle: "Hàng phím số 0 - 9, năm, số điện thoại", description: "Vươn ngón tay lên hàng phím số chính xác mà không cần nhìn bàn phím." },
  9: { color: "#0d9488", icon: "Code2", subtitle: "Dấu câu, ngoặc kép, ngoặc đơn, gạch ngang", description: "Soạn thảo văn bản hoàn chỉnh với dấu câu và các ký hiệu thông dụng." },
  10: { color: "#6366f1", icon: "Code2", subtitle: "Shift số, email, URL, mã nguồn code", description: "Gõ nhanh các ký hiệu toán học, email, website và cú pháp lập trình." },
  11: { color: "#8b5cf6", icon: "AlertCircle", subtitle: "L/N, S/X, TR/CH, R/D/GI, Hỏi/Ngã", description: "Luyện tập chuyên sâu các phụ âm đầu và dấu thanh dễ nhầm lẫn." },
  12: { color: "#0284c7", icon: "BookOpen", subtitle: "Ca dao, tục ngữ & danh ngôn", description: "Gia tăng tốc độ gõ mạch lạc với các câu thành ngữ tiếng Việt kinh điển." },
  13: { color: "#f59e0b", icon: "Flame", subtitle: "Đoạn văn hoàn chỉnh, bứt phá tốc độ", description: "Ứng dụng soạn thảo văn bản thực tế trong công việc và học tập." }
};

const inputLessons: RawLessonInput[] = [
  // Unit 1
  { id: 1, number: 1, unit: "1. Hàng phím cơ sở (Home Row)", title: "Bài 1", focus: "1. Hàng phím cơ sở (Home Row) · Luyện 2 phím định vị F (trỏ trái) và J (trỏ phải)", text: "f j f j" },
  { id: 2, number: 2, unit: "1. Hàng phím cơ sở (Home Row)", title: "Bài 2", focus: "1. Hàng phím cơ sở (Home Row) · Luyện phím D (giữa trái) và K (giữa phải)", text: "d k d k" },
  { id: 3, number: 3, unit: "1. Hàng phím cơ sở (Home Row)", title: "Bài 3", focus: "1. Hàng phím cơ sở (Home Row) · Luyện phím S (áp út trái) và L (áp út phải)", text: "s l s l" },
  { id: 4, number: 4, unit: "1. Hàng phím cơ sở (Home Row)", title: "Bài 4", focus: "1. Hàng phím cơ sở (Home Row) · Luyện phím A (út trái) và dấu ; (út phải)", text: "a ; a ;" },
  { id: 5, number: 5, unit: "1. Hàng phím cơ sở (Home Row)", title: "Bài 5", focus: "1. Hàng phím cơ sở (Home Row) · Luyện phối hợp các cặp ngón tay đối xứng", text: "fj dk sl a;" },
  { id: 6, number: 6, unit: "1. Hàng phím cơ sở (Home Row)", title: "Bài 6", focus: "1. Hàng phím cơ sở (Home Row) · Luyện mở rộng ngón trỏ sang phím G và H", text: "g h g h" },
  { id: 7, number: 7, unit: "1. Hàng phím cơ sở (Home Row)", title: "Bài 7", focus: "1. Hàng phím cơ sở (Home Row) · Phối hợp ngón trỏ và ngón giữa hai bàn tay", text: "fg jh df jk" },
  { id: 8, number: 8, unit: "1. Hàng phím cơ sở (Home Row)", title: "Bài 8", focus: "1. Hàng phím cơ sở (Home Row) · Chuỗi ngón tay hàng cơ sở từ ngoài vào trong", text: "asdf jkl; asdf jkl;" },
  { id: 9, number: 9, unit: "1. Hàng phím cơ sở (Home Row)", title: "Bài 9", focus: "1. Hàng phím cơ sở (Home Row) · Các tổ hợp phím hàng cơ sở tạo thành âm tiết", text: "fad jak lag gas" },
  { id: 10, number: 10, unit: "1. Hàng phím cơ sở (Home Row)", title: "Bài 10", focus: "1. Hàng phím cơ sở (Home Row) · Luyện phản xạ ngón tay liền mạch trên hàng cơ sở", text: "sad lad glad flash" },

  // Unit 2
  { id: 11, number: 11, unit: "2. Hàng phím trên (Top Row)", title: "Bài 11", focus: "2. Hàng phím trên (Top Row) · Vươn ngón trỏ lên phím R và U", text: "r u r u" },
  { id: 12, number: 12, unit: "2. Hàng phím trên (Top Row)", title: "Bài 12", focus: "2. Hàng phím trên (Top Row) · Vươn ngón giữa lên phím E và I", text: "e i e i" },
  { id: 13, number: 13, unit: "2. Hàng phím trên (Top Row)", title: "Bài 13", focus: "2. Hàng phím trên (Top Row) · Vươn ngón áp út lên phím W và O", text: "w o w o" },
  { id: 14, number: 14, unit: "2. Hàng phím trên (Top Row)", title: "Bài 14", focus: "2. Hàng phím trên (Top Row) · Vươn ngón út lên phím Q và P", text: "q p q p" },
  { id: 15, number: 15, unit: "2. Hàng phím trên (Top Row)", title: "Bài 15", focus: "2. Hàng phím trên (Top Row) · Mở rộng ngón trỏ lên phím T và Y", text: "t y t y" },
  { id: 16, number: 16, unit: "2. Hàng phím trên (Top Row)", title: "Bài 16", focus: "2. Hàng phím trên (Top Row) · Tập hợp các ngón vươn hàng trên", text: "ru ei wo qp ty" },
  { id: 17, number: 17, unit: "2. Hàng phím trên (Top Row)", title: "Bài 17", focus: "2. Hàng phím trên (Top Row) · Ghép từ đơn giản kết hợp hàng trên và hàng cơ sở", text: "the you our out" },
  { id: 18, number: 18, unit: "2. Hàng phím trên (Top Row)", title: "Bài 18", focus: "2. Hàng phím trên (Top Row) · Luyện linh hoạt giữa hàng phím trên và hàng cơ sở", text: "true quiet power write" },
  { id: 19, number: 19, unit: "2. Hàng phím trên (Top Row)", title: "Bài 19", focus: "2. Hàng phím trên (Top Row) · Câu luyện tập phản xạ hàng phím trên", text: "type your report quickly" },
  { id: 20, number: 20, unit: "2. Hàng phím trên (Top Row)", title: "Bài 20", focus: "2. Hàng phím trên (Top Row) · Quét phím toàn diện hai hàng phím trên và cơ sở", text: "qwerty uiop asdfgh jkl;" },

  // Unit 3
  { id: 21, number: 21, unit: "3. Hàng phím dưới (Bottom Row)", title: "Bài 21", focus: "3. Hàng phím dưới (Bottom Row) · Hạ ngón trỏ xuống phím V và M", text: "v m v m" },
  { id: 22, number: 22, unit: "3. Hàng phím dưới (Bottom Row)", title: "Bài 22", focus: "3. Hàng phím dưới (Bottom Row) · Hạ ngón giữa xuống phím C và dấu phẩy (,)", text: "c , c ," },
  { id: 23, number: 23, unit: "3. Hàng phím dưới (Bottom Row)", title: "Bài 23", focus: "3. Hàng phím dưới (Bottom Row) · Hạ ngón áp út xuống phím X và dấu chấm (.)", text: "x . x ." },
  { id: 24, number: 24, unit: "3. Hàng phím dưới (Bottom Row)", title: "Bài 24", focus: "3. Hàng phím dưới (Bottom Row) · Hạ ngón út xuống phím Z và dấu gạch chéo (/)", text: "z / z /" },
  { id: 25, number: 25, unit: "3. Hàng phím dưới (Bottom Row)", title: "Bài 25", focus: "3. Hàng phím dưới (Bottom Row) · Mở rộng ngón trỏ xuống phím B và N", text: "b n b n" },
  { id: 26, number: 26, unit: "3. Hàng phím dưới (Bottom Row)", title: "Bài 26", focus: "3. Hàng phím dưới (Bottom Row) · Tổng hợp các bước hạ ngón hàng phím dưới", text: "vm c, x. z/ bn" },
  { id: 27, number: 27, unit: "3. Hàng phím dưới (Bottom Row)", title: "Bài 27", focus: "3. Hàng phím dưới (Bottom Row) · Ghép từ ngắn kết hợp cả ba hàng phím chữ", text: "can man van box zip" },
  { id: 28, number: 28, unit: "3. Hàng phím dưới (Bottom Row)", title: "Bài 28", focus: "3. Hàng phím dưới (Bottom Row) · Từ vựng mở rộng ngón tay linh hoạt", text: "back next zero come view" },
  { id: 29, number: 29, unit: "3. Hàng phím dưới (Bottom Row)", title: "Bài 29", focus: "3. Hàng phím dưới (Bottom Row) · Quét toàn bộ hàng phím dưới theo thứ tự", text: "z x c v b n m , . /" },
  { id: 30, number: 30, unit: "3. Hàng phím dưới (Bottom Row)", title: "Bài 30", focus: "3. Hàng phím dưới (Bottom Row) · Câu kinh điển chứa đầy đủ bảng chữ cái tiếng Anh", text: "the quick brown fox jumps over lazy dog" },

  // Unit 4
  { id: 31, number: 31, unit: "4. Luyện tổ hợp phím chữ không dấu", title: "Bài 31", focus: "4. Luyện tổ hợp phím chữ không dấu · Cụm từ âm tiết mở không dấu", text: "ban mai sang som tia nang vang" },
  { id: 32, number: 32, unit: "4. Luyện tổ hợp phím chữ không dấu", title: "Bài 32", focus: "4. Luyện tổ hợp phím chữ không dấu · Luyện nhịp điệu gõ ngón đều đặn", text: "con meo con chuot chay quanh nha" },
  { id: 33, number: 33, unit: "4. Luyện tổ hợp phím chữ không dấu", title: "Bài 33", focus: "4. Luyện tổ hợp phím chữ không dấu · Luyện chuyển ngón hai bàn tay nhịp nhàng", text: "hoc tap cham chi tien bo nhanh" },
  { id: 34, number: 34, unit: "4. Luyện tổ hợp phím chữ không dấu", title: "Bài 34", focus: "4. Luyện tổ hợp phím chữ không dấu · Cụm từ rèn độ chính xác chuyển dòng", text: "que huong thanh binh tuoi dep" },
  { id: 35, number: 35, unit: "4. Luyện tổ hợp phím chữ không dấu", title: "Bài 35", focus: "4. Luyện tổ hợp phím chữ không dấu · Luyện phản xạ từ đa âm tiết không dấu", text: "song suoi nui rung bien ca bao la" },

  // Unit 5
  { id: 36, number: 36, unit: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ)", title: "Bài 36", focus: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ) · Quy tắc Telex căn bản cho các nguyên âm có dấu mũ/móc và chữ đ", text: "aa aw ee oo ow uw dd" },
  { id: 37, number: 37, unit: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ)", title: "Bài 37", focus: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ) · Luyện nguyên âm Ă (aw)", text: "ăn mặc ngay ngắn tươi tắn" },
  { id: 38, number: 38, unit: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ)", title: "Bài 38", focus: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ) · Luyện nguyên âm Â (aa)", text: "cây cầu mùa xuân ấm áp" },
  { id: 39, number: 39, unit: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ)", title: "Bài 39", focus: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ) · Luyện nguyên âm Ê (ee)", text: "bếp lửa êm đềm dệt lụa" },
  { id: 40, number: 40, unit: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ)", title: "Bài 40", focus: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ) · Luyện nguyên âm Ô (oo)", text: "cô giáo ngôi nhà phố xá" },
  { id: 41, number: 41, unit: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ)", title: "Bài 41", focus: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ) · Luyện nguyên âm Ơ (ow)", text: "cơn mưa bờ ao quả mơ" },
  { id: 42, number: 42, unit: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ)", title: "Bài 42", focus: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ) · Luyện nguyên âm Ư (uw)", text: "bức tranh mực nước tươi cười" },
  { id: 43, number: 43, unit: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ)", title: "Bài 43", focus: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ) · Luyện chữ Đ (dd)", text: "đường đi đất nước đồng quê" },
  { id: 44, number: 44, unit: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ)", title: "Bài 44", focus: "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ) · Tổng hợp các nguyên âm đặc trưng tiếng Việt", text: "ước mơ bờ tre đường làng mùa xuân" },

  // Unit 6
  { id: 45, number: 45, unit: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng)", title: "Bài 45", focus: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng) · Vị trí 5 phím dấu thanh trong kiểu gõ Telex", text: "s f r x j" },
  { id: 46, number: 46, unit: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng)", title: "Bài 46", focus: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng) · Luyện dấu Sắc (phím S)", text: "cá má lá búp súp sóng" },
  { id: 47, number: 47, unit: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng)", title: "Bài 47", focus: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng) · Luyện dấu Huyền (phím F)", text: "nhà bà làng cành màng" },
  { id: 48, number: 48, unit: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng)", title: "Bài 48", focus: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng) · Luyện dấu Hỏi (phím R)", text: "cỏ quả nhỏ bảo hiểu mở" },
  { id: 49, number: 49, unit: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng)", title: "Bài 49", focus: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng) · Luyện dấu Ngã (phím X)", text: "sữa bão vẽ nghĩ vẫy gỗ" },
  { id: 50, number: 50, unit: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng)", title: "Bài 50", focus: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng) · Luyện dấu Nặng (phím J)", text: "mẹ bạn vẹt lụa sạch đẹp" },
  { id: 51, number: 51, unit: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng)", title: "Bài 51", focus: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng) · Kết hợp chuỗi cả 5 dấu thanh liên tiếp", text: "lá cành nhỏ vẫy nhẹ" },
  { id: 52, number: 52, unit: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng)", title: "Bài 52", focus: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng) · Câu luyện dấu thanh nhịp nhàng", text: "học đi đôi với hành, nói đi đôi với làm" },
  { id: 53, number: 53, unit: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng)", title: "Bài 53", focus: "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng) · Đoạn ngắn kết hợp nguyên âm và dấu thanh", text: "tiếng việt giàu đẹp và phong phú muôn màu" },

  // Unit 7
  { id: 54, number: 54, unit: "7. Phím Shift & Chữ in hoa", title: "Bài 54", focus: "7. Phím Shift & Chữ in hoa · Luyện phím Shift bên phải gõ tay trái in hoa", text: "A B C D E F G H I J K L M" },
  { id: 55, number: 55, unit: "7. Phím Shift & Chữ in hoa", title: "Bài 55", focus: "7. Phím Shift & Chữ in hoa · Luyện phím Shift bên trái gõ tay phải in hoa", text: "N O P Q R S T U V W X Y Z" },
  { id: 56, number: 56, unit: "7. Phím Shift & Chữ in hoa", title: "Bài 56", focus: "7. Phím Shift & Chữ in hoa · Viết hoa tên địa danh Việt Nam", text: "Hà Nội, TP Hồ Chí Minh, Đà Nẵng, Huế, Cần Thơ" },
  { id: 57, number: 57, unit: "7. Phím Shift & Chữ in hoa", title: "Bài 57", focus: "7. Phím Shift & Chữ in hoa · Viết hoa họ và tên riêng", text: "Nguyễn Văn An, Lê Thị Mai, Trần Quốc Tuấn" },
  { id: 58, number: 58, unit: "7. Phím Shift & Chữ in hoa", title: "Bài 58", focus: "7. Phím Shift & Chữ in hoa · Viết hoa đầu câu và dấu câu kết thúc", text: "Việt Nam quê hương tôi tươi đẹp vô cùng." },
  { id: 59, number: 59, unit: "7. Phím Shift & Chữ in hoa", title: "Bài 59", focus: "7. Phím Shift & Chữ in hoa · Luyện chuyển ngón Shift xen kẽ chữ thường liên tục", text: "Sông Hồng, Sông Cửu Long, Dãy Trường Sơn hùng vĩ." },

  // Unit 8
  { id: 60, number: 60, unit: "8. Hàng phím số (Numbers 0 - 9)", title: "Bài 60", focus: "8. Hàng phím số (Numbers 0 - 9) · Dãy số theo thứ tự ngón tay từ trái sang phải", text: "1 2 3 4 5 6 7 8 9 0" },
  { id: 61, number: 61, unit: "8. Hàng phím số (Numbers 0 - 9)", title: "Bài 61", focus: "8. Hàng phím số (Numbers 0 - 9) · Luyện vươn ngón trỏ lên các số trung tâm (4, 5, 6, 7)", text: "4 5 6 7 4 5 6 7" },
  { id: 62, number: 62, unit: "8. Hàng phím số (Numbers 0 - 9)", title: "Bài 62", focus: "8. Hàng phím số (Numbers 0 - 9) · Luyện ngón giữa, áp út và út lên hàng số", text: "3 8 2 9 1 0" },
  { id: 63, number: 63, unit: "8. Hàng phím số (Numbers 0 - 9)", title: "Bài 63", focus: "8. Hàng phím số (Numbers 0 - 9) · Gõ các mốc năm 4 chữ số thường gặp", text: "1945 1975 2024 2026" },
  { id: 64, number: 64, unit: "8. Hàng phím số (Numbers 0 - 9)", title: "Bài 64", focus: "8. Hàng phím số (Numbers 0 - 9) · Luyện định dạng số điện thoại", text: "0912 345 678, 0988 765 432" },
  { id: 65, number: 65, unit: "8. Hàng phím số (Numbers 0 - 9)", title: "Bài 65", focus: "8. Hàng phím số (Numbers 0 - 9) · Kết hợp văn bản chữ tiếng Việt và chữ số", text: "Ngày 02 tháng 09 năm 1945, lúc 14 giờ 30 phút." },

  // Unit 9
  { id: 66, number: 66, unit: "9. Ký hiệu cơ bản & Dấu câu", title: "Bài 66", focus: "9. Ký hiệu cơ bản & Dấu câu · Các dấu câu cơ bản trong văn bản tiếng Việt", text: ", . ; : ' \" - ? !" },
  { id: 67, number: 67, unit: "9. Ký hiệu cơ bản & Dấu câu", title: "Bài 67", focus: "9. Ký hiệu cơ bản & Dấu câu · Luyện dấu cảm thán (!) và dấu chấm hỏi (?)", text: "Chào bạn! Bạn có khỏe không? Tôi rất vui được gặp bạn." },
  { id: 68, number: 68, unit: "9. Ký hiệu cơ bản & Dấu câu", title: "Bài 68", focus: "9. Ký hiệu cơ bản & Dấu câu · Luyện dấu phẩy (,) và dấu chấm phẩy (;)", text: "Học, học nữa, học mãi; không bao giờ là quá muộn." },
  { id: 69, number: 69, unit: "9. Ký hiệu cơ bản & Dấu câu", title: "Bài 69", focus: "9. Ký hiệu cơ bản & Dấu câu · Luyện dấu hai chấm (:) và dấu ngoặc kép (\"\")", text: "Bác Hồ nói: \"Không có gì quý hơn độc lập, tự do.\"" },
  { id: 70, number: 70, unit: "9. Ký hiệu cơ bản & Dấu câu", title: "Bài 70", focus: "9. Ký hiệu cơ bản & Dấu câu · Luyện dấu ngoặc đơn ( )", text: "Toán học (đại số và hình học) là môn học rất bổ ích." },
  { id: 71, number: 71, unit: "9. Ký hiệu cơ bản & Dấu câu", title: "Bài 71", focus: "9. Ký hiệu cơ bản & Dấu câu · Luyện dấu gạch ngang (-) và dấu chấm phân cách số", text: "Công nghệ 4.0 - Xu hướng phát triển của tương lai." },

  // Unit 10
  { id: 72, number: 72, unit: "10. Ký hiệu nâng cao & Lập trình", title: "Bài 72", focus: "10. Ký hiệu nâng cao & Lập trình · Dãy ký hiệu Shift hàng số", text: "! @ # $ % ^ & * ( ) _ +" },
  { id: 73, number: 73, unit: "10. Ký hiệu nâng cao & Lập trình", title: "Bài 73", focus: "10. Ký hiệu nâng cao & Lập trình · Ký hiệu lập trình và khối lệnh", text: "[ ] { } < > / \\ | ` ~ = +" },
  { id: 74, number: 74, unit: "10. Ký hiệu nâng cao & Lập trình", title: "Bài 74", focus: "10. Ký hiệu nâng cao & Lập trình · Ký hiệu email, URL (@, :, //, .)", text: "email: support@example.com - website: https://typing.vn" },
  { id: 75, number: 75, unit: "10. Ký hiệu nâng cao & Lập trình", title: "Bài 75", focus: "10. Ký hiệu nâng cao & Lập trình · Ký hiệu toán học và tiền tệ (%, $, +, =)", text: "100% + 50$ = 150$, giảm giá 20% cho đơn hàng." },
  { id: 76, number: 76, unit: "10. Ký hiệu nâng cao & Lập trình", title: "Bài 76", focus: "10. Ký hiệu nâng cao & Lập trình · Luyện gõ cú pháp code cơ bản (camelCase, ngoặc nhọn, chấm phẩy)", text: "const total = items.map(item => item.price * 1.1);" },
  { id: 77, number: 77, unit: "10. Ký hiệu nâng cao & Lập trình", title: "Bài 77", focus: "10. Ký hiệu nâng cao & Lập trình · Luyện tổ hợp dấu so sánh, logic và khối mã nguồn", text: "if (score >= 90 && isValid == true) { return \"Passed\"; }" },

  // Unit 11
  { id: 78, number: 78, unit: "11. Luyện phân biệt từ dễ nhầm lẫn", title: "Bài 78", focus: "11. Luyện phân biệt từ dễ nhầm lẫn · Phân biệt phụ âm đầu L và N", text: "lúa nếp, nếp làng, no nê, lo lắng, lung linh, năng suất" },
  { id: 79, number: 79, unit: "11. Luyện phân biệt từ dễ nhầm lẫn", title: "Bài 79", focus: "11. Luyện phân biệt từ dễ nhầm lẫn · Phân biệt phụ âm đầu S và X", text: "sương sớm, xao xuyến, sản xuất, xinh xắn, súc tích, xuất sắc" },
  { id: 80, number: 80, unit: "11. Luyện phân biệt từ dễ nhầm lẫn", title: "Bài 80", focus: "11. Luyện phân biệt từ dễ nhầm lẫn · Phân biệt phụ âm đầu TR và CH", text: "trung thực, chân thành, tre trúc, chong chóng, trao đổi, chở che" },
  { id: 81, number: 81, unit: "11. Luyện phân biệt từ dễ nhầm lẫn", title: "Bài 81", focus: "11. Luyện phân biệt từ dễ nhầm lẫn · Phân biệt phụ âm R, D và GI", text: "rộn rã, dịu dàng, giòn giã, dòng sông, rực rỡ, giúp đỡ" },
  { id: 82, number: 82, unit: "11. Luyện phân biệt từ dễ nhầm lẫn", title: "Bài 82", focus: "11. Luyện phân biệt từ dễ nhầm lẫn · Phân biệt thanh Hỏi (?) và thanh Ngã (~)", text: "bão bùng, bảo ban, suy nghĩ, nghỉ ngơi, vội vã, vất vả" },
  { id: 83, number: 83, unit: "11. Luyện phân biệt từ dễ nhầm lẫn", title: "Bài 83", focus: "11. Luyện phân biệt từ dễ nhầm lẫn · Câu tổng hợp kiểm tra lỗi chính tả", text: "Luyện gõ đúng phụ âm đầu và dấu thanh là nền tảng của văn bản chuẩn." },

  // Unit 12
  { id: 84, number: 84, unit: "12. Cụm từ & Thành ngữ phổ biến", title: "Bài 84", focus: "12. Cụm từ & Thành ngữ phổ biến · Luyện thành ngữ tiếng Việt 1", text: "Ăn quả nhớ kẻ trồng cây, uống nước nhớ nguồn." },
  { id: 85, number: 85, unit: "12. Cụm từ & Thành ngữ phổ biến", title: "Bài 85", focus: "12. Cụm từ & Thành ngữ phổ biến · Luyện thành ngữ tiếng Việt 2", text: "Có công mài sắt, có ngày nên kim." },
  { id: 86, number: 86, unit: "12. Cụm từ & Thành ngữ phổ biến", title: "Bài 86", focus: "12. Cụm từ & Thành ngữ phổ biến · Luyện thành ngữ tiếng Việt 3", text: "Gần mực thì đen, gần đèn thì rạng." },
  { id: 87, number: 87, unit: "12. Cụm từ & Thành ngữ phổ biến", title: "Bài 87", focus: "12. Cụm từ & Thành ngữ phổ biến · Luyện thành ngữ tiếng Việt 4", text: "Học thầy không tày học bạn, đi một ngày đàng học một sàng khôn." },
  { id: 88, number: 88, unit: "12. Cụm từ & Thành ngữ phổ biến", title: "Bài 88", focus: "12. Cụm từ & Thành ngữ phổ biến · Luyện thành ngữ tiếng Việt 5", text: "Đoàn kết là sức mạnh, tương thân tương ái, lá lành đùm lá rách." },
  { id: 89, number: 89, unit: "12. Cụm từ & Thành ngữ phổ biến", title: "Bài 89", focus: "12. Cụm từ & Thành ngữ phổ biến · Luyện thành ngữ tiếng Việt 6", text: "Lời nói chẳng mất tiền mua, lựa lời mà nói cho vừa lòng nhau." },

  // Unit 13
  { id: 90, number: 90, unit: "13. Đoạn văn thực hành nâng cao & Ứng dụng thực tế", title: "Bài 90", focus: "13. Đoạn văn thực hành nâng cao & Ứng dụng thực tế · Ứng dụng 1: Lợi ích của gõ 10 ngón", text: "Kỹ năng gõ 10 ngón không chỉ giúp bạn gia tăng tốc độ làm việc mà còn giảm thiểu căng thẳng cho cổ tay và mắt khi nhìn liên tục vào bàn phím." },
  { id: 91, number: 91, unit: "13. Đoạn văn thực hành nâng cao & Ứng dụng thực tế", title: "Bài 91", focus: "13. Đoạn văn thực hành nâng cao & Ứng dụng thực tế · Ứng dụng 2: Công nghệ & Thời đại số", text: "Trí tuệ nhân tạo và công nghệ đám mây đang định hình lại phương thức làm việc hiện đại. Việc thành thạo bàn phím giúp bạn làm chủ công cụ nhanh chóng." },
  { id: 92, number: 92, unit: "13. Đoạn văn thực hành nâng cao & Ứng dụng thực tế", title: "Bài 92", focus: "13. Đoạn văn thực hành nâng cao & Ứng dụng thực tế · Ứng dụng 3: Văn hóa & Đất nước", text: "Việt Nam là một đất nước có bề dày lịch sử và truyền thống văn hóa ngàn năm. Tình yêu quê hương đất nước luôn là động lực mạnh mẽ cho mỗi thế hệ vươn lên." },
  { id: 93, number: 93, unit: "13. Đoạn văn thực hành nâng cao & Ứng dụng thực tế", title: "Bài 93", focus: "13. Đoạn văn thực hành nâng cao & Ứng dụng thực tế · Ứng dụng 4: Phương pháp rèn luyện hiệu quả", text: "Mỗi ngày dành ra 15 đến 20 phút luyện tập gõ phím với độ chính xác cao sẽ mang lại kết quả bất ngờ chỉ sau vài tuần kiên trì." },
  { id: 94, number: 94, unit: "13. Đoạn văn thực hành nâng cao & Ứng dụng thực tế", title: "Bài 94", focus: "13. Đoạn văn thực hành nâng cao & Ứng dụng thực tế · Ứng dụng 5: Tinh thần bền bỉ và bứt phá", text: "Hành trình vạn dặm bắt đầu từ một bước chân. Hãy giữ vững sự tập trung, gõ đúng từng phím rồi tốc độ tự nhiên sẽ đến." }
];

const unitIdMap: Record<string, number> = {
  "1. Hàng phím cơ sở (Home Row)": 1,
  "2. Hàng phím trên (Top Row)": 2,
  "3. Hàng phím dưới (Bottom Row)": 3,
  "4. Luyện tổ hợp phím chữ không dấu": 4,
  "5. Quy tắc gõ Tiếng Việt - Nguyên âm (ă, â, ê, ô, ơ, ư, đ)": 5,
  "6. Quy tắc gõ Tiếng Việt - Dấu thanh (sắc, huyền, hỏi, ngã, nặng)": 6,
  "7. Phím Shift & Chữ in hoa": 7,
  "8. Hàng phím số (Numbers 0 - 9)": 8,
  "9. Ký hiệu cơ bản & Dấu câu": 9,
  "10. Ký hiệu nâng cao & Lập trình": 10,
  "11. Luyện phân biệt từ dễ nhầm lẫn": 11,
  "12. Cụm từ & Thành ngữ phổ biến": 12,
  "13. Đoạn văn thực hành nâng cao & Ứng dụng thực tế": 13
};

// Build formatted lessons
const lessons = inputLessons.map(l => {
  const unitId = unitIdMap[l.unit] || 1;
  const meta = unitMeta[unitId];
  const targetKeys = Array.from(new Set(l.text.replace(/\s+/g, '').split(''))).slice(0, 8);

  let targetWpm = 15;
  if (unitId === 2 || unitId === 3) targetWpm = 20;
  else if (unitId >= 4 && unitId <= 7) targetWpm = 25;
  else if (unitId >= 8 && unitId <= 11) targetWpm = 28;
  else if (unitId >= 12) targetWpm = 32;

  let type: 'lesson' | 'game' | 'test' | 'story' = 'lesson';
  let gameType: any = undefined;

  if (l.id === 10 || l.id === 20 || l.id === 35 || l.id === 53 || l.id === 59 || l.id === 65 || l.id === 71 || l.id === 77 || l.id === 83 || l.id === 89) {
    type = 'test';
  } else if (l.id === 30) {
    type = 'game';
    gameType = 'falling_words';
  } else if (l.id === 94) {
    type = 'game';
    gameType = 'monster_battle';
  } else if (unitId === 13) {
    type = 'story';
  }

  // Generate 4-line content array for each lesson
  const content = [
    l.text,
    l.text,
    l.text,
    l.text
  ];

  return {
    id: Number(l.id),
    unitId: unitId,
    unitTitle: `Unit ${unitId}: ${l.unit}`,
    unitSubtitle: meta?.subtitle || '',
    title: `${l.title}: ${l.focus.split('·')[1]?.trim() || l.focus}`,
    type: type,
    description: l.focus,
    targetKeys: targetKeys.length > 0 ? targetKeys : ['f', 'j'],
    content: content,
    minAccuracy: unitId >= 11 ? 94 : (unitId >= 5 ? 90 : 85),
    targetWpm: targetWpm,
    ...(gameType ? { gameType } : {})
  };
});

// Build units
const units = inputUnits.map(u => {
  const idNum = Number(u.id);
  const meta = unitMeta[idNum];
  const unitLessons = lessons.filter(l => l.unitId === idNum);

  return {
    id: idNum,
    title: `Unit ${idNum}: ${u.name}`,
    subtitle: meta?.subtitle || '',
    color: meta?.color || '#0284c7',
    icon: meta?.icon || 'Keyboard',
    description: meta?.description || '',
    lessonIds: unitLessons.map(l => l.id)
  };
});

const output = {
  version: 2,
  name: "Lộ trình học gõ 10 ngón tiếng Việt chuẩn",
  description: "Lộ trình luyện gõ 10 ngón từ cơ bản đến nâng cao, tích hợp chuẩn gõ tiếng Việt, phím số, ký hiệu và văn bản thực tế.",
  totalLessons: lessons.length,
  totalUnits: units.length,
  units,
  lessons
};

fs.writeFileSync(
  path.join(process.cwd(), 'src/data/vietnameseCurriculum.json'),
  JSON.stringify(output, null, 2),
  'utf-8'
);

console.log(`Generated ${units.length} units and ${lessons.length} lessons.`);
