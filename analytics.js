// Google Analytics 4 for the static GitHub Pages deployment.
// Measurement ID from Google Analytics.
(() => {
  const measurementId = 'G-9FVG9T2JC2';
  const isValidId = /^G-[A-Z0-9]+$/i.test(measurementId) && !measurementId.includes('REPLACE');

  window.trackAnalyticsEvent = () => {};
  if (!isValidId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: true });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  window.trackAnalyticsEvent = (eventName, eventParams = {}) => {
    window.gtag('event', eventName, eventParams);
  };
})();
