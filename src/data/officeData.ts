export type OfficeSoftware = 'word' | 'excel';
export type OfficeLevel = 'basic' | 'intermediate' | 'advanced';

export type OfficeCategory =
  | 'formatting'
  | 'layout'
  | 'references'
  | 'mail_merge'
  | 'shortcuts'
  | 'advanced_tricks'
  | 'basics'
  | 'math_stat'
  | 'lookup'
  | 'logic_condition'
  | 'text_date'
  | 'data_analysis'
  | 'tricks_security';

export interface OfficeParameter {
  name: string;
  description: string;
  optional?: boolean;
}

export interface OfficeExampleData {
  headers: string[];
  rows: (string | number)[][];
}

export interface OfficeExample {
  scenario: string;
  inputData?: OfficeExampleData;
  formulaOrSteps: string;
  result: string;
  explanation: string;
}

export interface OfficeTopic {
  id: string;
  software: OfficeSoftware;
  level: OfficeLevel;
  category: OfficeCategory;
  categoryName: string;
  title: string;
  vietnameseTitle: string;
  shortDescription: string;
  syntax?: string;
  parameters?: OfficeParameter[];
  example: OfficeExample;
  commonMistakes?: string[];
  proTips?: string[];
  shortcutKeys?: string[];
  practiceDrills?: string[];
}

