const measurementId = String(import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
let initialized = false;

function gtag(...args) {
  if (!measurementId || typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

export function initializeAnalytics() {
  if (!measurementId || initialized || typeof document === 'undefined') return;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
  gtag('js', new Date());
  gtag('config', measurementId, { send_page_view: false, anonymize_ip: true });
  initialized = true;
}

export function trackPageView(path, userRole) {
  if (!measurementId) return;
  initializeAnalytics();
  gtag('event', 'page_view', { page_path: path, page_location: window.location.href, user_role: userRole || 'guest' });
}

const mutationEvents = [
  [/^\/auth\/login$/, 'login'], [/^\/auth\/register$/, 'sign_up'], [/^\/ai\/quiz/, 'teacher_ai_quiz_generate'], [/^\/questions/, 'teacher_question_manage'], [/^\/quiz-sets/, 'teacher_quiz_set_manage'], [/^\/assignments/, 'teacher_assignment_manage'], [/^\/classes/, 'teacher_class_manage'], [/^\/rooms/, 'teacher_realtime_room_manage'], [/^\/student\//, 'student_learning_action'],
];

export function trackApiMutation(path, method, userRole) {
  if (!measurementId || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(String(method || 'GET').toUpperCase())) return;
  if (userRole === 'student') {
    const studentEvent = [[/^\/assignments/, 'student_assignment_action'], [/^\/classes/, 'student_class_action'], [/^\/rooms/, 'student_realtime_action']].find(([pattern]) => pattern.test(path))?.[1];
    if (studentEvent) { initializeAnalytics(); gtag('event', studentEvent, { user_role: userRole, request_method: String(method).toUpperCase() }); return; }
  }
  const event = mutationEvents.find(([pattern]) => pattern.test(path))?.[1];
  if (!event) return;
  initializeAnalytics();
  gtag('event', event, { user_role: userRole || 'guest', request_method: String(method).toUpperCase() });
}
