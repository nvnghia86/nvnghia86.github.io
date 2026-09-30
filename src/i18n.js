import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const savedLocale = localStorage.getItem('quizzz.locale');
const detectedLocale = navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'vi';

export const resources = {
  vi: {
    translation: {
      common: { language: 'Ngôn ngữ', vietnamese: 'Tiếng Việt', english: 'English', loading: 'Đang tải...', retry: 'Thử lại', close: 'Đóng', save: 'Lưu', cancel: 'Hủy', errorTitle: 'Có lỗi xảy ra', requestFailed: 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.' },
      navigation: { student: 'Học sinh', teacher: 'Giáo viên', home: 'Trang chủ', room: 'Phòng realtime', assignments: 'Bài tập của tôi', classes: 'Lớp học', dashboard: 'Tổng quan', questions: 'Kho câu hỏi', ai: 'Tạo câu hỏi AI', quizzes: 'Bộ quiz', reports: 'Báo cáo' },
      ai: { title: 'Tạo câu hỏi bằng AI', generating: 'AI đang tạo câu hỏi...', generatingHint: 'Đang đọc kiến thức và biên soạn câu hỏi phù hợp.', generate: 'Tạo câu hỏi', selectLesson: 'Chọn bài trong mục lục (bắt buộc)' },
      room: { join: 'Tham gia phòng quiz', code: 'Mã phòng', nickname: 'Nickname', joining: 'Đang vào phòng...' },
    },
  },
  en: {
    translation: {
      common: { language: 'Language', vietnamese: 'Vietnamese', english: 'English', loading: 'Loading...', retry: 'Retry', close: 'Close', save: 'Save', cancel: 'Cancel', errorTitle: 'Something went wrong', requestFailed: 'The request could not be completed. Please try again.' },
      navigation: { student: 'Student', teacher: 'Teacher', home: 'Home', room: 'Realtime room', assignments: 'My assignments', classes: 'Classes', dashboard: 'Dashboard', questions: 'Question bank', ai: 'AI question builder', quizzes: 'Quiz sets', reports: 'Reports' },
      ai: { title: 'Create questions with AI', generating: 'AI is creating questions...', generatingHint: 'Reading the selected knowledge and preparing suitable questions.', generate: 'Generate questions', selectLesson: 'Select lessons from curriculum (required)' },
      room: { join: 'Join quiz room', code: 'Room code', nickname: 'Nickname', joining: 'Joining room...' },
    },
  },
};

i18n.use(initReactI18next).init({ resources, lng: savedLocale || detectedLocale, fallbackLng: 'vi', interpolation: { escapeValue: false }, returnNull: false, saveMissing: import.meta.env.DEV });

export default i18n;