export const OFFICE_TOPICS: OfficeTopic[] = [
  // =========================================================================
  // BÀI HỌC CƠ BẢN WORD & EXCEL (NEW)
  // =========================================================================
  {
    id: 'word_basic_create',
    software: 'word',
    level: 'basic',
    category: 'basics',
    categoryName: 'Các thao tác cơ bản',
    title: 'Mở ứng dụng & Tạo File Mới',
    vietnameseTitle: 'Hướng dẫn mở Word và tạo trang soạn thảo mới',
    shortDescription: 'Cách khởi động Microsoft Word và bắt đầu một tài liệu trắng hoặc từ mẫu có sẵn.',
    syntax: 'N/A',
    example: {
      scenario: 'Tạo một báo cáo mới từ đầu',
      formulaOrSteps: '1. Nhấn nút Start trên Windows, gõ "Word" và nhấn Enter.\n2. Chọn "Blank document" (Tài liệu trống) hoặc một mẫu có sẵn.\n3. Nhấn Ctrl + N để mở nhanh tài liệu mới nếu đang ở trong Word.',
      result: 'Một trang giấy trắng hiện ra để bạn bắt đầu soạn thảo.',
      explanation: 'Đây là bước đầu tiên để sử dụng Word. Ctrl+N giúp bạn mở một file mới cực nhanh mà không cần dùng chuột.'
    },
    proTips: ['Ghim (Pin) Word xuống Taskbar để mở nhanh bằng một cú click chuột.'],
    shortcutKeys: ['Ctrl', 'N'],
    practiceDrills: ['Word', 'Blank document', 'Ctrl + N']
  },
  {
    id: 'word_basic_save',
    software: 'word',
    level: 'basic',
    category: 'basics',
    categoryName: 'Các thao tác cơ bản',
    title: 'Lưu File (Save & Save As)',
    vietnameseTitle: 'Lưu tài liệu Word để không mất dữ liệu',
    shortDescription: 'Lưu lần đầu (Save As) và lưu quá trình (Save) khi đang làm việc.',
    syntax: 'N/A',
    example: {
      scenario: 'Lưu báo cáo vào thư mục Documents',
      formulaOrSteps: '1. Nhấn Ctrl + S.\n2. Nếu là file mới, Word sẽ hỏi nơi lưu. Chọn thư mục và gõ tên file.\n3. Nhấn Save (hoặc Enter).',
      result: 'File được lưu. Lần sau nhấn Ctrl+S sẽ lưu thẳng vào file này.',
      explanation: 'Save (Ctrl+S) ghi đè lên file hiện tại. Save As (F12) dùng khi muốn lưu thành một bản sao khác.'
    },
    commonMistakes: ['Quên lưu file thường xuyên dẫn đến mất dữ liệu khi mất điện hoặc máy treo.'],
    proTips: ['Hãy tạo thói quen cứ 5-10 phút lại nhấn Ctrl + S một lần.', 'Mở tính năng AutoSave nếu dùng OneDrive để tự động lưu.'],
    shortcutKeys: ['Ctrl', 'S', 'F12'],
    practiceDrills: ['Ctrl + S', 'F12', 'Save As']
  },
  {
    id: 'excel_basic_create',
    software: 'excel',
    level: 'basic',
    category: 'basics',
    categoryName: 'Các thao tác cơ bản',
    title: 'Mở ứng dụng & Tạo Workbook Mới',
    vietnameseTitle: 'Khởi động Excel và tạo bảng tính',
    shortDescription: 'Các bước mở phần mềm Excel và chuẩn bị bảng dữ liệu.',
    syntax: 'N/A',
    example: {
      scenario: 'Bắt đầu tính toán bảng lương',
      formulaOrSteps: '1. Nhấn nút Start, gõ "Excel" và nhấn Enter.\n2. Chọn "Blank workbook" (Bảng tính trống).\n3. Bắt đầu nhập dữ liệu vào các ô (cells).',
      result: 'Một bảng tính mới (Workbook) gồm các hàng (1,2,3...) và cột (A,B,C...) hiện ra.',
      explanation: 'Trong Excel, mỗi file gọi là một Workbook, bên trong chứa nhiều Worksheet (trang tính).'
    },
    shortcutKeys: ['Ctrl', 'N'],
    practiceDrills: ['Excel', 'Blank workbook', 'Ctrl + N']
  },
  {
    id: 'excel_basic_save',
    software: 'excel',
    level: 'basic',
    category: 'basics',
    categoryName: 'Các thao tác cơ bản',
    title: 'Lưu File (Save & Save As)',
    vietnameseTitle: 'Lưu bảng tính Excel',
    shortDescription: 'Lưu trữ bảng dữ liệu một cách an toàn.',
    syntax: 'N/A',
    example: {
      scenario: 'Lưu file bảng lương tháng 9',
      formulaOrSteps: '1. Nhấn phím F12 (Lưu dưới tên mới) hoặc Ctrl + S.\n2. Chọn nơi lưu trữ và đặt tên file.\n3. Nhấn Enter.',
      result: 'File được định dạng dưới dạng .xlsx và lưu an toàn trên máy.',
      explanation: 'Dùng F12 (Save As) cực nhanh để tạo bản sao lưu mà không thay đổi file gốc.'
    },
    proTips: ['Khi xử lý lượng dữ liệu lớn, hãy lưu file thường xuyên bằng Ctrl+S trước khi dùng các hàm nặng để tránh treo máy.'],
    shortcutKeys: ['Ctrl', 'S', 'F12'],
    practiceDrills: ['Ctrl + S', 'F12', 'Save As']
  },

  // =========================================================================
  // EXCEL - BASIC
  // =========================================================================
  {
    id: 'excel_sum',
    software: 'excel',
    level: 'basic',
    category: 'math_stat',
    categoryName: 'Hàm Toán Học & Thống Kê',
    title: 'Hàm SUM',
    vietnameseTitle: 'Tính tổng các giá trị trong vùng dữ liệu',
    shortDescription: 'Cộng tất cả các số trong một phạm vi ô được chỉ định một cách nhanh chóng.',
    syntax: '=SUM(number1, [number2], ...)',
    parameters: [
      { name: 'number1', description: 'Ô hoặc vùng dữ liệu đầu tiên cần tính tổng (Bắt buộc).' },
      { name: 'number2', description: 'Các ô hoặc vùng dữ liệu tiếp theo (Tùy chọn, tối đa 255 đối số).', optional: true },
    ],
    example: {
      scenario: 'Tính tổng doanh thu bán hàng 4 quý trong năm',
      inputData: {
        headers: ['Kỳ Báo Cáo', 'Doanh Thu (Triệu VNĐ)'],
        rows: [
          ['Quý 1', 120],
          ['Quý 2', 150],
          ['Quý 3', 180],
          ['Quý 4', 210],
        ],
      },
      formulaOrSteps: '=SUM(B2:B5)',
      result: '660',
      explanation: 'Hàm cộng toàn bộ các giá trị từ ô B2 đến B5: 120 + 150 + 180 + 210 = 660.',
    },
    commonMistakes: [
      'Vùng tính tổng chứa số được lưu dưới dạng Text (chuỗi) khiến SUM bỏ qua không tính.',
      'Sử dụng dấu phẩy thay vì dấu hai chấm: SUM(A1, A10) chỉ cộng 2 ô A1 và A10 thay vì cả dải ô A1:A10.',
    ],
    proTips: [
      'Phím tắt vàng: Nhấn tổ hợp phím Alt + = (hoặc Option + Command + T trên Mac) để Excel tự động điền hàm AutoSum cho cột/hàng.',
    ],
    shortcutKeys: ['Alt', '='],
    practiceDrills: [
      '=SUM(B2:B10)',
      '=SUM(C5:C20, E5:E20)',
      '=SUM(D2:D50) * 1.1',
    ],
  },
  {
    id: 'excel_average',
    software: 'excel',
    level: 'basic',
    category: 'math_stat',
    categoryName: 'Hàm Toán Học & Thống Kê',
    title: 'Hàm AVERAGE',
    vietnameseTitle: 'Tính trung bình cộng của các giá trị',
    shortDescription: 'Trả về giá trị trung bình cộng (trung bình số học) của các đối số hoặc vùng ô.',
    syntax: '=AVERAGE(number1, [number2], ...)',
    parameters: [
      { name: 'number1', description: 'Vùng ô đầu tiên chứa các số cần tính trung bình (Bắt buộc).' },
      { name: 'number2', description: 'Vùng ô tiếp theo (Tùy chọn).', optional: true },
    ],
    example: {
      scenario: 'Tính điểm trung bình môn học của học sinh',
      inputData: {
        headers: ['Học Sinh', 'Toán', 'Văn', 'Anh'],
        rows: [
          ['Nguyễn Văn A', 8.5, 7.0, 9.0],
          ['Trần Thị B', 6.0, 8.5, 8.0],
        ],
      },
      formulaOrSteps: '=AVERAGE(B2:D2)',
      result: '8.17',
      explanation: 'Tính trung bình 3 môn của học sinh A: (8.5 + 7.0 + 9.0) / 3 = 8.166... làm tròn thành 8.17.',
    },
    commonMistakes: [
      'Nhầm lẫn giữa ô trống (không tính vào mẫu số) và ô có giá trị 0 (vẫn tính vào mẫu số làm giảm điểm TB).',
    ],
    proTips: [
      'Nếu muốn tính trung bình có điều kiện (ví dụ chỉ tính các điểm trên 5), hãy dùng AVERAGEIF.',
    ],
    practiceDrills: [
      '=AVERAGE(B2:D2)',
      '=AVERAGE(F2:F100)',
      '=ROUND(AVERAGE(C2:E2), 2)',
    ],
  },
  {
    id: 'excel_count_counta',
    software: 'excel',
    level: 'basic',
    category: 'math_stat',
    categoryName: 'Hàm Toán Học & Thống Kê',
    title: 'Hàm COUNT & COUNTA',
    vietnameseTitle: 'Đếm số lượng ô chứa số (COUNT) hoặc ô không trống (COUNTA)',
    shortDescription: 'COUNT đếm các ô chứa kiểu số. COUNTA đếm tất cả ô có dữ liệu (chữ, số, ký tự đặc biệt).',
    syntax: '=COUNT(value1, ...)\n=COUNTA(value1, ...)',
    parameters: [
      { name: 'value1', description: 'Vùng ô cần đếm dữ liệu.' },
    ],
    example: {
      scenario: 'Đếm tổng số ứng viên đã nộp hồ sơ và số ứng viên đã có điểm thi',
      inputData: {
        headers: ['Họ và Tên', 'Điểm Test'],
        rows: [
          ['Lê Hoàng Nam', 85],
          ['Phạm Thị Mai', 'Chưa thi'],
          ['Đỗ Văn Cường', 90],
          ['Ngô Thu Trang', ''],
        ],
      },
      formulaOrSteps: 'COUNTA(A2:A5) và COUNT(B2:B5)',
      result: 'COUNTA: 4 (ứng viên), COUNT: 2 (đã có điểm số)',
      explanation: 'COUNTA đếm 4 dòng có tên, COUNT chỉ đếm 2 dòng có điểm dạng số (85 và 90).',
    },
    commonMistakes: [
      'Dùng COUNT để đếm danh sách họ tên (chuỗi chữ) kết quả sẽ luôn trả về 0 vì COUNT chỉ đếm số.',
    ],
    proTips: [
      'Để đếm số ô hoàn toàn trống, sử dụng hàm COUNTBLANK(range).',
    ],
    practiceDrills: [
      '=COUNT(C2:C50)',
      '=COUNTA(A2:A100)',
      '=COUNTBLANK(B2:B50)',
    ],
  },
  {
    id: 'excel_min_max',
    software: 'excel',
    level: 'basic',
    category: 'math_stat',
    categoryName: 'Hàm Toán Học & Thống Kê',
    title: 'Hàm MIN & MAX',
    vietnameseTitle: 'Tìm giá trị nhỏ nhất và lớn nhất',
    shortDescription: 'Xác định số nhỏ nhất (MIN) hoặc số lớn nhất (MAX) trong một tập hợp dữ liệu.',
    syntax: '=MIN(number1, ...)\n=MAX(number1, ...)',
    parameters: [
      { name: 'number1', description: 'Tập hợp các số hoặc vùng dữ liệu cần so sánh.' },
    ],
    example: {
      scenario: 'Tìm đơn giá cao nhất và thấp nhất trong danh mục sản phẩm',
      inputData: {
        headers: ['Sản Phẩm', 'Đơn Giá (VNĐ)'],
        rows: [
          ['Bàn phím cơ', 1200000],
          ['Chuột Gaming', 450000],
          ['Tai nghe Bluetooth', 890000],
          ['Lót chuột RGB', 150000],
        ],
      },
      formulaOrSteps: '=MAX(B2:B5) và =MIN(B2:B5)',
      result: 'MAX: 1.200.000, MIN: 150.000',
      explanation: 'MAX tìm ra giá cao nhất là Bàn phím cơ (1.2tr), MIN tìm ra giá thấp nhất là Lót chuột (150k).',
    },
    practiceDrills: [
      '=MAX(B2:B100)',
      '=MIN(C5:C50)',
      '=MAX(D2:D20) - MIN(D2:D20)',
    ],
  },

  // =========================================================================
  // EXCEL - INTERMEDIATE
  // =========================================================================
  {
    id: 'excel_if',
    software: 'excel',
    level: 'intermediate',
    category: 'logic_condition',
    categoryName: 'Hàm Logic & Điều Kiện',
    title: 'Hàm IF (Điều Kiện)',
    vietnameseTitle: 'Kiểm tra điều kiện và trả về giá trị tương ứng',
    shortDescription: 'Hàm kiểm tra một biểu thức logic, trả về một kết quả nếu Đúng (TRUE) và kết quả khác nếu Sai (FALSE).',
    syntax: '=IF(logical_test, value_if_true, [value_if_false])',
    parameters: [
      { name: 'logical_test', description: 'Điều kiện cần kiểm tra (ví dụ: A1 >= 5, B2 = "Hà Nội").' },
      { name: 'value_if_true', description: 'Giá trị trả về nếu điều kiện ĐÚNG.' },
      { name: 'value_if_false', description: 'Giá trị trả về nếu điều kiện SAI (Nếu bỏ qua sẽ trả về FALSE).', optional: true },
    ],
    example: {
      scenario: 'Xét kết quả thi: Nếu điểm >= 5 là "Đạt", ngược lại là "Học lại"',
      inputData: {
        headers: ['Sinh Viên', 'Điểm Thi', 'Kết Quả'],
        rows: [
          ['Nguyễn Văn An', 7.5, ''],
          ['Trần Hoàng Long', 4.0, ''],
        ],
      },
      formulaOrSteps: '=IF(B2>=5, "Đạt", "Học lại")',
      result: 'Ô C2: "Đạt", Ô C3: "Học lại"',
      explanation: 'Ô B2 có 7.5 >= 5 (Đúng) -> "Đạt". Ô B3 có 4.0 >= 5 (Sai) -> "Học lại".',
    },
    commonMistakes: [
      'Quên dấu ngoặc kép đôi "" quanh chuỗi chữ (ví dụ viết IF(A1>5, Đạt, Trượt) sẽ báo lỗi #NAME?).',
      'Lồng quá nhiều hàm IF (trên 7 cấp) gây rối mắt. Với Excel mới nên dùng hàm IFS hoặc bảng tra VLOOKUP/XLOOKUP.',
    ],
    proTips: [
      'Kết hợp hàm AND/OR để kiểm tra nhiều điều kiện: =IF(AND(A2>=8, B2>=8), "Học sinh giỏi", "Khá").',
    ],
    practiceDrills: [
      '=IF(B2>=5, "Đạt", "Trượt")',
      '=IF(AND(C2>=8, D2>=8), "Thưởng", "Không")',
      '=IF(E2>1000000, E2*0.1, E2*0.05)',
    ],
  },
  {
    id: 'excel_sumif_sumifs',
    software: 'excel',
    level: 'intermediate',
    category: 'math_stat',
    categoryName: 'Hàm Tính Tổng Có Điều Kiện',
    title: 'Hàm SUMIF & SUMIFS',
    vietnameseTitle: 'Tính tổng các ô thỏa mãn một hoặc nhiều điều kiện',
    shortDescription: 'SUMIF áp dụng 1 điều kiện. SUMIFS cho phép tính tổng với 2 điều kiện trở lên cùng lúc (cực kỳ phổ biến).',
    syntax: '=SUMIF(range, criteria, [sum_range])\n=SUMIFS(sum_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)',
    parameters: [
      { name: 'sum_range', description: 'Vùng dữ liệu cần tính tổng số tiền/số lượng (Với SUMIFS nằm ở ĐẦU TIÊN).' },
      { name: 'criteria_range1', description: 'Vùng chứa tiêu chí cần xét điều kiện 1.' },
      { name: 'criteria1', description: 'Điều kiện 1 (ví dụ: "Miền Bắc", ">100", A2).' },
    ],
    example: {
      scenario: 'Tính tổng doanh thu của nhân viên "Nam" tại khu vực "Hà Nội"',
      inputData: {
        headers: ['Nhân Viên', 'Khu Vực', 'Doanh Thu (Triệu)'],
        rows: [
          ['Nam', 'Hà Nội', 50],
          ['Hoa', 'Hà Nội', 40],
          ['Nam', 'Đà Nẵng', 30],
          ['Nam', 'Hà Nội', 70],
        ],
      },
      formulaOrSteps: '=SUMIFS(C2:C5, A2:A5, "Nam", B2:B5, "Hà Nội")',
      result: '120 triệu',
      explanation: 'SUMIFS cộng các dòng thỏa mãn cả 2 điều kiện: Nhân viên là Nam VÀ Khu vực là Hà Nội (dòng 1: 50 + dòng 4: 70 = 120).',
    },
    commonMistakes: [
      'Thứ tự tham số: Trong SUMIF thì sum_range ở CUỐI CÙNG, nhưng trong SUMIFS thì sum_range lại ở ĐẦU TIÊN.',
      'Độ dài các vùng (range) không bằng nhau (ví dụ A2:A10 và B2:B15) sẽ báo lỗi #VALUE!.',
    ],
    proTips: [
      'Khuyên dùng: Hãy luôn ưu tiên dùng SUMIFS ngay cả khi chỉ có 1 điều kiện vì cú pháp nhất quán và dễ mở rộng.',
    ],
    practiceDrills: [
      '=SUMIF(A2:A50, "Bàn Phím", C2:C50)',
      '=SUMIFS(E2:E100, B2:B100, "Đã giao", C2:C100, "Hà Nội")',
      '=SUMIFS(D2:D100, A2:A100, ">="&DATE(2025,1,1), A2:A100, "<="&DATE(2025,1,31))',
    ],
  },
  {
    id: 'excel_countif_countifs',
    software: 'excel',
    level: 'intermediate',
    category: 'math_stat',
    categoryName: 'Hàm Đếm Có Điều Kiện',
    title: 'Hàm COUNTIF & COUNTIFS',
    vietnameseTitle: 'Đếm số ô thỏa mãn một hoặc nhiều điều kiện',
    shortDescription: 'Đếm số dòng đáp ứng tiêu chí lọc cụ thể (ví dụ đếm số đơn hàng trên 1 triệu, số lần xuất hiện của mã SP).',
    syntax: '=COUNTIF(range, criteria)\n=COUNTIFS(criteria_range1, criteria1, [criteria_range2, criteria2], ...)',
    parameters: [
      { name: 'range / criteria_range1', description: 'Vùng dữ liệu cần kiểm tra điều kiện.' },
      { name: 'criteria1', description: 'Điều kiện kiểm tra (ví dụ: ">=500", "Hoàn thành", "*Áo*").' },
    ],
    example: {
      scenario: 'Đếm số học sinh có điểm môn Toán từ 8.0 trở lên',
      inputData: {
        headers: ['Tên Học Sinh', 'Điểm Toán'],
        rows: [
          ['An', 8.5],
          ['Bình', 7.0],
          ['Cúc', 9.0],
          ['Dũng', 8.0],
        ],
      },
      formulaOrSteps: '=COUNTIF(B2:B5, ">=8.0")',
      result: '3',
      explanation: 'Có 3 học sinh có điểm >= 8.0 là An (8.5), Cúc (9.0) và Dũng (8.0).',
    },
    practiceDrills: [
      '=COUNTIF(C2:C50, ">=5")',
      '=COUNTIFS(A2:A100, "Nữ", B2:B100, ">=8")',
      '=COUNTIF(B2:B100, "*Hà Nội*")',
    ],
  },
  {
    id: 'excel_text_functions',
    software: 'excel',
    level: 'intermediate',
    category: 'text_date',
    categoryName: 'Hàm Xử Lý Văn Bản (Text)',
    title: 'Hàm LEFT, RIGHT, MID, TRIM, PROPER',
    vietnameseTitle: 'Tách chuỗi, cắt khoảng trắng và chuẩn hóa chữ hoa thường',
    shortDescription: 'Bộ hàm chuyên dụng để trích xuất mã sản phẩm, tách họ tên, loại bỏ dấu cách thừa.',
    syntax: '=LEFT(text, [num_chars])\n=RIGHT(text, [num_chars])\n=MID(text, start_num, num_chars)\n=TRIM(text)\n=PROPER(text)',
    parameters: [
      { name: 'text', description: 'Chuỗi văn bản gốc.' },
      { name: 'num_chars / start_num', description: 'Số ký tự cần lấy hoặc vị trí bắt đầu cắt.' },
    ],
    example: {
      scenario: 'Tách mã ngành từ mã sinh viên "CNTT-2025-001"',
      inputData: {
        headers: ['Mã Sinh Viên', 'Mã Ngành (4 ký tự đầu)', 'Năm Tuyển Sinh'],
        rows: [
          ['CNTT-2025-001', '=LEFT(A2, 4)', '=MID(A2, 6, 4)'],
          ['KETO-2024-089', '=LEFT(A3, 4)', '=MID(A3, 6, 4)'],
        ],
      },
      formulaOrSteps: '=LEFT(A2, 4) và =MID(A2, 6, 4)',
      result: 'Mã ngành: "CNTT", Năm: "2025"',
      explanation: 'LEFT(A2, 4) lấy 4 ký tự từ bên trái. MID(A2, 6, 4) bắt đầu từ ký tự thứ 6 lấy 4 ký tự.',
    },
    proTips: [
      'Dùng TRIM(text) để dọn sạch khoảng trắng thừa trước và sau chuỗi — nguyên nhân hàng đầu khiến VLOOKUP không tìm thấy!',
      'Dùng PROPER(text) để viết hoa chữ cái đầu mỗi từ (Chuẩn hóa Họ và Tên).',
    ],
    practiceDrills: [
      '=LEFT(A2, 3)',
      '=RIGHT(B2, 4)',
      '=MID(A2, 5, 2)',
      '=TRIM(PROPER(A2))',
    ],
  },
  {
    id: 'excel_conditional_formatting',
    software: 'excel',
    level: 'intermediate',
    category: 'basics',
    categoryName: 'Định Dạng Bảng Tính',
    title: 'Conditional Formatting (Định dạng có điều kiện)',
    vietnameseTitle: 'Tự động đổi màu ô theo điều kiện định trước',
    shortDescription: 'Làm nổi bật trực quan các ô có giá trị cao, thấp, âm, trùng lặp hoặc thỏa mãn công thức.',
    syntax: 'Tab Home -> Conditional Formatting -> Highlight Cells Rules',
    parameters: [
      { name: 'Rule Type', description: 'Quy tắc lọc: Greater Than, Less Than, Duplicate Values, Data Bars, Color Scales.' },
    ],
    example: {
      scenario: 'Tô màu đỏ cho các sản phẩm tồn kho < 10 và màu xanh cho tồn kho > 100',
      formulaOrSteps: 'Chọn cột Tồn kho -> Conditional Formatting -> Highlight Cells Rules -> Less Than: 10 (chọn màu đỏ). Lặp lại với Greater Than: 100 (chọn màu xanh).',
      result: 'Các sản phẩm sắp hết hàng tự động sáng màu đỏ cảnh báo tức thì.',
      explanation: 'Giúp người xem phát hiện bất thường trong dữ liệu hàng nghìn dòng trong 1 giây.',
    },
    proTips: [
      'Sử dụng quy tắc "Duplicate Values" để tìm và tô màu các số điện thoại/mã CCCD bị nhập trùng lặp.',
    ],
    practiceDrills: [
      'Tô màu đỏ các ô < 5',
      'Tô màu vàng các ô trùng lặp',
    ],
  },

  // =========================================================================
  // EXCEL - ADVANCED
  // =========================================================================
  {
    id: 'excel_vlookup',
    software: 'excel',
    level: 'advanced',
    category: 'lookup',
    categoryName: 'Hàm Dò Tìm & Tham Chiếu',
    title: 'Hàm VLOOKUP',
    vietnameseTitle: 'Dò tìm dữ liệu theo cột dọc (Vertical Lookup)',
    shortDescription: 'Tìm kiếm một giá trị trong cột đầu tiên của bảng và trả về giá trị ở cùng dòng từ cột chỉ định.',
    syntax: '=VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])',
    parameters: [
      { name: 'lookup_value', description: 'Giá trị cần tìm kiếm (ví dụ: Mã nhân viên, Mã SP, A2).' },
      { name: 'table_array', description: 'Bảng dữ liệu chứa giá trị cần tìm (Phải cố định bằng $ như $A$2:$D$50).' },
      { name: 'col_index_num', description: 'Số thứ tự của cột chứa kết quả cần lấy (tính từ 1 từ cột đầu tiên của bảng).' },
      { name: 'range_lookup', description: 'Kiểu dò: FALSE hoặc 0 (Dò chính xác 100%), TRUE hoặc 1 (Dò tương đối/gần đúng). Bắt buộc điền FALSE trong 99% trường hợp.', optional: true },
    ],
    example: {
      scenario: 'Tra cứu Tên sản phẩm và Đơn giá dựa vào Mã SP',
      inputData: {
        headers: ['Mã SP (Cột 1)', 'Tên Sản Phẩm (Cột 2)', 'Đơn Giá (Cột 3)'],
        rows: [
          ['SP01', 'Chuột Logitech G102', 400000],
          ['SP02', 'Bàn Phím Cơ AKKO', 1250000],
          ['SP03', 'Màn Hình Dell UltraSharp', 6500000],
        ],
      },
      formulaOrSteps: '=VLOOKUP("SP02", $A$2:$C$4, 2, FALSE)',
      result: '"Bàn Phím Cơ AKKO"',
      explanation: 'VLOOKUP tìm mã "SP02" ở cột 1, sau đó lấy giá trị tương ứng ở cột thứ 2 (Tên Sản Phẩm).',
    },
    commonMistakes: [
      'Quên cố định bảng $A$2:$C$4 bằng phím F4: Khi kéo công thức xuống, bảng sẽ bị trượt và báo lỗi #N/A.',
      'Quên tham số cuối cùng 0 hoặc FALSE: Excel sẽ tự dò gần đúng dẫn đến kết quả sai nghiêm trọng.',
      'Cột tìm kiếm không nằm ở vị trí ĐẦU TIÊN bên trái của bảng tham chiếu.',
    ],
    proTips: [
      'Bọc hàm IFERROR ngoài VLOOKUP để che lỗi #N/A khi mã không tồn tại: =IFERROR(VLOOKUP(...), "Không tìm thấy").',
    ],
    practiceDrills: [
      '=VLOOKUP(A2, $F$2:$H$50, 2, FALSE)',
      '=VLOOKUP(B5, $K$2:$M$100, 3, 0)',
      '=IFERROR(VLOOKUP(A2, $D$2:$F$20, 2, 0), "Không có")',
    ],
  },
  {
    id: 'excel_xlookup',
    software: 'excel',
    level: 'advanced',
    category: 'lookup',
    categoryName: 'Hàm Dò Tìm Hiện Đại (Excel 365 / 2021+)',
    title: 'Hàm XLOOKUP (Siêu Hàm Thay Thế VLOOKUP/INDEX/MATCH)',
    vietnameseTitle: 'Dò tìm 2 chiều, tra cứu trái phải không giới hạn',
    shortDescription: 'Hàm dò tìm thế hệ mới mạnh mẽ nhất của Microsoft, khắc phục hoàn toàn mọi điểm yếu của VLOOKUP.',
    syntax: '=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])',
    parameters: [
      { name: 'lookup_value', description: 'Giá trị cần tìm.' },
      { name: 'lookup_array', description: 'Cột hoặc hàng chứa giá trị cần tìm (chỉ cần 1 cột duy nhất).' },
      { name: 'return_array', description: 'Cột hoặc hàng chứa kết quả muốn trả về.' },
      { name: 'if_not_found', description: 'Giá trị hiển thị nếu không tìm thấy (thay thế hoàn toàn IFERROR).', optional: true },
    ],
    example: {
      scenario: 'Tra cứu Mã Nhân Viên từ Tên Nhân Viên (Dò ngược từ phải sang trái - điều VLOOKUP không làm được)',
      inputData: {
        headers: ['Mã NV (Cột A)', 'Họ và Tên (Cột B)', 'Phòng Ban (Cột C)'],
        rows: [
          ['NV001', 'Đặng Thu Thảo', 'Kế Toán'],
          ['NV002', 'Lê Minh Khôi', 'Kỹ Thuật'],
        ],
      },
      formulaOrSteps: '=XLOOKUP("Lê Minh Khôi", B2:B3, A2:A3, "Không tìm thấy")',
      result: '"NV002"',
      explanation: 'XLOOKUP tìm tên ở cột B và trả về mã ở cột A bên trái một cách dễ dàng, tự động báo "Không tìm thấy" nếu không khớp.',
    },
    proTips: [
      'XLOOKUP mặc định luôn dò chính xác 100% (không cần gõ FALSE/0 như VLOOKUP).',
      'Khi thêm hoặc xóa cột trong bảng tính, công thức XLOOKUP không bao giờ bị gãy.',
    ],
    practiceDrills: [
      '=XLOOKUP(A2, $D$2:$D$50, $E$2:$E$50)',
      '=XLOOKUP(B2, $H$2:$H$100, $F$2:$F$100, "N/A")',
    ],
  },
  {
    id: 'excel_index_match',
    software: 'excel',
    level: 'advanced',
    category: 'lookup',
    categoryName: 'Cặp Đôi Dò Tìm Linh Hoạt',
    title: 'Bộ Đôi INDEX + MATCH',
    vietnameseTitle: 'Dò tìm ma trận 2 chiều (Hàng & Cột)',
    shortDescription: 'Kết hợp hàm INDEX (lấy giá trị theo tọa độ) và MATCH (tìm số thứ tự dòng/cột) để dò tìm linh hoạt mọi hướng.',
    syntax: '=INDEX(array, MATCH(lookup_value, lookup_array, 0), [column_num])',
    parameters: [
      { name: 'array', description: 'Vùng chứa kết quả cần lấy.' },
      { name: 'MATCH(...)', description: 'Tìm vị trí dòng của đối tượng.' },
    ],
    example: {
      scenario: 'Tra cứu bảng giá phòng khách sạn theo Loại Phòng (Dòng) và Mùa Du Lịch (Cột)',
      formulaOrSteps: '=INDEX(B2:D5, MATCH("Deluxe", A2:A5, 0), MATCH("Mùa Cao Điểm", B1:D1, 0))',
      result: 'Giá phòng tương ứng tại giao điểm dòng và cột.',
      explanation: 'MATCH thứ 1 xác định dòng của phòng Deluxe, MATCH thứ 2 xác định cột của Mùa Cao Điểm, INDEX lấy giá tại giao điểm.',
    },
    practiceDrills: [
      '=INDEX(B2:B50, MATCH(A2, C2:C50, 0))',
      '=INDEX($D$2:$D$100, MATCH(1, ($A$2:$A$100=G1)*($B$2:$B$100=G2), 0))',
    ],
  },
  {
    id: 'excel_pivottable',
    software: 'excel',
    level: 'advanced',
    category: 'data_analysis',
    categoryName: 'Báo Cáo Phân Tích Dữ Liệu',
    title: 'PivotTable & PivotChart',
    vietnameseTitle: 'Tổng hợp, gom nhóm và tạo báo cáo động đa chiều',
    shortDescription: 'Công cụ quyền lực số 1 của Excel giúp tổng hợp hàng vạn dòng dữ liệu thành bảng báo cáo tóm tắt chỉ trong 5 giây.',
    syntax: 'Tab Insert -> PivotTable -> Kéo thả trường vào Rows, Columns, Values, Filters',
    parameters: [
      { name: 'Rows (Dòng)', description: 'Trường phân loại chính (ví dụ: Danh mục SP, Tên nhân viên).' },
      { name: 'Columns (Cột)', description: 'Trường phân loại ngang (ví dụ: Quý 1, Quý 2 hoặc Năm).' },
      { name: 'Values (Giá trị)', description: 'Trường cần tính toán (Sum of Doanh Thu, Count of Đơn Hàng).' },
    ],
    example: {
      scenario: 'Lập báo cáo doanh số theo từng nhân viên và từng vùng miền từ bảng 5.000 đơn hàng',
      formulaOrSteps: 'Insert -> PivotTable -> Kéo "Nhân Viên" vào Rows, "Khu Vực" vào Columns, "Doanh Thu" vào Values -> Thêm Slicer để lọc nhanh 1 chạm.',
      result: 'Bảng ma trận tổng hợp tức thì không cần viết bất kỳ một công thức nào.',
      explanation: 'Có thể nhấp chuột phải chọn Group để tự động gom nhóm ngày thành Tháng/Quý/Năm.',
    },
    proTips: [
      'Khi dữ liệu gốc thay đổi, nhấp chuột phải vào PivotTable -> chọn Refresh (hoặc bấm Alt + F5) để cập nhật số liệu mới nhất.',
    ],
  },
  {
    id: 'excel_data_validation',
    software: 'excel',
    level: 'advanced',
    category: 'tricks_security',
    categoryName: 'Kiểm Soát Nhập Liệu & Bảo Mật',
    title: 'Data Validation (Tạo Dropdown List)',
    vietnameseTitle: 'Tạo danh sách chọn cuộn xuống và ràng buộc dữ liệu nhập',
    shortDescription: 'Chống lỗi sai chính tả khi nhập liệu bằng cách bắt buộc người dùng chọn từ danh mục có sẵn.',
    syntax: 'Tab Data -> Data Validation -> Allow: List -> Source: =$A$1:$A$10',
    parameters: [
      { name: 'Allow', description: 'Chọn kiểu dữ liệu: List (Danh sách), Whole number (Số nguyên), Date (Ngày tháng).' },
      { name: 'Source', description: 'Nguồn danh sách (ví dụ: Nam, Nữ hoặc =$K$2:$K$10).' },
    ],
    example: {
      scenario: 'Tạo ô chọn Tình trạng đơn hàng gồm 3 giá trị: "Chờ duyệt", "Đang giao", "Hoàn thành"',
      formulaOrSteps: 'Chọn cột Tình Trạng -> Data -> Data Validation -> Allow: List -> Source gõ: Chờ duyệt, Đang giao, Hoàn thành -> OK.',
      result: 'Xuất hiện mũi tên tam giác cạnh ô, người dùng chỉ cần nhấp chuột để chọn.',
      explanation: 'Tránh hoàn toàn lỗi gõ sai chữ hoa/thường hoặc thiếu dấu tiếng Việt làm hỏng công thức SUMIFS.',
    },
    practiceDrills: [
      'Tạo Dropdown: Hà Nội, Đà Nẵng, TP.HCM',
    ],
  },

  // =========================================================================
  // WORD - BASIC
  // =========================================================================
  {
    id: 'word_font_paragraph',
    software: 'word',
    level: 'basic',
    category: 'formatting',
    categoryName: 'Soạn Thảo & Định Dạng Cơ Bản',
    title: 'Định Dạng Font Chữ & Đoạn Văn Chuẩn Văn Bản Hành Chính (NĐ 30/2020)',
    vietnameseTitle: 'Quy chuẩn cỡ chữ, kiểu chữ, căn lề và khoảng cách dòng chuẩn',
    shortDescription: 'Cài đặt văn bản chuyên nghiệp theo Nghị định 30/2020/NĐ-CP của Chính phủ.',
    syntax: 'Font: Times New Roman, Size 13-14pt, Line Spacing: 1.3 - 1.5, Paragraph Spacing: Before 0pt, After 6pt',
    example: {
      scenario: 'Định dạng văn bản hành chính công văn chuẩn quốc gia',
      formulaOrSteps: '1. Nhấn Ctrl + A chọn toàn bộ.\n2. Font: Times New Roman, Size: 14.\n3. Căn đều 2 bên: Ctrl + J.\n4. Mở hộp thoại Paragraph: Line Spacing chọn 1.5 lines, After chọn 6pt, First Line chọn 1cm.',
      result: 'Văn bản hiển thị thoáng đẹp, ngay ngắn, thụt đầu dòng tự động mỗi khi nhấn Enter.',
      explanation: 'Không dùng phím Space (dấu cách) để thụt đầu dòng vì sẽ bị lệch lạc khi chỉnh sửa.',
    },
    commonMistakes: [
      'Gõ phím Enter nhiều lần để tạo khoảng cách giữa các đoạn (Sai quy chuẩn). Hãy chỉnh thông số Spacing After trong Paragraph.',
      'Dùng phím Spacebar để canh giữa văn bản thay vì dùng phím tắt Ctrl + E.',
    ],
    shortcutKeys: ['Ctrl', 'J', 'Ctrl', 'E', 'Ctrl', 'D'],
    practiceDrills: [
      'Ctrl + J (Căn đều hai bên)',
      'Ctrl + E (Căn giữa tiêu đề)',
      'Ctrl + 1 (Giãn dòng đơn 1.0)',
      'Ctrl + 5 (Giãn dòng 1.5)',
    ],
  },
  {
    id: 'word_page_setup',
    software: 'word',
    level: 'basic',
    category: 'layout',
    categoryName: 'Bố Cục Trang In',
    title: 'Canh Lề Trang In (Page Margins & Size)',
    vietnameseTitle: 'Cài đặt lề trang in chuẩn (Trên 2cm, Dưới 2cm, Trái 3cm, Phải 1.5-2cm)',
    shortDescription: 'Quy chuẩn căn lề để đóng gáy tài liệu không bị che khuất nội dung chữ.',
    syntax: 'Tab Layout -> Margins -> Custom Margins: Top: 2cm, Bottom: 2cm, Left: 3cm, Right: 1.5-2cm, Paper: A4',
    example: {
      scenario: 'Thiết lập khổ giấy A4 và lề chuẩn trước khi soạn thảo luận văn hoặc hợp đồng',
      formulaOrSteps: 'Layout -> Size -> Chọn A4 -> Margins -> Custom Margins -> Điền Top 2cm, Bottom 2cm, Left 3cm, Right 2cm -> Nhấn "Set As Default" để lưu cho mọi tài liệu sau.',
      result: 'Trang giấy được bố trí cân đối, lề trái rộng 3cm phục vụ việc dập ghim và đóng bìa.',
      explanation: 'Lề trái luôn cần rộng hơn để dành khoảng không gian cho gáy sách/ghim tài liệu.',
    },
    proTips: [
      'Nếu thước đo Word đang hiển thị đơn vị Inches (inch), vào File -> Options -> Advanced -> Display -> Show measurements in units of: đổi thành Centimeters.',
    ],
  },
  {
    id: 'word_header_footer',
    software: 'word',
    level: 'basic',
    category: 'layout',
    categoryName: 'Tiêu Đề & Đánh Số Trang',
    title: 'Header, Footer & Đánh Số Trang Tự Động',
    vietnameseTitle: 'Tạo đầu trang, chân trang và đánh số trang dạng "Trang X / Y"',
    shortDescription: 'Thêm thông tin bản quyền, tên tài liệu và số trang xuất hiện tự động trên mọi trang.',
    syntax: 'Tab Insert -> Header / Footer / Page Number -> Bottom of Page',
    example: {
      scenario: 'Đánh số trang ở góc dưới bên phải hoặc căn giữa theo chuẩn',
      formulaOrSteps: 'Insert -> Page Number -> Bottom of Page -> Chọn kiểu Plain Number 3 (hoặc Page X of Y) -> Đóng Header & Footer.',
      result: 'Số trang tự động tăng dần từ 1 đến hết khi thêm trang mới.',
      explanation: 'Số trang cập nhật tự động kể cả khi bạn xóa bớt hoặc thêm nội dung.',
    },
    shortcutKeys: ['Alt', 'N', 'P', 'B'],
    practiceDrills: [
      'Insert -> Page Number -> Bottom of Page',
    ],
  },

  // =========================================================================
  // WORD - INTERMEDIATE
  // =========================================================================
  {
    id: 'word_table_mastery',
    software: 'word',
    level: 'intermediate',
    category: 'formatting',
    categoryName: 'Bảng Biểu Chuyên Nghiệp',
    title: 'Kỹ Thuật Xử Lý Bảng Biểu (Table Design & Layout)',
    vietnameseTitle: 'Căn chỉnh văn bản trong ô, gộp ô, lặp lại tiêu đề bảng khi sang trang mới',
    shortDescription: 'Làm chủ bảng biểu: tự động lặp lại hàng tiêu đề (Repeat Header Rows) khi bảng dài nhiều trang.',
    syntax: 'Chọn dòng tiêu đề bảng -> Tab Layout (Table Tools) -> Nhấp "Repeat Header Rows"',
    example: {
      scenario: 'Bảng biểu danh sách 500 khách hàng kéo dài qua 10 trang giấy, yêu cầu mỗi trang đều phải có dòng tiêu đề cột',
      formulaOrSteps: '1. Chọn hàng tiêu đề đầu tiên của bảng.\n2. Vào thẻ ngữ cảnh Table Layout.\n3. Nhấp nút "Repeat Header Rows".\n4. Vào Table Properties -> Row: Bỏ chọn "Allow row to break across pages" để tránh bị xé đôi dòng.',
      result: 'Khi in hoặc xem trên Word, đầu mỗi trang giấy đều tự động xuất hiện dòng tiêu đề cột đồng bộ.',
      explanation: 'Không bao giờ phải copy-paste dòng tiêu đề thủ công làm hỏng cấu trúc bảng.',
    },
    proTips: [
      'Phím tắt: Để chèn thêm 1 dòng mới ở cuối bảng, chỉ cần đặt con trỏ ở ô góc dưới cùng bên phải và nhấn phím Tab!',
    ],
  },
  {
    id: 'word_tab_stops',
    software: 'word',
    level: 'intermediate',
    category: 'formatting',
    categoryName: 'Định Dạng Nâng Cao',
    title: 'Đặt Tab Stop & Dòng Chấm Tự Động (.....)',
    vietnameseTitle: 'Tạo dòng chấm điền thông tin (Họ tên: ....................) chuẩn xác không bị lệch',
    shortDescription: 'Sử dụng thước đo Tab Leader để tạo dòng chấm thẳng hàng tăm tắp, chuyên nghiệp tuyệt đối.',
    syntax: 'Nhấp đúp chuột lên thanh Thước (Ruler) -> Chọn vị trí Tab (ví dụ 16cm) -> Leader: chọn kiểu 2 (.....) -> Set -> OK',
    example: {
      scenario: 'Tạo mẫu đơn xin việc / phiếu khảo sát có các dòng: "Họ và tên: .............", "Địa chỉ: ............."',
      formulaOrSteps: '1. Bật Thước: Tab View -> Ruler.\n2. Nhấp chuột vào điểm 16cm trên thanh thước bên phải để tạo Right Tab.\n3. Nhấp đúp vào nút Tab đó -> Chọn Leader số 2 (......) -> Bấm Set -> OK.\n4. Gõ chữ "Họ và tên:" rồi nhấn phím Tab trên bàn phím.',
      result: 'Dòng chấm tự động phóng thẳng tắp đến mép phải 16cm, căn đều tuyệt đối giữa các dòng.',
      explanation: 'Không bao giờ được gõ dấu chấm "." thủ công bằng tay vì khi in ra các dòng sẽ bị thụt thò nham nhở.',
    },
  },
  {
    id: 'word_toc_headings',
    software: 'word',
    level: 'intermediate',
    category: 'references',
    categoryName: 'Mục Lục Tự Động & Tiêu Đề',
    title: 'Tạo Mục Lục Tự Động Bằng Heading Styles',
    vietnameseTitle: 'Gán Heading 1, 2, 3 và xuất bảng mục lục kèm số trang chỉ với 1 cú click',
    shortDescription: 'Tự động trích xuất cấu trúc đề mục và số trang tương ứng, cập nhật tức thì khi chỉnh sửa nội dung.',
    syntax: 'Gán Heading 1, Heading 2 -> Tab References -> Table of Contents -> Automatic Table 1',
    example: {
      scenario: 'Tạo mục lục cho cuốn đồ án tốt nghiệp hoặc báo cáo tài chính 100 trang',
      formulaOrSteps: '1. Chọn các tiêu đề chương lớn (Chương 1, Chương 2) -> chọn style "Heading 1" (phím tắt Ctrl + Alt + 1).\n2. Chọn các mục con (1.1, 1.2) -> chọn style "Heading 2" (Ctrl + Alt + 2).\n3. Đặt con trỏ ở trang đầu -> Tab References -> Table of Contents -> Chọn Automatic Table.\n4. Khi sửa đổi tài liệu, chỉ cần nhấp "Update Table" -> "Update entire table".',
      result: 'Mục lục tự động hoàn chỉnh, có link bấm chuyển nhanh đến trang và số trang chính xác 100%.',
      explanation: 'Giúp tiết kiệm hàng giờ đồng hồ so với việc dò số trang thủ công.',
    },
    shortcutKeys: ['Ctrl', 'Alt', '1', 'Ctrl', 'Alt', '2'],
    practiceDrills: [
      'Ctrl + Alt + 1 (Gán Heading 1)',
      'Ctrl + Alt + 2 (Gán Heading 2)',
      'F9 (Cập nhật mục lục)',
    ],
  },

  // =========================================================================
  // WORD - ADVANCED
  // =========================================================================
  {
    id: 'word_mail_merge',
    software: 'word',
    level: 'advanced',
    category: 'mail_merge',
    categoryName: 'Trộn Thư Hàng Loạt (Mail Merge)',
    title: 'Trộn Thư Hàng Loạt Từ Dữ Liệu Excel (Mail Merge)',
    vietnameseTitle: 'Tự động tạo hàng nghìn thư mời, hợp đồng, phiếu lương, giấy chứng nhận từ file Excel',
    shortDescription: 'Liên kết mẫu văn bản Word với bảng danh sách Excel để xuất ra hàng loạt tài liệu cá nhân hóa.',
    syntax: 'Tab Mailings -> Start Mail Merge -> Letters -> Select Recipients -> Use an Existing List (Chọn file Excel) -> Insert Merge Field -> Finish & Merge',
    example: {
      scenario: 'In 500 Giấy chứng nhận hoàn thành khóa học cho 500 học viên từ file danh sách Excel (gồm Tên, Ngày sinh, Xếp loại)',
      formulaOrSteps: '1. Chuẩn bị file Excel `DanhSach.xlsx` có dòng đầu tiên là tiêu đề cột: HoTen, NgaySinh, XepLoai.\n2. Trong file Word mẫu chứng chỉ: Tab Mailings -> Select Recipients -> Use an Existing List -> Chọn file Excel.\n3. Đặt con trỏ tại vị trí cần điền tên -> Nhấp "Insert Merge Field" -> Chọn «HoTen».\n4. Nhấp "Preview Results" để xem thử từng người.\n5. Nhấp "Finish & Merge" -> "Edit Individual Documents" để xuất ra toàn bộ 500 trang chứng chỉ.',
      result: 'Tạo xong 500 chứng chỉ hoàn chỉnh trong chưa đầy 30 giây!',
      explanation: 'Tính năng cốt lõi cho mọi nhân viên văn phòng, nhân sự và kế toán.',
    },
    proTips: [
      'Mẹo định dạng số tiền hoặc ngày tháng trong Mail Merge: Nhấn Alt + F9 để mở trường mã trường, thêm `\\# "#,##0 VNĐ"` hoặc `\\@ "dd/MM/yyyy"` để hiển thị đúng định dạng Việt Nam.',
    ],
  },
  {
    id: 'word_section_break',
    software: 'word',
    level: 'advanced',
    category: 'layout',
    categoryName: 'Ngắt Vùng & Xoay Trang Độc Lập',
    title: 'Section Break (Xoay Ngang 1 Trang Bất Kỳ & Ngắt Số Trang)',
    vietnameseTitle: 'Xoay trang giấy nằm ngang xen kẽ trang đứng và đánh số trang từ trang bất kỳ',
    shortDescription: 'Chia văn bản thành các phân vùng độc lập để thiết lập khổ giấy ngang cho bảng biểu lớn hoặc bỏ đánh số trang bìa.',
    syntax: 'Tab Layout -> Breaks -> Section Breaks: Next Page / Continuous',
    example: {
      scenario: 'Trong tài liệu toàn trang đứng, có 1 trang số 5 chứa bảng thống kê rất rộng cần xoay ngang, sau đó trang 6 trở đi lại đứng bình thường',
      formulaOrSteps: '1. Đặt con trỏ ở cuối trang 4 -> Layout -> Breaks -> Section Break (Next Page).\n2. Đặt con trỏ ở cuối trang 5 -> Layout -> Breaks -> Section Break (Next Page).\n3. Đặt con trỏ ở trang 5 -> Layout -> Orientation -> Chọn Landscape (Xoay ngang).\n4. Trang 5 đã xoay ngang hoàn toàn mà không ảnh hưởng tới trang 1-4 hay trang 6-10!',
      result: 'Tài liệu kết hợp mượt mà giữa các trang đứng A4 và trang ngang A4.',
      explanation: 'Để ngắt liên kết Header/Footer giữa các Section, bấm bỏ chọn nút "Link to Previous" trên thanh công cụ.',
    },
  },
  {
    id: 'word_shortcut_powerhouse',
    software: 'word',
    level: 'advanced',
    category: 'shortcuts',
    categoryName: 'Bộ Phím Tắt Thần Tốc',
    title: 'Tuyển Tập Phím Tắt Soạn Thảo Đỉnh Cao',
    vietnameseTitle: 'Sao chép định dạng nhanh, lặp lại thao tác, tìm kiếm thay thế nâng cao',
    shortDescription: 'Nâng cao tốc độ làm việc lên gấp 3 lần với bộ phím tắt chuyên nghiệp.',
    syntax: 'Ctrl + Shift + C (Copy format) / Ctrl + Shift + V (Paste format)\nF4 (Lặp lại lệnh vừa làm)\nCtrl + H (Find & Replace)\nShift + F3 (Đổi chữ hoa/thường)',
    example: {
      scenario: 'Sao chép màu sắc, cỡ chữ, font từ một đoạn văn bản mẫu sang 20 tiêu đề khác',
      formulaOrSteps: 'Bôi đen đoạn mẫu -> Bấm Ctrl + Shift + C -> Bôi đen đoạn cần áp dụng -> Bấm Ctrl + Shift + V.',
      result: 'Định dạng được sao chép tức thì không cần mở lại menu.',
      explanation: 'Nhấn Shift + F3 liên tục để chuyển đổi nhanh giữa: "chữ thường" -> "Chữ Hoa Đầu Từ" -> "CHỮ HOA TOÀN BỘ".',
    },
    shortcutKeys: ['Ctrl', 'Shift', 'C', 'F4', 'Shift', 'F3'],
    practiceDrills: [
      'Ctrl + Shift + C (Sao chép định dạng)',
      'Ctrl + Shift + V (Dán định dạng)',
      'Shift + F3 (Chuyển chữ hoa/thường)',
      'Ctrl + H (Tìm kiếm & Thay thế)',
    ],
  },

  // =========================================================================
  // EXCEL - POWER HACKS & ADVANCED FORMULAS (NEW EXTENSION)
  // =========================================================================
  {
    id: 'excel_flash_fill',
    software: 'excel',
    level: 'basic',
    category: 'advanced_tricks',
    categoryName: 'Mẹo Siêu Tốc & Tự Động Hóa',
    title: 'Flash Fill (Ctrl + E) - Tách & Gộp Dữ Liệu Trong 1 Giây',
    vietnameseTitle: 'Trí tuệ nhân tạo nhận diện quy luật để tách họ tên, ghép số điện thoại, tách mã',
    shortDescription: 'Chỉ cần gõ mẫu 1 dòng đầu tiên, bấm Ctrl + E để Excel tự động điền chính xác hàng nghìn dòng còn lại.',
    syntax: 'Nhập mẫu dòng 1 -> Nhấn Ctrl + E (hoặc Tab Data -> Flash Fill)',
    example: {
      scenario: 'Cột A chứa "Nguyễn Văn An". Cần tách riêng cột Tên "An" và cột Họ Đệm "Nguyễn Văn" cho 5000 nhân viên',
      inputData: {
        headers: ['Họ Và Tên (Cột A)', 'Tên (Cột B)', 'Họ Đệm (Cột C)'],
        rows: [
          ['Nguyễn Văn An', 'An (Gõ mẫu dòng 1 -> Ctrl + E)', 'Nguyễn Văn (Gõ mẫu dòng 1 -> Ctrl + E)'],
          ['Trần Thị Mai', 'Mai (Tự động)', 'Trần Thị (Tự động)'],
          ['Lê Quốc Bảo', 'Bảo (Tự động)', 'Lê Quốc (Tự động)'],
        ],
      },
      formulaOrSteps: '1. Tại ô B2 gõ chữ "An" rồi nhấn Enter.\n2. Nhấn phím tắt Ctrl + E -> Toàn bộ cột Tên tự động điền xong!\n3. Tại ô C2 gõ "Nguyễn Văn" rồi nhấn Enter.\n4. Nhấn phím tắt Ctrl + E -> Toàn bộ Họ Đệm tự động điền xong!',
      result: 'Xong toàn bộ danh sách 5000 người chỉ trong 3 giây mà không cần dùng bất kỳ công thức phức tạp nào.',
      explanation: 'Flash Fill hoạt động cực kỳ hoàn hảo với: Tách email lấy username, chuẩn hóa số điện thoại thêm dấu chấm (0988.123.456), viết hoa chữ cái đầu.',
    },
    proTips: [
      'Phím tắt: Ctrl + E là phím tắt quyền năng nhất để xử lý dữ liệu thô dạng văn bản.',
      'Nếu Flash Fill đoán sai quy luật ở dòng nào, bạn chỉ cần sửa lại đúng dòng đó và bấm Ctrl + E lần nữa, Excel sẽ tự học lại quy luật.',
    ],
    shortcutKeys: ['Ctrl', 'E'],
    practiceDrills: [
      'Ctrl + E (Flash Fill)',
      'Data -> Flash Fill',
    ],
  },
  {
    id: 'excel_unique_sort_filter',
    software: 'excel',
    level: 'advanced',
    category: 'lookup',
    categoryName: 'Hàm Mảng Động (Dynamic Arrays)',
    title: 'Bộ 3 Hàm Mảng Động: UNIQUE, SORT & FILTER',
    vietnameseTitle: 'Lọc danh sách không trùng lặp, sắp xếp tự động và lọc dữ liệu đa điều kiện',
    shortDescription: 'Thế hệ hàm mới trả về kết quả mảng tràn tự động (Spill Range) cập nhật tức thì theo thời gian thực.',
    syntax: '=UNIQUE(array)\n=SORT(array, [sort_index], [sort_order])\n=FILTER(array, include, [if_empty])',
    parameters: [
      { name: 'UNIQUE(array)', description: 'Trích xuất danh sách các giá trị duy nhất (loại bỏ hoàn toàn các giá trị trùng lặp).' },
      { name: 'SORT(array, ...)', description: 'Tự động sắp xếp mảng theo thứ tự tăng dần (1) hoặc giảm dần (-1).' },
      { name: 'FILTER(array, include)', description: 'Lọc mảng dữ liệu thỏa mãn điều kiện logic (ví dụ B2:B100="Hà Nội").' },
    ],
    example: {
      scenario: 'Trích xuất danh sách các thành phố duy nhất từ bảng 1000 đơn hàng và tự động sắp xếp theo bảng chữ cái A-Z',
      formulaOrSteps: '=SORT(UNIQUE(B2:B1000))',
      result: 'Danh sách các thành phố duy nhất như: "Đà Nẵng", "Hà Nội", "Hải Phòng", "TP.HCM" được sắp xếp A-Z.',
      explanation: 'Kết hợp hàm UNIQUE lồng bên trong SORT giúp báo cáo tự động cập nhật khi có thành phố mới xuất hiện.',
    },
    commonMistakes: [
      'Lỗi #SPILL!: Xảy ra khi các ô bên dưới vùng kết quả mảng đang bị vướng dữ liệu cũ, bạn chỉ cần xóa các ô đó để công thức tràn xuống.',
    ],
    proTips: [
      'Để lọc đơn hàng Doanh thu > 50tr tại Hà Nội: =FILTER(A2:D100, (B2:B100="Hà Nội") * (D2:D100>50000000), "Không có")',
    ],
    practiceDrills: [
      '=UNIQUE(B2:B100)',
      '=SORT(UNIQUE(A2:A50))',
      '=FILTER(A2:E50, C2:C50="Hoàn thành")',
    ],
  },
  {
    id: 'excel_textsplit_textjoin',
    software: 'excel',
    level: 'intermediate',
    category: 'text_date',
    categoryName: 'Xử Lý Chuỗi Chuyên Nghiệp',
    title: 'Hàm TEXTJOIN & TEXTSPLIT',
    vietnameseTitle: 'Gộp nhiều ô thành chuỗi có dấu phẩy hoặc tách chuỗi thành nhiều cột',
    shortDescription: 'Thay thế hoàn toàn toán tử & hoặc hàm CONCATENATE cổ điển, tự động bỏ qua các ô trống.',
    syntax: '=TEXTJOIN(delimiter, ignore_empty, text1, [text2], ...)\n=TEXTSPLIT(text, col_delimiter, [row_delimiter])',
    parameters: [
      { name: 'delimiter', description: 'Ký tự phân cách giữa các phần tử gộp (ví dụ: ", ", " - ", "; ").' },
      { name: 'ignore_empty', description: 'TRUE để bỏ qua các ô rỗng, FALSE để giữ lại khoảng trống.' },
      { name: 'text1, text2...', description: 'Vùng các ô dữ liệu cần gộp lại.' },
    ],
    example: {
      scenario: 'Gộp danh sách email của 20 nhân viên trong phòng ban thành 1 dòng duy nhất để dán vào trường To của Outlook',
      formulaOrSteps: '=TEXTJOIN("; ", TRUE, C2:C21)',
      result: 'an@fpt.vn; mai@fpt.vn; bao@fpt.vn; dung@fpt.vn',
      explanation: 'Tất cả các email được nối lại với dấu chấm phẩy và khoảng trắng chuẩn giao thức gửi thư.',
    },
    proTips: [
      'Dùng TEXTSPLIT(A2, "-") để bẻ mã đơn hàng "HN-2026-XPS" thành 3 cột riêng biệt: "HN", "2026", "XPS".',
    ],
    practiceDrills: [
      '=TEXTJOIN(", ", TRUE, A2:A10)',
      '=TEXTJOIN("; ", TRUE, D2:D20)',
      '=TEXTSPLIT(A2, "-")',
    ],
  },
  {
    id: 'excel_datedif_networkdays',
    software: 'excel',
    level: 'intermediate',
    category: 'text_date',
    categoryName: 'Hàm Thời Gian & Kế Toán Nhân Sự',
    title: 'Hàm DATEDIF & NETWORKDAYS & EOMONTH',
    vietnameseTitle: 'Tính số năm thâm niên, tính ngày công thực tế loại trừ thứ 7 & Chủ Nhật, tính ngày cuối tháng',
    shortDescription: 'Bộ 3 hàm cốt lõi cho bộ phận tiền lương, nhân sự C&B và kế toán tài chính.',
    syntax: '=DATEDIF(start_date, end_date, unit)\n=NETWORKDAYS(start_date, end_date, [holidays])\n=EOMONTH(start_date, months)',
    parameters: [
      { name: 'unit trong DATEDIF', description: '"Y" (Số năm tròn), "M" (Số tháng), "D" (Số ngày), "YM" (Số tháng lẻ sau khi trừ số năm).' },
      { name: 'NETWORKDAYS', description: 'Tính tổng số ngày làm việc thực tế, tự động trừ các ngày Thứ 7, Chủ Nhật và ngày lễ.' },
      { name: 'EOMONTH', description: 'Trả về ngày cuối cùng của tháng sau N tháng (Ví dụ EOMONTH(TODAY(), 0) là ngày cuối tháng này).' },
    ],
    example: {
      scenario: 'Tính số năm và số tháng thâm niên làm việc của nhân viên từ ngày vào làm (01/03/2020) đến hôm nay',
      formulaOrSteps: '=DATEDIF(B2, TODAY(), "Y") & " năm " & DATEDIF(B2, TODAY(), "YM") & " tháng"',
      result: '6 năm 5 tháng',
      explanation: 'Ghép hàm DATEDIF với toán tử chuỗi để tạo kết quả hiển thị tự nhiên cho hồ sơ nhân sự.',
    },
    proTips: [
      'Tính hạn nộp báo cáo thuế cuối tháng: =EOMONTH(A2, 0) sẽ luôn trả về chính xác ngày 28, 30 hoặc 31 của tháng đó.',
    ],
    practiceDrills: [
      '=DATEDIF(A2, B2, "Y")',
      '=NETWORKDAYS(A2, B2)',
      '=EOMONTH(TODAY(), 0)',
    ],
  },
  {
    id: 'excel_freeze_panes_table',
    software: 'excel',
    level: 'basic',
    category: 'formatting',
    categoryName: 'Tổ Chức & Quản Trị Bảng Biểu',
    title: 'Cố Định Dòng Tiêu Đề (Freeze Panes) & Bảng Thông Minh (Ctrl + T)',
    vietnameseTitle: 'Giữ cố định tiêu đề cột khi cuộn trang và chuyển dữ liệu sang bảng thông minh tự động mở rộng',
    shortDescription: 'Giúp theo dõi dữ liệu hàng nghìn dòng dễ dàng và công thức tự động co giãn khi thêm dữ liệu mới.',
    syntax: 'Cố định: Tab View -> Freeze Panes -> Freeze Top Row\nBảng thông minh: Chọn bảng -> Nhấn Ctrl + T -> Enter',
    example: {
      scenario: 'Bảng dữ liệu 2000 dòng, khi cuộn xuống dưới bị mất tiêu đề cột gây nhầm lẫn',
      formulaOrSteps: '1. Chọn ô B2 (dưới hàng tiêu đề và bên phải cột Mã).\n2. Vào tab View -> Chọn Freeze Panes -> Freeze Panes.\n3. Bấm Ctrl + T để biến bảng thành Excel Table có vạch kẻ màu xen kẽ chuyên nghiệp!',
      result: 'Hàng tiêu đề và cột mã luôn hiển thị nổi khi cuộn chuột đến bất kỳ đâu.',
      explanation: 'Excel Table (Ctrl + T) giúp các hàm SUM, VLOOKUP tự động nhận diện vùng dữ liệu mới khi bạn nhập thêm dòng.',
    },
    shortcutKeys: ['Ctrl', 'T', 'Alt', 'W', 'F', 'F'],
    proTips: [
      'Nhấn Alt + W + F + F để bật/tắt Freeze Panes siêu nhanh bằng bàn phím.',
    ],
    practiceDrills: [
      'Ctrl + T (Tạo Bảng Table)',
      'View -> Freeze Panes',
    ],
  },
  {
    id: 'excel_protect_lock_cells',
    software: 'excel',
    level: 'advanced',
    category: 'tricks_security',
    categoryName: 'Bảo Mật & Khóa Dữ Liệu',
    title: 'Khóa Bảo Vệ Ô Chứa Công Thức (Protect Sheet & Lock Cells)',
    vietnameseTitle: 'Cho phép người khác nhập số liệu nhưng tuyệt đối không cho sửa hay xóa công thức',
    shortDescription: 'Bảo vệ toàn vẹn logic tính toán của file báo cáo khi chia sẻ cho nhiều phòng ban nhập liệu.',
    syntax: '1. Chọn ô được nhập -> Ctrl + 1 -> Protection -> Bỏ tích "Locked"\n2. Tab Review -> Protect Sheet -> Đặt mật khẩu',
    example: {
      scenario: 'Bạn làm mẫu file báo cáo gửi các chi nhánh: Chi nhánh chỉ được nhập Cột B (Số lượng), còn Cột C (Đơn giá) và D (Thành tiền) phải bị khóa',
      formulaOrSteps: '1. Bôi đen Cột B -> Nhấn Ctrl + 1 -> Sang tab Protection -> Bỏ chọn "Locked" -> OK.\n2. Vào tab Review -> Bấm Protect Sheet -> Đặt mật khẩu bảo vệ -> Bấm OK.',
      result: 'Người dùng chỉ có thể click và gõ vào Cột B; nếu click vào ô công thức Cột C, D hệ thống sẽ báo lỗi không cho chỉnh sửa.',
      explanation: 'Mặc định toàn bộ ô trên Excel đều được bật sẵn cờ "Locked", việc bỏ chọn ở các ô nhập liệu giúp phân quyền chính xác.',
    },
    proTips: [
      'Ẩn luôn công thức không cho người khác nhìn thấy cách tính: Tại tab Protection, tích chọn thêm ô "Hidden" trước khi Protect Sheet.',
    ],
  },
  {
    id: 'excel_goal_seek',
    software: 'excel',
    level: 'advanced',
    category: 'data_analysis',
    categoryName: 'Phân Tích Dữ Liệu Chuyên Sâu',
    title: 'Goal Seek (Tìm Kiếm Mục Tiêu Ngược) - Phân Tích What-If',
    vietnameseTitle: 'Tự động tính toán ngược biến số đầu vào để đạt được kết quả mong muốn',
    shortDescription: 'Công cụ giải bài toán kinh doanh: "Cần bán bao nhiêu sản phẩm để đạt lợi nhuận ròng 1 tỷ đồng?".',
    syntax: 'Tab Data -> What-If Analysis -> Goal Seek',
    parameters: [
      { name: 'Set cell', description: 'Ô chứa công thức kết quả (ví dụ ô Lợi Nhuận).' },
      { name: 'To value', description: 'Giá trị mục tiêu bạn mong muốn đạt được (ví dụ 1,000,000,000).' },
      { name: 'By changing cell', description: 'Ô biến số đầu vào cần Excel tính toán giúp bạn (ví dụ ô Số Lượng Bán).' },
    ],
    example: {
      scenario: 'Hiện tại bán 500 sản phẩm lãi 300 triệu. Bạn muốn biết cần bán bao nhiêu sản phẩm để lãi đúng 800 triệu',
      formulaOrSteps: '1. Vào Data -> What-If Analysis -> Chọn Goal Seek.\n2. Set cell: Chọn ô Lợi Nhuận (D10).\n3. To value: Nhập 800000000.\n4. By changing cell: Chọn ô Số Lượng (B2).\n5. Bấm OK -> Excel tự động chạy và trả về số lượng chính xác 1,333 sản phẩm!',
      result: 'Tìm ra ngay số lượng bán cần đạt mà không cần giải phương trình đại số.',
      explanation: 'Goal Seek sử dụng thuật toán tối ưu hóa lặp để hội tụ về nghiệm chính xác nhất.',
    },
  },

  // =========================================================================
  // WORD - POWER HACKS & ADVANCED FORMATTING (NEW EXTENSION)
  // =========================================================================
  {
    id: 'word_autocorrect_quickparts',
    software: 'word',
    level: 'basic',
    category: 'advanced_tricks',
    categoryName: 'Mẹo Soạn Thảo Siêu Nhanh',
    title: 'Gõ Tắt AutoCorrect & Khối Mẫu Quick Parts',
    vietnameseTitle: 'Gõ 3-4 ký tự tự động bung ra cả đoạn văn bản mẫu hoặc quốc hiệu tiêu ngữ',
    shortDescription: 'Tiết kiệm 70% thời gian gõ các câu từ lặp lại hàng ngày như tên công ty, địa chỉ, tài khoản ngân hàng.',
    syntax: 'File -> Options -> Proofing -> AutoCorrect Options -> Replace / With',
    example: {
      scenario: 'Cài đặt để khi gõ "chxh" tự động biến thành "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", gõ "cty" thành "Công ty Cổ phần Công Nghệ FPT"',
      formulaOrSteps: '1. Vào File -> Options -> Proofing -> Bấm "AutoCorrect Options...".\n2. Tại ô Replace: Nhập "chxh".\n3. Tại ô With: Nhập "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM".\n4. Bấm Add -> Bấm OK.\n5. Ra màn hình Word, chỉ cần gõ "chxh" rồi nhấn dấu cách (Space) -> Chữ tự động chuyển thành Quốc hiệu đầy đủ!',
      result: 'Soạn thảo văn bản hành chính thần tốc không bao giờ bị sai chính tả.',
      explanation: 'Tất cả các từ viết tắt này sẽ được lưu cố định trong bộ nhớ Word trên máy của bạn.',
    },
    proTips: [
      'Lưu cả bảng biểu hoặc chữ ký kèm logo: Bôi đen toàn bộ chữ ký -> Tab Insert -> Quick Parts -> Save Selection to Quick Part Gallery.',
    ],
    practiceDrills: [
      'Gõ tắt: chxh -> CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
      'Gõ tắt: dltl -> Độc lập - Tự do - Hạnh phúc',
      'Gõ tắt: vpp -> Văn phòng phẩm',
    ],
  },
  {
    id: 'word_wildcards_find_replace',
    software: 'word',
    level: 'advanced',
    category: 'formatting',
    categoryName: 'Tìm Kiếm & Thay Thế Chuyên Sâu',
    title: 'Tìm Kiếm Thay Thế Ký Tự Đặc Biệt (^p, ^w, Wildcards)',
    vietnameseTitle: 'Xóa sạch dòng trống thừa, khoảng trắng kép và định dạng lại văn bản rác trong 1 nốt nhạc',
    shortDescription: 'Xử lý triệt để các văn bản copy từ web hoặc PDF bị lỗi ngắt dòng và thừa dấu cách lung tung.',
    syntax: 'Ctrl + H -> Khung Find / Replace:\n^p (Dấu xuống dòng Enter)\n^w (Khoảng trắng thừa)\n^t (Dấu Tab)',
    example: {
      scenario: 'Văn bản copy từ PDF về bị lỗi giữa mỗi dòng lại có 2-3 dòng trống vô ích, toàn bộ trang bị kéo dài lê thê',
      formulaOrSteps: '1. Nhấn tổ hợp phím Ctrl + H.\n2. Ô Find what: Nhập ^p^p (tìm 2 dấu Enter liền nhau).\n3. Ô Replace with: Nhập ^p (thay bằng 1 dấu Enter duy nhất).\n4. Bấm Replace All liên tục 2-3 lần đến khi hệ thống báo "0 replacements".',
      result: 'Toàn bộ các dòng trống thừa biến mất, văn bản trở nên liền mạch chuẩn mực.',
      explanation: 'Dùng ký tự đại diện ^w trong Find what và gõ 1 dấu cách trong Replace with để xóa sạch toàn bộ khoảng trắng kép.',
    },
    shortcutKeys: ['Ctrl', 'H'],
    proTips: [
      'Xóa toàn bộ số thứ tự thủ công: Dùng tính năng Use Wildcards trong hộp thoại Find & Replace.',
    ],
    practiceDrills: [
      'Ctrl + H (Tìm kiếm & Thay thế)',
      'Find: ^p^p -> Replace: ^p (Xóa dòng trống)',
      'Find: ^w -> Replace: " " (Xóa khoảng trắng thừa)',
    ],
  },
  {
    id: 'word_quick_borders_lines',
    software: 'word',
    level: 'basic',
    category: 'advanced_tricks',
    categoryName: 'Mẹo Kẻ Đường Nhanh',
    title: 'Kẻ Đường Thẳng Thần Tốc Bằng Ký Tự (---, ===, ***, ###)',
    vietnameseTitle: 'Gõ 3 ký tự liên tiếp rồi Enter để tự động tạo đường kẻ viền phân cách tuyệt đẹp',
    shortDescription: 'Cách nhanh nhất thế giới để kẻ đường phân cách trong văn bản mà không cần vẽ Shape hay chèn Table.',
    syntax: 'Gõ 3 ký tự ở đầu dòng mới rồi nhấn Enter:\n--- (Đường kẻ đơn mảnh)\n=== (Đường kẻ đôi song song)\n*** (Đường chấm vuông nét đứt)\n### (Đường 3 nét dày ở giữa)\n~~~ (Đường lượn sóng ziczac)',
    example: {
      scenario: 'Tạo đường gạch chân phân cách dưới Quốc hiệu "Độc lập - Tự do - Hạnh phúc" hoặc ngăn cách các phần nội dung',
      formulaOrSteps: '1. Xuống một dòng trống mới.\n2. Gõ liên tiếp 3 dấu gạch ngang: ---\n3. Nhấn phím Enter.\n4. Word lập tức biến 3 dấu gạch thành một đường kẻ ngang sắc nét kéo dài toàn trang!',
      result: 'Đường kẻ ngang tự động căn chỉnh hoàn hảo theo lề trang giấy.',
      explanation: 'Để xóa đường kẻ này, đặt con trỏ ở dòng phía trên đường kẻ -> Vào tab Home -> Bấm nút Borders -> Chọn "No Border".',
    },
    proTips: [
      'Gõ 3 dấu thăng ### rồi Enter để tạo đường kẻ viền phong cách công văn sang trọng.',
    ],
  },
  {
    id: 'word_compare_documents',
    software: 'word',
    level: 'advanced',
    category: 'advanced_tricks',
    categoryName: 'Bảo Mật & Pháp Lý Hợp Đồng',
    title: 'So Sánh 2 Văn Bản Tự Động (Compare Documents)',
    vietnameseTitle: 'Tự động phát hiện và highlight từng chữ bị sửa đổi giữa 2 phiên bản hợp đồng',
    shortDescription: 'Công cụ tối thượng cho chuyên viên pháp chế, kế toán, văn thư kiểm tra đối chiếu hợp đồng trước khi ký.',
    syntax: 'Tab Review -> Compare -> Compare (Two versions of a document)',
    example: {
      scenario: 'Đối tác gửi lại hợp đồng đã chỉnh sửa. Bạn cần biết chính xác họ đã âm thầm thêm, bớt hoặc đổi số liệu nào',
      formulaOrSteps: '1. Mở Word -> Vào tab Review -> Bấm nút "Compare".\n2. Ô Original document: Chọn file hợp đồng gốc của bạn.\n3. Ô Revised document: Chọn file hợp đồng đối tác vừa gửi lại.\n4. Bấm OK.\n5. Word sẽ mở giao diện 3 khung hình: Highlight màu đỏ mọi từ ngữ bị xóa, màu xanh mọi từ ngữ được thêm mới!',
      result: 'Phát hiện ngay lập tức 100% các điểm thay đổi nhỏ nhất mà mắt thường không thể thấy.',
      explanation: 'Tính năng này triệt tiêu hoàn toàn rủi ro sai lệch điều khoản và giá trị thanh toán trong giao dịch thương mại.',
    },
  },
  {
    id: 'word_watermark_page_numbers',
    software: 'word',
    level: 'intermediate',
    category: 'layout',
    categoryName: 'Bố Cục & Đóng Dấu Bản Quyền',
    title: 'Chèn Chữ Mờ (Watermark) & Đánh Số Trang Kiểu "Trang X/Y"',
    vietnameseTitle: 'Chèn dấu chìm bảo mật "MẬT", "BẢN THẢO" và định dạng số trang chuyên nghiệp',
    shortDescription: 'Giúp tài liệu trông trang trọng, chống sao chép trái phép và hiển thị rõ tổng số trang của văn bản.',
    syntax: 'Watermark: Tab Design -> Watermark -> Custom Watermark\nSố trang X/Y: Tab Insert -> Page Number -> Bottom of Page -> Chọn kiểu "Page X of Y"',
    example: {
      scenario: 'Đóng dấu chìm chữ "TÀI LIỆU NỘI BỘ" in nghiêng mờ ở tất cả các trang và đánh số trang dạng "Trang 3/15"',
      formulaOrSteps: '1. Vào tab Design -> Bấm Watermark -> Chọn "Custom Watermark...".\n2. Tích chọn "Text watermark" -> Tại ô Text gõ "TÀI LIỆU NỘI BỘ" -> Bấm Apply.\n3. Vào tab Insert -> Page Number -> Bottom of Page -> Cuộn tìm mẫu "Page X of Y" (Bold Numbers 2).\n4. Sửa chữ "Page" thành "Trang" và chữ "of" thành "/".',
      result: 'Văn bản hiển thị dấu chìm mờ tinh tế và góc dưới trang có định dạng chuẩn "Trang 3/15".',
      explanation: 'Watermark tự động mờ đi khi in ra nên không làm che khuất chữ nội dung chính.',
    },
    proTips: [
      'Có thể chèn Logo công ty làm Watermark bằng cách chọn "Picture watermark" và chọn file ảnh logo PNG.',
    ],
  },
  {
    id: 'word_keep_with_next',
    software: 'word',
    level: 'intermediate',
    category: 'formatting',
    categoryName: 'Bố Cục & Chống Lỗi Trang',
    title: 'Khắc Phục Tiêu Đề Bị Nhảy Trang Cô Độc (Keep with Next)',
    vietnameseTitle: 'Ngăn chặn hiện tượng tiêu đề nằm ở dòng cuối cùng của trang trước trong khi nội dung lại sang trang sau',
    shortDescription: 'Tuyệt chiêu giúp văn bản chuyên nghiệp: Tiêu đề luôn luôn đi liền với đoạn văn bản đầu tiên của nó.',
    syntax: 'Bôi đen Tiêu đề -> Chuột phải chọn Paragraph -> Tab "Line and Page Breaks" -> Tích chọn "Keep with next"',
    example: {
      scenario: 'Tiêu đề mục "3. KẾT QUẢ KINH DOANH" nằm trơ trọi ở đáy trang 2, trong khi các dòng phân tích lại nằm ở đầu trang 3',
      formulaOrSteps: '1. Đặt con trỏ vào dòng Tiêu đề mục "3. KẾT QUẢ KINH DOANH".\n2. Nhấp chuột phải -> Chọn Paragraph.\n3. Chuyển sang tab "Line and Page Breaks".\n4. Tích chọn vào ô vuông [x] "Keep with next" -> Bấm OK.',
      result: 'Nếu trang hiện tại không đủ chỗ cho cả tiêu đề và nội dung, Word sẽ tự động đẩy cả tiêu đề sang đầu trang tiếp theo một cách thanh lịch!',
      explanation: 'Không bao giờ được dùng phím Enter thủ công để đẩy tiêu đề xuống, vì khi thêm chữ ở trên văn bản sẽ bị xô lệch vị trí.',
    },
    proTips: [
      'Nên cài đặt sẵn thuộc tính "Keep with next" vào trong định dạng của các Style Heading 1, Heading 2, Heading 3.',
    ],
  },
  // =========================================================================
  // EXCEL - ADVANCED & MODERN EXCEL 365
  // =========================================================================
  {
    id: 'excel_xlookup',
    software: 'excel',
    level: 'advanced',
    category: 'lookup',
    categoryName: 'Hàm Tìm Kiếm & Truy Vấn Thế Hệ Mới',
    title: 'Hàm XLOOKUP (Đỉnh Cao Tìm Kiếm)',
    vietnameseTitle: 'Tìm kiếm đa chiều thay thế hoàn toàn VLOOKUP, HLOOKUP và INDEX-MATCH',
    shortDescription: 'Tra cứu giá trị linh hoạt từ phải sang trái, từ dưới lên trên, không sợ chèn cột, tích hợp sẵn xử lý lỗi #N/A.',
    syntax: '=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])',
    parameters: [
      { name: 'lookup_value', description: 'Giá trị cần tìm kiếm (Bắt buộc).' },
      { name: 'lookup_array', description: 'Cột hoặc hàng chứa giá trị cần tìm (Bắt buộc).' },
      { name: 'return_array', description: 'Cột hoặc hàng chứa kết quả cần trả về (Bắt buộc).' },
      { name: 'if_not_found', description: 'Giá trị trả về nếu không tìm thấy (Mặc định không báo #N/A nếu điền) (Tùy chọn).', optional: true },
      { name: 'match_mode', description: '0: Khớp chính xác (mặc định), -1: Khớp giá trị nhỏ hơn gần nhất, 1: Khớp giá trị lớn hơn gần nhất, 2: Ký tự đại diện (*, ?).', optional: true },
    ],
    example: {
      scenario: 'Tra cứu Tên Nhân Viên và Phòng Ban dựa trên Mã NV mà không cần quan tâm vị trí cột',
      inputData: {
        headers: ['Mã NV', 'Họ Và Tên', 'Phòng Ban', 'Lương Cơ Bản'],
        rows: [
          ['NV01', 'Nguyễn Thị Lan', 'Marketing', 15000000],
          ['NV02', 'Trần Văn Hùng', 'Kỹ Thuật', 18000000],
          ['NV03', 'Lê Hoàng Long', 'Kế Toán', 16500000],
        ],
      },
      formulaOrSteps: '=XLOOKUP("NV02", A2:A4, B2:C4, "Không tìm thấy NV")',
      result: '["Trần Văn Hùng", "Kỹ Thuật"]',
      explanation: 'XLOOKUP có thể trả về cùng lúc nhiều cột liên tiếp (B2:C4) mà không cần viết 2 công thức riêng biệt.',
    },
    commonMistakes: [
      'Kích thước của lookup_array và return_array không bằng nhau (ví dụ: A2:A10 và B2:B20) sẽ gây lỗi #VALUE!.',
    ],
    proTips: [
      'Tìm kiếm từ dưới lên trên (Last match): Đặt search_mode = -1 để lấy lần giao dịch mới nhất trong sổ cái!',
    ],
    practiceDrills: [
      '=XLOOKUP(A2, D2:D50, E2:E50, "Không thấy")',
      '=XLOOKUP(F5, $B$2:$B$100, $C$2:$D$100)',
      '=XLOOKUP(H2, A2:A20, C2:C20, 0, 0, -1)',
    ],
  },
  {
    id: 'excel_dynamic_filter_unique',
    software: 'excel',
    level: 'advanced',
    category: 'data_analysis',
    categoryName: 'Hàm Mảng Động (Dynamic Array)',
    title: 'Hàm FILTER & UNIQUE (Trích Xuất Báo Cáo Tự Động)',
    vietnameseTitle: 'Lọc tự động danh sách thỏa điều kiện & Lấy danh sách không trùng lặp (No Duplicates)',
    shortDescription: 'Tự động tạo bảng báo cáo trực tiếp không cần bấm nút Advanced Filter hay viết code VBA phức tạp.',
    syntax: '=FILTER(array, include, [if_empty])\n=UNIQUE(array, [by_col], [exactly_once])',
    parameters: [
      { name: 'array', description: 'Vùng dữ liệu nguồn cần lọc hoặc lấy duy nhất (Bắt buộc).' },
      { name: 'include', description: 'Điều kiện lọc dạng biểu thức logic (ví dụ: C2:C10="Hà Nội") (Bắt buộc cho FILTER).' },
      { name: 'if_empty', description: 'Giá trị hiển thị nếu không có dòng nào thỏa mãn điều kiện (Tùy chọn).', optional: true },
    ],
    example: {
      scenario: 'Trích xuất toàn bộ đơn hàng của Chi nhánh "Đà Nẵng" sang 1 bảng báo cáo riêng biệt',
      inputData: {
        headers: ['Mã Đơn', 'Khách Hàng', 'Khu Vực', 'Doanh Thu'],
        rows: [
          ['DH01', 'Cty Ánh Dương', 'Hà Nội', 50000000],
          ['DH02', 'Cty Biển Xanh', 'Đà Nẵng', 32000000],
          ['DH03', 'Đại Lý Nam Việt', 'TP.HCM', 45000000],
          ['DH04', 'Cty Miền Trung', 'Đà Nẵng', 28000000],
        ],
      },
      formulaOrSteps: '=FILTER(A2:D5, C2:C5="Đà Nẵng", "Không có đơn")',
      result: 'Hiển thị tự động 2 dòng đơn hàng DH02 và DH04',
      explanation: 'Khi dữ liệu nguồn có thêm đơn mới thuộc Đà Nẵng, bảng kết quả FILTER sẽ tự động cập nhật ngay lập tức.',
    },
    proTips: [
      'Kết hợp SORT với FILTER: =SORT(FILTER(A2:D100, D2:D100>50000000), 4, -1) để vừa lọc vừa sắp xếp doanh thu giảm dần!',
    ],
    practiceDrills: [
      '=UNIQUE(B2:B100)',
      '=FILTER(A2:D50, C2:C50="Đã giao")',
      '=SORT(UNIQUE(A2:A50))',
    ],
  },
  {
    id: 'excel_textjoin_flashfill',
    software: 'excel',
    level: 'intermediate',
    category: 'text_date',
    categoryName: 'Xử Lý Chuỗi Văn Bản Nâng Cao',
    title: 'Hàm TEXTJOIN & Tuyệt Kỹ Flash Fill (Ctrl + E)',
    vietnameseTitle: 'Ghép nối chuỗi dữ liệu với dấu ngăn cách và Tách chuỗi thần tốc với AI Flash Fill',
    shortDescription: 'Ghép hàng chục ô có dấu phẩy ngăn cách và tự động nhận diện mẫu tách họ tên, mã số chỉ trong 1 giây.',
    syntax: '=TEXTJOIN(delimiter, ignore_empty, text1, [text2], ...)\nFlash Fill: Phím tắt Ctrl + E',
    parameters: [
      { name: 'delimiter', description: 'Ký tự phân cách giữa các đoạn text (ví dụ: ", " hoặc " - ") (Bắt buộc).' },
      { name: 'ignore_empty', description: 'TRUE: Bỏ qua ô trống, FALSE: Giữ lại cả ô trống (Bắt buộc).' },
      { name: 'text1', description: 'Vùng chứa các chuỗi văn bản cần ghép lại (Bắt buộc).' },
    ],
    example: {
      scenario: 'Ghép danh sách email các thành viên trong dự án thành 1 chuỗi để dán vào ô gửi thư (To / CC)',
      inputData: {
        headers: ['Họ Tên', 'Email'],
        rows: [
          ['An', 'an@company.com'],
          ['Bình', 'binh@company.com'],
          ['Cường', 'cuong@company.com'],
        ],
      },
      formulaOrSteps: '=TEXTJOIN("; ", TRUE, B2:B4)',
      result: '"an@company.com; binh@company.com; cuong@company.com"',
      explanation: 'TEXTJOIN cho phép gom cả dải ô B2:B4 thành 1 chuỗi hoàn chỉnh kèm dấu chấm phẩy phân cách.',
    },
    shortcutKeys: ['Ctrl', 'E'],
    proTips: [
      'Tuyệt chiêu Flash Fill: Gõ mẫu Họ và Tên đệm vào cột kế bên ô "Nguyễn Văn An" -> Nhấn Ctrl + E -> Excel tự động điền toàn bộ hàng ngàn dòng còn lại!',
    ],
    practiceDrills: [
      '=TEXTJOIN(", ", TRUE, A2:A20)',
      '=TEXTJOIN(" - ", TRUE, B2:D2)',
    ],
  },
  {
    id: 'excel_highlight_row_conditional',
    software: 'excel',
    level: 'intermediate',
    category: 'formatting',
    categoryName: 'Định Dạng Có Điều Kiện',
    title: 'Tô Màu Toàn Bộ Dòng Tự Động (Conditional Formatting By Formula)',
    vietnameseTitle: 'Đổi màu cả hàng khi thỏa mãn điều kiện trạng thái (Ví dụ: Đơn Đã Hủy / Quá Hạn)',
    shortDescription: 'Giúp báo cáo trực quan, phát hiện ngay các hợp đồng rủi ro, dự án chậm tiến độ bằng màu sắc nổi bật.',
    syntax: 'Bôi đen cả bảng -> Home -> Conditional Formatting -> New Rule -> "Use a formula to determine which cells to format" -> Công thức: =$E2="Quá hạn"',
    example: {
      scenario: 'Tô màu nền đỏ nhạt cho toàn bộ dòng của các đơn hàng có trạng thái "Đã Hủy" ở cột D',
      formulaOrSteps: '1. Bôi đen toàn bộ bảng từ ô A2 đến F50.\n2. Vào tab Home -> Conditional Formatting -> New Rule.\n3. Chọn mục "Use a formula to determine which cells to format".\n4. Nhập công thức: =$D2="Đã Hủy" (chú ý có dấu $ trước chữ D để khóa cột, không khóa dòng).\n5. Bấm Format -> Chọn Fill màu đỏ nhạt -> Bấm OK.',
      result: 'Mỗi khi cột D chuyển sang "Đã Hủy", cả dòng từ A đến F lập tức đổi sang màu đỏ nhạt.',
      explanation: 'Dấu $ trước tên cột ($D2) đảm bảo Excel luôn kiểm tra giá trị ở cột D khi quyết định tô màu cho các ô A2, B2, C2...',
    },
    proTips: [
      'Công thức so sánh ngày quá hạn: =$F2<TODAY() sẽ tự động highlight những công việc có deadline đã trôi qua!',
    ],
  },
  // =========================================================================
  // WORD - PRO SKILLS & ADVANCED TRICKS
  // =========================================================================
  {
    id: 'word_non_breaking_space_hyphen',
    software: 'word',
    level: 'intermediate',
    category: 'formatting',
    categoryName: 'Quy Chuẩn Soạn Thảo Văn Bản Chuẩn',
    title: 'Dấu Cách Không Ngắt Dòng (Non-Breaking Space: Ctrl + Shift + Space)',
    vietnameseTitle: 'Chống ngắt dòng xấu xí giữa số và đơn vị ("10.000 VNĐ", "15 kg", ngày "30 tháng 4")',
    shortDescription: 'Giữ cho số và đơn vị đo lường hoặc ngày tháng luôn nằm cùng trên 1 dòng, không bị rớt đơn vị xuống dòng sau.',
    syntax: 'Tổ hợp phím: Ctrl + Shift + Space (Khoảng trắng không ngắt) | Ctrl + Shift + - (Dấu gạch nối không ngắt)',
    example: {
      scenario: 'Từ "15.000" nằm ở cuối dòng trên và chữ "USD" bị rớt xuống đầu dòng dưới gây mất thẩm mỹ',
      formulaOrSteps: '1. Xóa khoảng trắng thông thường giữa số "15.000" và chữ "USD".\n2. Nhấn tổ hợp phím Ctrl + Shift + Space.\n3. Word sẽ chèn 1 khoảng trắng đặc biệt (Non-Breaking Space).',
      result: 'Cả cụm "15.000 USD" sẽ tự động được giữ liền khối, nếu không đủ chỗ ở cuối dòng thì cả cụm sẽ cùng xuống dòng!',
      explanation: 'Đây là tiêu chuẩn bắt buộc trong chế bản sách báo, tạp chí và văn bản hợp đồng kinh tế chuyên nghiệp.',
    },
    shortcutKeys: ['Ctrl', 'Shift', 'Space'],
    proTips: [
      'Áp dụng cho tên quy chuẩn: "Nghị định 30/2020/NĐ-CP" dùng Ctrl + Shift + - (Non-breaking hyphen) để số hiệu không bao giờ bị đứt đôi.',
    ],
  },
  {
    id: 'word_convert_text_table',
    software: 'word',
    level: 'intermediate',
    category: 'layout',
    categoryName: 'Chuyển Đổi Dữ Liệu Bảng Biểu',
    title: 'Chuyển Văn Bản Thô Thành Bảng Trong 2 Giây (Convert Text to Table)',
    vietnameseTitle: 'Biến danh sách văn bản phân cách bằng Tab/Phẩy thành Bảng chuẩn có kẻ ô ngay lập tức',
    shortDescription: 'Không cần tạo bảng rồi copy từng ô thủ công, chuyển toàn bộ văn bản danh sách thành Table chuẩn.',
    syntax: 'Bôi đen đoạn văn bản -> Tab Insert -> Table -> Convert Text to Table... -> Chọn "Tabs" hoặc "Commas"',
    example: {
      scenario: 'Bạn có danh sách 50 người dạng "Nguyễn Văn An, 0901234567, Hà Nội" và cần tạo thành bảng 3 cột',
      formulaOrSteps: '1. Bôi đen toàn bộ 50 dòng danh sách.\n2. Vào tab Insert -> Bấm vào mũi tên dưới nút Table.\n3. Chọn dòng "Convert Text to Table...".\n4. Tại mục "Separate text at", chọn "Commas" (hoặc ký tự phân cách của bạn).\n5. Bấm OK.',
      result: 'Toàn bộ 50 dòng lập tức biến thành bảng kẻ ô 3 cột hoàn chỉnh chỉ trong 1 tích tắc.',
      explanation: 'Ngược lại, bạn cũng có thể chuyển Bảng thành chữ thông thường bằng nút Table Tools Layout -> Convert to Text.',
    },
    proTips: [
      'Phím tắt căn chỉnh nhanh bảng: Bôi đen bảng -> Chuột phải -> AutoFit -> AutoFit to Window để bảng vừa khít độ rộng trang.',
    ],
  },
  {
    id: 'word_split_window_navigation_pane',
    software: 'word',
    level: 'advanced',
    category: 'advanced_tricks',
    categoryName: 'Quản Lý Tài Liệu Dài & Đồ Án',
    title: 'Chia Đôi Màn Hình (Split Window) & Thanh Điều Hướng Đồ Án',
    vietnameseTitle: 'Vừa xem tài liệu tham khảo ở đầu trang vừa viết kết luận ở cuối trang trên cùng 1 file',
    shortDescription: 'Tuyệt chiêu viết báo cáo 100 trang: Không cần cuộn chuột liên tục, kéo thả sắp xếp lại các chương mục dễ dàng.',
    syntax: 'Chia màn hình: Tab View -> Split (Phím tắt: Alt + Ctrl + S)\nĐiều hướng kéo thả: Tab View -> Tích chọn [x] Navigation Pane (Phím tắt: Ctrl + F)',
    example: {
      scenario: 'Cần đối chiếu số liệu ở bảng tổng kết trang 12 để viết phần phân tích chi tiết ở trang 85',
      formulaOrSteps: '1. Nhấn tổ hợp phím Alt + Ctrl + S (hoặc vào tab View -> bấm nút Split).\n2. Màn hình Word chia làm 2 nửa trên và dưới độc lập.\n3. Nửa trên cuộn đến bảng số liệu trang 12.\n4. Nửa dưới cuộn đến trang 85 và gõ bài phân tích.\n5. Khi xong, bấm Remove Split để trở lại bình thường.',
      result: 'Soạn thảo chính xác tuyệt đối mà không cần mở 2 cửa sổ file rời hay cuộn chuột mỏi tay.',
      explanation: 'Trong thanh Navigation Pane (tab Headings), bạn có thể dùng chuột kéo thả cả Chương 2 lên trước Chương 1 cực kỳ mượt mà!',
    },
    shortcutKeys: ['Alt', 'Ctrl', 'S'],
    proTips: [
      'Phím tắt quay lại vị trí sửa cuối cùng: Nhấn Shift + F5 để nhảy con trỏ ngay về 3 vị trí bạn vừa gõ văn bản trước đó!',
    ],
  },
  {
    id: 'word_spike_harvest',
    software: 'word',
    level: 'advanced',
    category: 'advanced_tricks',
    categoryName: 'Thủ Thuật Siêu Tốc (Hidden Secrets)',
    title: 'Tuyệt Chiêu Cắt Gom Nhiều Đoạn Rải Rác (The Spike Feature)',
    vietnameseTitle: 'Gom hàng chục đoạn văn, hình ảnh ở các trang khác nhau và dán tất cả vào trang mới cùng một lúc',
    shortDescription: 'Tính năng "Cây Đinh Ghim" bí mật của Word: Gom dần nhiều đoạn rời rạc rồi xuất ra toàn bộ theo thứ tự chuẩn.',
    syntax: 'Gom từng đoạn: Bôi đen -> Nhấn Ctrl + F3\nDán toàn bộ ra: Đặt con trỏ vị trí mới -> Nhấn Ctrl + Shift + F3',
    example: {
      scenario: 'Bạn cần trích xuất 10 điều khoản quan trọng nằm rải rác từ trang 5 đến trang 90 của hợp đồng vào 1 trang tóm tắt',
      formulaOrSteps: '1. Bôi đen điều khoản 1 ở trang 5 -> Nhấn Ctrl + F3.\n2. Cuộn đến trang 20, bôi đen điều khoản 2 -> Nhấn Ctrl + F3.\n3. Tiếp tục bôi đen các điều khoản tiếp theo và nhấn Ctrl + F3.\n4. Mở trang tóm tắt mới -> Nhấn Ctrl + Shift + F3.',
      result: 'Tất cả 10 điều khoản được dán ra liên tiếp hoàn hảo theo đúng trình tự bạn đã ghim gom trước đó!',
      explanation: 'Spike là bộ nhớ đệm đặc biệt của Word giúp tích lũy nội dung thay vì ghi đè lên clipboard như lệnh Copy/Cut thông thường.',
    },
    shortcutKeys: ['Ctrl', 'F3'],
    proTips: [
      'Nhấn Ctrl + Shift + F3 sẽ vừa dán vừa xóa sạch bộ nhớ Spike để bạn sẵn sàng cho lần ghim gom mới.',
    ],
  },
];

