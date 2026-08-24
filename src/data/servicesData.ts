export interface ServiceItem {
  id: 'coding' | 'office' | 'digital_transformation' | 'automation_data';
  icon: string;
  badgeVi: string;
  badgeEn: string;
  titleVi: string;
  titleEn: string;
  shortDescVi: string;
  shortDescEn: string;
  fullDescVi: string;
  fullDescEn: string;
  targetAudienceVi: string[];
  targetAudienceEn: string[];
  highlightsVi: string[];
  highlightsEn: string[];
  syllabusOrDeliverablesVi: {
    title: string;
    description: string;
    tags: string[];
  }[];
  syllabusOrDeliverablesEn: {
    title: string;
    description: string;
    tags: string[];
  }[];
  techStack: string[];
  durationOrTimelineVi: string;
  durationOrTimelineEn: string;
  formatVi: string;
  formatEn: string;
}

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'coding',
    icon: 'Code2',
    badgeVi: 'Đào Tạo Thực Chiến',
    badgeEn: 'Practical Training',
    titleVi: 'Đào Tạo & Dạy Kèm Lập Trình Chuyên Sâu',
    titleEn: 'Practical Coding & Software Engineering Courses',
    shortDescVi: 'Lộ trình từ mất gốc đến làm chủ ngôn ngữ lập trình, tư duy thuật toán, xây dựng ứng dụng Web, App và AI thực tế.',
    shortDescEn: 'Zero-to-hero roadmap mastering programming languages, algorithmic thinking, and building real-world Web, App & AI projects.',
    fullDescVi: 'Chương trình đào tạo lập trình thực chiến 1 kèm 1 hoặc theo nhóm nhỏ, tập trung rèn luyện tư duy logic, cấu trúc dữ liệu và giải quyết bài toán thực tế. Học viên được trực tiếp tham gia xây dựng các dự án phần mềm hoàn chỉnh, code sạch chuẩn Clean Code và sẵn sàng đi làm hoặc thi tuyển.',
    fullDescEn: 'Hands-on 1-on-1 and small group coding mentorship emphasizing logical thinking, data structures, and real-world problem solving. Students build end-to-end software applications with clean code standards.',
    targetAudienceVi: [
      'Học sinh, sinh viên muốn xây dựng nền tảng thuật toán, lập trình thi HSG hoặc chuẩn bị du học',
      'Người đi làm muốn chuyển ngành sang IT hoặc tự động hóa công việc bằng code',
      'Lập trình viên muốn nâng cao kỹ năng Fullstack (React, Node.js, Python, TypeScript)',
      'Chủ doanh nghiệp, quản lý muốn hiểu bản chất kỹ thuật để quản lý đội ngũ công nghệ',
    ],
    targetAudienceEn: [
      'Students building algorithmic foundations or preparing for competitions & study abroad',
      'Career switchers moving into IT or automating daily workflows with code',
      'Developers upgrading to Modern Fullstack (React, Node.js, Python, TypeScript)',
      'Entrepreneurs and managers needing technical depth to lead tech teams',
    ],
    highlightsVi: [
      'Học 1 kèm 1 hoặc nhóm nhỏ tối đa 3-5 học viên, mentor theo sát 24/7',
      '100% thời lượng thực hành trên dự án thực tế (Web App, Bot tự động, API Backend)',
      'Cam kết chất lượng: Hỗ trợ review code, sửa lỗi và tư vấn định hướng trọn đời',
      'Cung cấp kho bài tập thuật toán, tài liệu và source code mẫu chuẩn doanh nghiệp',
    ],
    highlightsEn: [
      '1-on-1 or small classes (3-5 students max) with 24/7 mentor support',
      '100% project-based learning (Web Apps, Automation Bots, Backend APIs)',
      'Quality commitment: Code reviews, debugging guidance, and career consulting',
      'Rich enterprise code repos, algorithm challenges, and standard documentation',
    ],
    syllabusOrDeliverablesVi: [
      {
        title: 'Module 1: Tư duy Logic & Nền tảng Ngôn ngữ (Python / JavaScript / C++)',
        description: 'Làm chủ cú pháp, cấu trúc điều kiện, vòng lặp, hàm, xử lý chuỗi, cấu trúc dữ liệu cơ bản và tư duy giải thuật.',
        tags: ['Cú pháp chuẩn', 'Tư duy thuật toán', 'Cấu trúc dữ liệu', 'Clean Code'],
      },
      {
        title: 'Module 2: Lập trình Hướng đối tượng (OOP) & Xây dựng Cấu trúc Ứng dụng',
        description: 'Thiết kế lớp, kế thừa, đa hình, đóng gói, xử lý ngoại lệ, đọc/ghi file và tối ưu bộ nhớ.',
        tags: ['OOP Mastery', 'Design Patterns', 'File I/O', 'Error Handling'],
      },
      {
        title: 'Module 3: Phát triển Web Fullstack (Frontend React/Next.js & Backend Node/Python)',
        description: 'Xây dựng giao diện tương tác cao, RESTful APIs, kết nối cơ sở dữ liệu SQL/NoSQL, xác thực phân quyền JWT và triển khai Cloud.',
        tags: ['React', 'TypeScript', 'Node.js', 'PostgreSQL / MongoDB', 'Cloud Deploy'],
      },
      {
        title: 'Module 4: Ứng dụng AI & Tự động hóa với Python',
        description: 'Thu thập dữ liệu web (Scraping), xử lý dữ liệu Pandas/NumPy, tích hợp mô hình Gemini AI/OpenAI vào sản phẩm thực tế.',
        tags: ['Python Automation', 'Data Scraping', 'Gemini AI Integration', 'FastAPI'],
      },
    ],
    syllabusOrDeliverablesEn: [
      {
        title: 'Module 1: Logical Thinking & Core Fundamentals (Python / JavaScript / C++)',
        description: 'Master syntax, conditional logic, loops, functions, data structures, and algorithmic reasoning.',
        tags: ['Clean Syntax', 'Algorithms', 'Data Structures', 'Clean Code'],
      },
      {
        title: 'Module 2: Object-Oriented Programming (OOP) & Architecture',
        description: 'Class design, inheritance, polymorphism, encapsulation, exception handling, and file processing.',
        tags: ['OOP Mastery', 'Design Patterns', 'File I/O', 'Error Handling'],
      },
      {
        title: 'Module 3: Fullstack Web Development (React / Next.js & Node / Python Backend)',
        description: 'Interactive UI, RESTful APIs, SQL/NoSQL database modeling, JWT authentication, and cloud deployment.',
        tags: ['React', 'TypeScript', 'Node.js', 'PostgreSQL / MongoDB', 'Cloud Deploy'],
      },
      {
        title: 'Module 4: AI & Python Script Automation',
        description: 'Web scraping, data manipulation with Pandas, integrating Gemini AI / OpenAI into real software products.',
        tags: ['Python Automation', 'Data Scraping', 'Gemini AI Integration', 'FastAPI'],
      },
    ],
    techStack: ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Git/GitHub', 'Docker', 'Gemini AI'],
    durationOrTimelineVi: 'Linh hoạt theo mục tiêu (1 - 3 tháng / khóa học hoặc theo buổi kèm)',
    durationOrTimelineEn: 'Flexible (1 - 3 months per program or customized 1-on-1 sessions)',
    formatVi: 'Học Online qua Zoom/Google Meet kèm bài tập tương tác hoặc Offline theo thỏa thuận',
    formatEn: 'Live Online via Zoom/Google Meet with interactive labs or In-person',
  },
  {
    id: 'office',
    icon: 'FileSpreadsheet',
    badgeVi: 'Nâng Cao Năng Suất',
    badgeEn: 'Productivity Booster',
    titleVi: 'Tin Học Văn Phòng & Phân Tích Dữ Liệu Excel Pro',
    titleEn: 'Advanced Office Productivity & Excel Data Mastery',
    shortDescVi: 'Chuẩn hóa kỹ năng soạn thảo Word hành chính, làm chủ hơn 50 hàm Excel nâng cao, Dashboard trực quan hóa dữ liệu và Google Workspace.',
    shortDescEn: 'Master administrative Word layout, 50+ advanced Excel formulas, dynamic visual dashboards, and Google Workspace collaboration.',
    fullDescVi: 'Đào tạo kỹ năng tin học văn phòng thực chiến dành riêng cho nhân viên công sở, kế toán, nhân sự, kinh doanh và sinh viên. Khóa học giúp tối ưu 80% thời gian xử lý văn bản, lập báo cáo tài chính, quản lý dữ liệu bán hàng và thiết kế slide thuyết trình ấn tượng.',
    fullDescEn: 'Comprehensive office productivity training tailored for corporate staff, accountants, HR, sales, and students. Cut 80% repetitive manual formatting, build financial models, and create compelling presentations.',
    targetAudienceVi: [
      'Nhân viên văn phòng, kế toán, chuyên viên nhân sự, chuyên viên kinh doanh',
      'Sinh viên sắp ra trường cần trang bị kỹ năng tin học ứng dụng và chứng chỉ MOS/IC3',
      'Cán bộ, công chức cần chuẩn hóa thể thức văn bản hành chính theo Nghị định 30/2020/NĐ-CP',
      'Quản lý cần kỹ năng phân tích số liệu, đọc biểu đồ và ra quyết định kinh doanh',
    ],
    targetAudienceEn: [
      'Office professionals, accountants, HR specialists, and sales managers',
      'Graduating students preparing for career readiness and MOS / IC3 certifications',
      'Administrative officers standardizing official government and corporate documents',
      'Managers requiring rapid data analytics, chart synthesis, and strategic reporting',
    ],
    highlightsVi: [
      'Soạn thảo văn bản Word chuẩn mẫu công văn, hợp đồng, tờ trình, mục lục tự động và trộn thư Mail Merge',
      'Làm chủ hơn 50 hàm Excel từ cơ bản đến phức tạp (XLOOKUP, INDEX-MATCH, SUMIFS, LAMBDA, LET)',
      'Thiết kế Dashboard báo cáo động đa chiều với PivotTable, Slicer và biểu đồ tương tác chuyên nghiệp',
      'Ứng dụng Power Query để gộp và làm sạch hàng triệu dòng dữ liệu chỉ bằng 1 nút bấm',
    ],
    highlightsEn: [
      'Official Word document standardization, automatic tables of contents, and mass mail merge',
      'Master 50+ Excel formulas from basic to advanced (XLOOKUP, INDEX-MATCH, SUMIFS, LAMBDA, LET)',
      'Build dynamic multi-dimensional executive Dashboards with PivotTables, Slicers, and interactive charts',
      'Automate ETL data cleaning and merging millions of rows with Power Query in 1 click',
    ],
    syllabusOrDeliverablesVi: [
      {
        title: 'Phần 1: Microsoft Word Chuyên Nghiệp & Chuẩn Thể Thức Hành Chính',
        description: 'Căn lề chuẩn, định dạng Style phân cấp, đánh số trang tự động, tạo mục lục nhiều cấp, chèn watermark bảo mật, trộn thư hợp đồng hàng loạt.',
        tags: ['Nghị định 30', 'Styles & Outlines', 'Mail Merge', 'Định dạng chuẩn'],
      },
      {
        title: 'Phần 2: Excel Thực Chiến & Kỹ Thuật Xử Lý Dữ Liệu Nâng Cao',
        description: 'Tổ chức cơ sở dữ liệu khoa học, Conditional Formatting cảnh báo tự động, bẫy lỗi công thức IFERROR, Data Validation tạo danh sách động.',
        tags: ['Data Cleaning', 'Conditional Formatting', 'Data Validation', 'Hàm logic'],
      },
      {
        title: 'Phần 3: Siêu Công Thức Excel & Thiết Kế Báo Cáo Dashboard',
        description: 'Ứng dụng mảng động Dynamic Arrays (FILTER, SORT, UNIQUE), hàm dò tìm hiện đại (XLOOKUP, INDEX/MATCH), xây dựng Dashboard quản trị tự động.',
        tags: ['Dynamic Arrays', 'XLOOKUP / FILTER', 'Interactive Dashboard', 'PivotTable & Slicer'],
      },
      {
        title: 'Phần 4: Google Workspace & PowerPoint Thuyết Trình Hiện Đại',
        description: 'Google Sheets cộng tác trực tiếp (QUERY, IMPORTRANGE), thiết kế slide PowerPoint chuẩn phong cách hiện đại, ngắn gọn, cuốn hút.',
        tags: ['Google Sheets QUERY', 'Cloud Collaboration', 'PowerPoint Mastery', 'Visual Storytelling'],
      },
    ],
    syllabusOrDeliverablesEn: [
      {
        title: 'Part 1: Professional Word & Official Standard Layout',
        description: 'Standard margins, style hierarchies, automated page numbering, multi-level TOC, watermarks, and mass mail merge.',
        tags: ['Official Standards', 'Styles & Outlines', 'Mail Merge', 'Clean Formatting'],
      },
      {
        title: 'Part 2: Practical Excel & Advanced Data Processing',
        description: 'Database schema hygiene, automated conditional formatting alerts, formula error handling (IFERROR), dynamic validation dropdowns.',
        tags: ['Data Cleaning', 'Conditional Formatting', 'Data Validation', 'Logical Formulas'],
      },
      {
        title: 'Part 3: Advanced Excel Formulas & Executive Dashboards',
        description: 'Dynamic arrays (FILTER, SORT, UNIQUE), modern lookup algorithms (XLOOKUP, INDEX/MATCH), and automated KPI dashboards.',
        tags: ['Dynamic Arrays', 'XLOOKUP / FILTER', 'Interactive Dashboard', 'PivotTable & Slicer'],
      },
      {
        title: 'Part 4: Google Workspace & Corporate Presentation Design',
        description: 'Real-time Google Sheets collaboration (QUERY, IMPORTRANGE), modern PowerPoint slide decks with high-impact visual storytelling.',
        tags: ['Google Sheets QUERY', 'Cloud Collaboration', 'PowerPoint Mastery', 'Visual Storytelling'],
      },
    ],
    techStack: ['Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Google Sheets', 'Google Workspace', 'Power Query', 'VBA / Macros'],
    durationOrTimelineVi: 'Khóa học 8 - 12 buổi (hoặc đào tạo theo yêu cầu riêng của doanh nghiệp)',
    durationOrTimelineEn: '8 - 12 intensive sessions (or tailored corporate in-house workshops)',
    formatVi: 'Học trực tuyến có video quay lại bài giảng hoặc Đào tạo trực tiếp tại doanh nghiệp',
    formatEn: 'Interactive live online with recorded sessions or on-site corporate training',
  },
  {
    id: 'digital_transformation',
    icon: 'Building2',
    badgeVi: 'Giải Pháp Doanh Nghiệp',
    badgeEn: 'Enterprise Solutions',
    titleVi: 'Tư Vấn & Triển Khai Chuyển Đổi Số Doanh Nghiệp',
    titleEn: 'Digital Transformation Consulting & Implementation for Businesses',
    shortDescVi: 'Đồng hành cùng doanh nghiệp số hóa toàn diện quy trình vận hành, quản lý dữ liệu tập trung, tích hợp AI và nâng cao năng lực cạnh tranh.',
    shortDescEn: 'Partnering with enterprises to digitize end-to-end operations, unify data architecture, integrate AI, and accelerate growth.',
    fullDescVi: 'Dịch vụ tư vấn và triển khai chuyển đổi số trọn gói dành cho doanh nghiệp SME, cơ sở kinh doanh và tổ chức giáo dục. Chúng tôi khảo sát thực tế, loại bỏ các điểm nghẽn giấy tờ, chuẩn hóa dữ liệu đám mây và đưa công nghệ hiện đại vào từng phòng ban.',
    fullDescEn: 'End-to-end digital transformation consulting and implementation for SMEs, commercial enterprises, and educational institutions. We audit workflows, eliminate paper bottlenecks, centralize cloud data, and deploy modern tech.',
    targetAudienceVi: [
      'Chủ doanh nghiệp nhỏ và vừa (SME) muốn tối ưu chi phí vận hành và tăng hiệu suất',
      'Cửa hàng, chuỗi bán lẻ, doanh nghiệp thương mại điện tử cần đồng bộ dữ liệu bán hàng - kho - kế toán',
      'Doanh nghiệp truyền thống đang gặp khó khăn trong việc quản lý hồ sơ, tài liệu thủ công',
      'Đội ngũ quản lý muốn xây dựng hệ thống báo cáo số liệu thời gian thực (Real-time reporting)',
    ],
    targetAudienceEn: [
      'Small and Medium Enterprise (SME) leaders looking to optimize operating costs and team output',
      'Retail chains and e-commerce companies needing seamless inventory-accounting-sales synchronization',
      'Traditional businesses struggling with fragmented spreadsheets and paper archives',
      'Management teams requiring real-time executive visibility and KPI control',
    ],
    highlightsVi: [
      'Khảo sát hiện trạng, phân tích điểm nghẽn (Bottlenecks) và lập lộ trình số hóa chi tiết miễn phí',
      'Xây dựng hệ sinh thái phần mềm quản lý nội bộ may đo theo đúng mô hình kinh doanh của bạn',
      'Tích hợp công nghệ AI (Gemini/OpenAI) vào chăm sóc khách hàng, trích xuất hóa đơn và phân tích dữ liệu',
      'Đào tạo chuyển giao công nghệ tận tình cho toàn thể nhân sự, cam kết 100% nhân viên sử dụng thành thạo',
    ],
    highlightsEn: [
      'On-site workflow audit, bottleneck analysis, and customized digital transformation roadmap',
      'Tailor-made internal management systems aligning precisely with your business domain',
      'Seamless AI integration (Gemini / OpenAI) for customer service chatbots, OCR invoice reading, and smart analytics',
      'Comprehensive change management and staff training ensuring 100% adoption success',
    ],
    syllabusOrDeliverablesVi: [
      {
        title: 'Giai đoạn 1: Khảo Sát Hiện Trạng & Thiết Kế Lộ Trình Số Hóa',
        description: 'Đánh giá toàn diện quy trình làm việc của các phòng ban, phát hiện lãng phí thời gian và đề xuất giải pháp công nghệ tối ưu chi phí.',
        tags: ['Audit quy trình', 'Báo cáo GAP Analysis', 'Lộ trình tối ưu chi phí'],
      },
      {
        title: 'Giai đoạn 2: Số Hóa Dữ Liệu & Kiến Trúc Đám Mây Tập Trung',
        description: 'Chuyển đổi toàn bộ sổ sách, file Excel rời rạc lên cơ sở dữ liệu đám mây an toàn, bảo mật và phân quyền truy cập chặt chẽ.',
        tags: ['Cloud Database', 'Phân quyền bảo mật', 'Xóa bỏ file rời rạc'],
      },
      {
        title: 'Giai đoạn 3: Triển Khai Hệ Thống Điều Hành & Ứng Dụng AI',
        description: 'Cài đặt hệ thống quản lý CRM/ERP tinh gọn, kết nối bot trợ lý ảo AI, hệ thống thông báo tức thì qua Zalo OA / Telegram.',
        tags: ['Custom CRM/ERP', 'AI Assistant', 'Zalo OA / Telegram Bot'],
      },
      {
        title: 'Giai đoạn 4: Đào Tạo Đội Ngũ & Đồng Hành Bảo Trì Vận Hành',
        description: 'Tổ chức các buổi workshop hướng dẫn từng nhân viên, chuyển giao tài liệu video hướng dẫn và hỗ trợ kỹ thuật 24/7.',
        tags: ['Đào tạo nhân sự', 'Video hướng dẫn chi tiết', 'Bảo hành hỗ trợ 24/7'],
      },
    ],
    syllabusOrDeliverablesEn: [
      {
        title: 'Phase 1: Operational Audit & Strategic Digitization Roadmap',
        description: 'In-depth assessment of cross-departmental workflows, identifying operational waste, and tailoring cost-efficient tech stacks.',
        tags: ['Workflow Audit', 'GAP Analysis', 'Cost-Optimized Roadmap'],
      },
      {
        title: 'Phase 2: Data Centralization & Secure Cloud Architecture',
        description: 'Migrating fragmented spreadsheets and paper ledgers to secure, encrypted cloud databases with role-based access control.',
        tags: ['Cloud Database', 'RBAC Security', 'Data Hygiene'],
      },
      {
        title: 'Phase 3: Operating System Deployment & AI Integration',
        description: 'Deploying lean CRM/ERP engines, AI assistant bots, and instant mobile notification webhooks (Zalo / Telegram).',
        tags: ['Custom CRM/ERP', 'AI Assistant', 'Mobile Webhooks'],
      },
      {
        title: 'Phase 4: Staff Training & Ongoing 24/7 Technical Support',
        description: 'Conducting interactive staff workshops, delivering step-by-step video manuals, and providing dedicated tech support.',
        tags: ['Staff Enablement', 'Documentation & Videos', '24/7 Maintenance'],
      },
    ],
    techStack: ['Cloud SQL / Firestore', 'React / Next.js', 'Google Workspace / AppSheet', 'Gemini AI API', 'Zalo Business API', 'Power BI / Looker', 'Docker Cloud'],
    durationOrTimelineVi: 'Triển khai nhanh chóng từ 2 - 6 tuần tùy theo quy mô doanh nghiệp',
    durationOrTimelineEn: 'Rapid agile delivery within 2 - 6 weeks depending on project scope',
    formatVi: 'Tư vấn trực tiếp tại trụ sở doanh nghiệp hoặc qua hệ thống họp trực tuyến',
    formatEn: 'On-site consulting at client headquarters or comprehensive remote workshops',
  },
  {
    id: 'automation_data',
    icon: 'Cpu',
    badgeVi: 'Tiết Kiệm 80% Thời Gian',
    badgeEn: 'Save 80% Work Time',
    titleVi: 'Tự Động Hóa Quy Trình & Quản Lý Dữ Liệu/Thông Tin',
    titleEn: 'Workflow Automation & Enterprise Data Management Systems',
    shortDescVi: 'Xây dựng bot tự động hóa tác vụ lặp lại (RPA), hệ thống đối soát dữ liệu tự động, xuất hóa đơn - báo cáo và Dashboard điều hành thông minh.',
    shortDescEn: 'Deploy Robotic Process Automation (RPA), automated data reconciliation bots, automated reporting, and smart BI dashboards.',
    fullDescVi: 'Giải pháp tự động hóa giúp giải phóng nhân sự khỏi các công việc thủ công nhàm chán như copy-paste dữ liệu, gửi email báo cáo hàng ngày, kiểm tra kho hay đối soát đơn hàng. Hệ thống hoạt động 24/7 chính xác tuyệt đối 100%, không biết mệt mỏi.',
    fullDescEn: 'Automation engineering eliminating tedious manual tasks: copy-pasting spreadsheet rows, sending scheduled status emails, warehouse audits, and bank transaction matching. Runs 24/7 with zero human error.',
    targetAudienceVi: [
      'Doanh nghiệp có lượng giao dịch lớn, tốn nhiều giờ đối soát số liệu ngân hàng, đơn hàng',
      'Đội ngũ kế toán - tài chính muốn tự động hóa xuất hóa đơn điện tử và gộp báo cáo thuế',
      'Bộ phận chăm sóc khách hàng & Marketing cần bot tự động gửi thông báo, nuôi dưỡng khách hàng',
      'Doanh nghiệp muốn sở hữu Dashboard trực quan theo dõi doanh thu, lợi nhuận từng giây',
    ],
    targetAudienceEn: [
      'Businesses handling high transaction volumes spending excessive hours reconciling bank statements',
      'Finance & Accounting departments wanting automated electronic invoicing and consolidated tax reports',
      'Sales & Marketing teams needing automated lead distribution and scheduled customer triggers',
      'Executive boards wanting real-time visual dashboards tracking live revenue and margin by the second',
    ],
    highlightsVi: [
      'Tự động hóa đối soát giao dịch ngân hàng & đơn vận chuyển, giảm thời gian từ 4 tiếng xuống 30 giây',
      'Bot tự động đọc file PDF, trích xuất thông tin hóa đơn và tự điền vào phần mềm kế toán',
      'Tự động gửi email/tin nhắn Zalo nhắc lịch hẹn, sinh nhật, thông báo tiến độ đơn hàng',
      'Xây dựng Dashboard trực quan thời gian thực (Power BI, Looker Studio, Web Dashboard) cập nhật tự động 24/7',
    ],
    highlightsEn: [
      'Automated bank reconciliation and shipping carrier verification (cutting 4 hours down to 30 seconds)',
      'OCR document bots reading scanned PDFs/invoices and auto-populating accounting databases',
      'Automated triggered notifications via Email and Zalo for order tracking, invoice reminders, and leads',
      'Interactive executive dashboards (Power BI / Looker Studio) updating in real-time with zero manual entry',
    ],
    syllabusOrDeliverablesVi: [
      {
        title: 'Giải pháp 1: Bot Thu Thập & Tổng Hợp Dữ Liệu Tự Động (Data Scraping & ETL)',
        description: 'Tự động cào giá đối thủ, tải sao kê ngân hàng, hợp nhất dữ liệu từ nhiều chi nhánh/file Excel thành một nguồn duy nhất.',
        tags: ['Python Scraper', 'ETL Pipeline', 'Hợp nhất dữ liệu đa kênh', 'Tự động 24/7'],
      },
      {
        title: 'Giải pháp 2: Tự Động Hóa Quy Trình Nghiệp Vụ (RPA & Script Automation)',
        description: 'Tự động nhập liệu vào phần mềm MISA/Fast/KiotViet, tự động tạo hợp đồng từ form khách hàng, phê duyệt nội bộ không cần giấy.',
        tags: ['RPA Bots', 'Ký duyệt số', 'Auto Invoicing', 'Zero Human Error'],
      },
      {
        title: 'Giải pháp 3: Hệ Thống Dashboard Báo Cáo Thông Minh (BI & Real-time Analytics)',
        description: 'Thiết kế bảng điều khiển trực quan theo dõi KPI doanh số, dòng tiền, tồn kho, năng suất nhân viên trên cả máy tính và điện thoại.',
        tags: ['Power BI / Looker', 'Mobile Dashboard', 'Cảnh báo tự động', 'KPI Tracker'],
      },
      {
        title: 'Giải pháp 4: Tích Hợp API & Webhooks Liên Kết Các Nền Tảng',
        description: 'Kết nối đồng bộ dữ liệu giữa Website bán hàng, Shopee, TikTok Shop, Fanpage, CRM và phần mềm kế toán.',
        tags: ['API Integration', 'Omnichannel Sync', 'Webhooks', 'Zalo & Telegram Alerts'],
      },
    ],
    syllabusOrDeliverablesEn: [
      {
        title: 'Solution 1: Automated Data Collection & ETL Pipelines',
        description: 'Automated competitor price crawling, bank statement downloads, and consolidating distributed branch files into a single source of truth.',
        tags: ['Python Scraper', 'ETL Pipeline', 'Omnichannel Aggregation', '24/7 Daemon'],
      },
      {
        title: 'Solution 2: Robotic Process Automation (RPA & Business Logic)',
        description: 'Automating repetitive data entry into accounting systems, auto-generating contracts from web forms, and zero-paper approvals.',
        tags: ['RPA Bots', 'Digital Signatures', 'Auto Invoicing', 'Zero Human Error'],
      },
      {
        title: 'Solution 3: Real-Time Business Intelligence & Executive Dashboards',
        description: 'Visual executive control panels tracking real-time revenue, cashflow, inventory, and staff KPIs across desktop and mobile devices.',
        tags: ['Power BI / Looker', 'Mobile Responsive', 'Automated Alerts', 'KPI Tracker'],
      },
      {
        title: 'Solution 4: Custom API & Webhook Ecosystem Integrations',
        description: 'Seamless two-way data sync connecting E-commerce webstores, Shopee, TikTok Shop, Facebook CRM, and accounting backends.',
        tags: ['API Integration', 'Omnichannel Sync', 'Webhooks', 'Zalo & Telegram Alerts'],
      },
    ],
    techStack: ['Python', 'Node.js', 'Power Automate', 'Power BI', 'Looker Studio', 'AppSheet / n8n', 'Google Apps Script', 'OpenAI / Gemini OCR'],
    durationOrTimelineVi: 'Thiết kế & bàn giao trong vòng 1 - 3 tuần / giải pháp tự động hóa',
    durationOrTimelineEn: 'Design and deployment completed within 1 - 3 weeks per automation module',
    formatVi: 'Triển khai giải pháp trực tiếp trên hạ tầng máy chủ / đám mây của khách hàng kèm bảo hành',
    formatEn: 'Direct deployment on client server/cloud infrastructure with continuous maintenance',
  },
];

export const PROMO_CONTACT_INFO = {
  hotline: '0384.241.913',
  zalo: '0384.241.913',
  email: 'hispace.education@gmail.com',
  addressVi: 'Hà Nội & TP. Hồ Chí Minh (Hỗ trợ Đào tạo & Triển khai Dự án Toàn Quốc)',
  addressEn: 'Hanoi & Ho Chi Minh City (Serving Clients & Students Nationwide / Remote)',
  website: 'https://hispace.edu.vn',
  workingHoursVi: 'Thứ 2 - Chủ Nhật: 08:00 - 22:00',
  workingHoursEn: 'Mon - Sun: 08:00 - 22:00 (GMT+7)',
};