export const OFFICE_SHORTCUTS_COLLECTION = [
  // ==================== EXCEL SHORTCUTS ====================
  // Công thức & Tính toán
  { software: 'excel' as const, keys: 'F4', desc: 'Cố định dòng/cột tuyệt đối ($A$1) khi viết công thức hoặc lặp lại thao tác trước', category: 'Công thức' },
  { software: 'excel' as const, keys: 'Alt + =', desc: 'Tự động điền hàm tính tổng AutoSum nhanh cho cột/hàng', category: 'Tính toán' },
  { software: 'excel' as const, keys: 'Ctrl + ` (Dấu ngã)', desc: 'Bật chế độ hiển thị toàn bộ công thức trên bảng tính thay vì kết quả', category: 'Kiểm tra' },
  { software: 'excel' as const, keys: 'F9', desc: 'Tính toán thử nghiệm giá trị của 1 đoạn công thức đang bôi đen', category: 'Công thức' },
  { software: 'excel' as const, keys: 'Shift + F3', desc: 'Mở hộp thoại chèn hàm (Insert Function Wizard)', category: 'Công thức' },

  // Thao tác & Xử lý dữ liệu
  { software: 'excel' as const, keys: 'Ctrl + E', desc: 'Kích hoạt tính năng Flash Fill AI tự động tách/ghép dữ liệu trong 1 giây', category: 'Tự động hóa' },
  { software: 'excel' as const, keys: 'Ctrl + T', desc: 'Chuyển đổi vùng dữ liệu thành Bảng thông minh (Excel Table) tự co giãn', category: 'Bảng biểu' },
  { software: 'excel' as const, keys: 'Ctrl + Shift + L', desc: 'Bật / Tắt bộ lọc dữ liệu tự động (Filter) tức thì', category: 'Dữ liệu' },
  { software: 'excel' as const, keys: 'Alt + ; (Chấm phẩy)', desc: 'Chỉ chọn các ô đang hiển thị (Visible cells only), bỏ qua hàng bị ẩn/lọc', category: 'Chọn vùng' },
  { software: 'excel' as const, keys: 'Alt + H + O + I', desc: 'Tự động căn chỉnh độ rộng các cột vừa khít với nội dung dài nhất', category: 'Định dạng' },
  { software: 'excel' as const, keys: 'F5 / Ctrl + G -> Alt + S', desc: 'Mở Go To Special để chọn nhanh tất cả ô trống (Blanks) hoặc ô chứa công thức', category: 'Chọn vùng' },
  { software: 'excel' as const, keys: 'Alt + Down Arrow', desc: 'Mở menu xổ xuống của bộ lọc Filter hoặc danh sách Data Validation', category: 'Dữ liệu' },
  { software: 'excel' as const, keys: 'Ctrl + D', desc: 'Sao chép dữ liệu hoặc công thức từ ô ngay phía trên xuống (Fill Down)', category: 'Thao tác' },
  { software: 'excel' as const, keys: 'Ctrl + R', desc: 'Sao chép dữ liệu hoặc công thức từ ô bên trái sang (Fill Right)', category: 'Thao tác' },
  { software: 'excel' as const, keys: 'Alt + Enter', desc: 'Xuống dòng bên trong 1 ô duy nhất', category: 'Soạn thảo' },
  { software: 'excel' as const, keys: 'F2', desc: 'Chỉnh sửa trực tiếp nội dung ô đang chọn', category: 'Thao tác' },
  { software: 'excel' as const, keys: 'F12', desc: 'Mở trực tiếp cửa sổ Lưu file dưới tên mới (Save As)', category: 'Tệp' },

  // Định dạng & Chèn ngày giờ
  { software: 'excel' as const, keys: 'Ctrl + 1', desc: 'Mở cửa sổ Format Cells chuyên sâu (Định dạng tiền tệ, ngày, số)', category: 'Định dạng' },
  { software: 'excel' as const, keys: 'Ctrl + Shift + ~', desc: 'Xóa định dạng số, đưa về dạng General mặc định', category: 'Định dạng' },
  { software: 'excel' as const, keys: 'Ctrl + Shift + 1', desc: 'Định dạng số có dấu phân cách hàng nghìn và 2 số thập phân', category: 'Định dạng' },
  { software: 'excel' as const, keys: 'Ctrl + Shift + 4 ($)', desc: 'Định dạng số thành tiền tệ nhanh', category: 'Định dạng' },
  { software: 'excel' as const, keys: 'Ctrl + Shift + 5 (%)', desc: 'Định dạng số thành phần trăm (%)', category: 'Định dạng' },
  { software: 'excel' as const, keys: 'Ctrl + ; (Chấm phẩy)', desc: 'Chèn ngày hiện tại (Today) dưới dạng giá trị tĩnh', category: 'Ngày giờ' },
  { software: 'excel' as const, keys: 'Ctrl + Shift + : (Hai chấm)', desc: 'Chèn giờ hiện tại (Current Time) dưới dạng giá trị tĩnh', category: 'Ngày giờ' },

  // Điều hướng & Chọn vùng
  { software: 'excel' as const, keys: 'Ctrl + Arrow Keys', desc: 'Nhảy nhanh đến ô cuối cùng có dữ liệu của bảng tính', category: 'Điều hướng' },
  { software: 'excel' as const, keys: 'Ctrl + Shift + Arrow', desc: 'Bôi đen toàn bộ vùng dữ liệu đến dòng/cột cuối cùng', category: 'Chọn vùng' },
  { software: 'excel' as const, keys: 'Ctrl + Space', desc: 'Chọn toàn bộ cột dữ liệu hiện tại', category: 'Chọn vùng' },
  { software: 'excel' as const, keys: 'Shift + Space', desc: 'Chọn toàn bộ hàng dữ liệu hiện tại', category: 'Chọn vùng' },
  { software: 'excel' as const, keys: 'Ctrl + Shift + + (Cộng)', desc: 'Chèn thêm dòng hoặc cột mới', category: 'Chèn/Xóa' },
  { software: 'excel' as const, keys: 'Ctrl + - (Trừ)', desc: 'Xóa dòng hoặc cột đang chọn', category: 'Chèn/Xóa' },
  { software: 'excel' as const, keys: 'Ctrl + 0 / Ctrl + 9', desc: 'Ẩn cột đang chọn (Ctrl + 0) hoặc Ẩn hàng đang chọn (Ctrl + 9)', category: 'Hiển thị' },
  { software: 'excel' as const, keys: 'Ctrl + PageDown / PageUp', desc: 'Chuyển đổi nhanh qua lại giữa các Sheet trong bảng tính', category: 'Điều hướng' },

  // ==================== WORD SHORTCUTS ====================
  // Định dạng đoạn văn & Căn lề
  { software: 'word' as const, keys: 'Ctrl + J', desc: 'Căn đều 2 bên đoạn văn bản chuẩn văn bản hành chính', category: 'Căn lề' },
  { software: 'word' as const, keys: 'Ctrl + E', desc: 'Căn giữa tiêu đề hoặc hình ảnh', category: 'Căn lề' },
  { software: 'word' as const, keys: 'Ctrl + L / Ctrl + R', desc: 'Căn lề trái (Ctrl + L) hoặc Căn lề phải (Ctrl + R)', category: 'Căn lề' },
  { software: 'word' as const, keys: 'Ctrl + 1 / Ctrl + 2 / Ctrl + 5', desc: 'Giãn dòng đơn 1.0 (Ctrl + 1), giãn dòng đôi 2.0 (Ctrl + 2), giãn dòng 1.5 (Ctrl + 5)', category: 'Giãn dòng' },
  { software: 'word' as const, keys: 'Ctrl + 0', desc: 'Thêm hoặc bớt khoảng cách 12pt phía trước đoạn văn bản', category: 'Khoảng cách' },
  { software: 'word' as const, keys: 'Ctrl + M / Ctrl + Shift + M', desc: 'Tăng lề thụt đầu dòng (Indent) hoặc giảm thụt lề', category: 'Thụt lề' },

  // Xử lý font & Sao chép định dạng
  { software: 'word' as const, keys: 'Ctrl + Shift + C / V', desc: 'Sao chép và dán nhanh định dạng (Format Painter)', category: 'Định dạng' },
  { software: 'word' as const, keys: 'Shift + F3', desc: 'Đổi chữ HOA toàn bộ / chữ thường / Viết Hoa Chữ Đầu Từ', category: 'Văn bản' },
  { software: 'word' as const, keys: 'Ctrl + [ / Ctrl + ]', desc: 'Tăng hoặc giảm cỡ chữ chính xác từng 1 point (pt)', category: 'Font chữ' },
  { software: 'word' as const, keys: 'Ctrl + Shift + > / <', desc: 'Tăng hoặc giảm cỡ chữ theo các nấc chuẩn (12->14->16...)', category: 'Font chữ' },
  { software: 'word' as const, keys: 'Ctrl + Space', desc: 'Xóa sạch mọi định dạng in đậm, màu sắc, trở về font mặc định của Style', category: 'Định dạng' },
  { software: 'word' as const, keys: 'Ctrl + Shift + N', desc: 'Áp dụng nhanh Style Normal (Văn bản thường)', category: 'Định dạng' },
  { software: 'word' as const, keys: 'Ctrl + Alt + 1 / 2 / 3', desc: 'Gán nhanh cấp độ tiêu đề Heading 1, Heading 2, Heading 3 để tạo mục lục', category: 'Mục lục' },
  { software: 'word' as const, keys: 'Ctrl + D', desc: 'Mở hộp thoại định dạng Font chữ nâng cao', category: 'Font chữ' },

  // Tiện ích & Soạn thảo nhanh & Thủ thuật cao cấp
  { software: 'word' as const, keys: 'Ctrl + Shift + Space', desc: 'Chèn khoảng trắng không ngắt dòng (Non-breaking space) để giữ liền số và đơn vị', category: 'Quy chuẩn' },
  { software: 'word' as const, keys: 'Ctrl + Shift + - (Gạch)', desc: 'Chèn dấu gạch nối không ngắt dòng (Non-breaking hyphen)', category: 'Quy chuẩn' },
  { software: 'word' as const, keys: 'Alt + Ctrl + S', desc: 'Chia đôi cửa sổ soạn thảo (Split Window) để xem và đối chiếu 2 trang cùng lúc', category: 'Bố cục' },
  { software: 'word' as const, keys: 'Shift + F5', desc: 'Nhảy con trỏ trở lại vị trí sửa đổi gần nhất trước đó (lưu 3 vị trí)', category: 'Điều hướng' },
  { software: 'word' as const, keys: 'Ctrl + F3 / Ctrl + Shift + F3', desc: 'Tính năng Spike: Cắt gom nhiều đoạn rải rác (Ctrl + F3) và dán tất cả ra (Ctrl + Shift + F3)', category: 'Thủ thuật' },
  { software: 'word' as const, keys: 'Ctrl + Enter', desc: 'Ngắt sang trang mới ngay lập tức (Page Break)', category: 'Bố cục' },
  { software: 'word' as const, keys: 'Shift + Enter', desc: 'Xuống dòng nhưng vẫn giữ nguyên trong cùng 1 đoạn văn bản (Line Break)', category: 'Soạn thảo' },
  { software: 'word' as const, keys: 'F4', desc: 'Lặp lại thao tác định dạng hoặc chỉnh sửa vừa thực hiện', category: 'Tiện ích' },
  { software: 'word' as const, keys: 'Ctrl + H', desc: 'Mở hộp thoại Tìm kiếm và Thay thế hàng loạt (Find & Replace)', category: 'Tìm kiếm' },
  { software: 'word' as const, keys: 'Ctrl + F', desc: 'Mở thanh điều hướng tìm kiếm từ khóa trong tài liệu (Navigation)', category: 'Tìm kiếm' },
  { software: 'word' as const, keys: 'Ctrl + K', desc: 'Chèn liên kết Hyperlink vào từ hoặc cụm từ', category: 'Chèn' },
  { software: 'word' as const, keys: 'Alt + Shift + D', desc: 'Tự động chèn ngày tháng hiện tại vào văn bản', category: 'Chèn' },
  { software: 'word' as const, keys: 'Alt + Shift + T', desc: 'Tự động chèn giờ hiện tại vào văn bản', category: 'Chèn' },
  { software: 'word' as const, keys: 'Ctrl + Backspace / Delete', desc: 'Xóa nguyên một từ phía trước (Backspace) hoặc phía sau (Delete)', category: 'Soạn thảo' },
  { software: 'word' as const, keys: 'F12', desc: 'Mở trực tiếp cửa sổ Lưu file dưới tên mới (Save As)', category: 'Tệp' },
];

