import React, { useEffect, useRef, useState } from 'react';

const API = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export default function GoogleAuthButton({ label, onSuccess, onError }) {
  const containerRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    if (!clientId) return undefined;
    let disposed = false;
    const render = () => { if (disposed || !window.google?.accounts?.id || !containerRef.current) return; containerRef.current.innerHTML = ''; window.google.accounts.id.initialize({ client_id: clientId, callback: async response => { if (!response.credential) return onError('Google không trả về thông tin đăng nhập. Vui lòng thử lại.'); try { const result = await fetch(`${API}/auth/google`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: response.credential }) }); const payload = await result.json().catch(() => ({})); if (!result.ok || payload.success === false) throw new Error(payload.error?.message || payload.error || 'Đăng nhập Google thất bại.'); if (!disposed) onSuccess(payload.success === true && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload); } catch (error) { if (!disposed) onError(error.message || 'Không thể kết nối với máy chủ đăng nhập.'); } } }); window.google.accounts.id.renderButton(containerRef.current, { theme: 'outline', size: 'large', width: 320, text: 'continue_with' }); setIsReady(true); };
    if (window.google?.accounts?.id) { render(); return undefined; }
    const script = document.getElementById('google-identity-script') || document.createElement('script'); script.id = 'google-identity-script'; script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.defer = true; script.onload = render; script.onerror = () => { if (!disposed) onError('Không tải được dịch vụ đăng nhập Google. Hãy kiểm tra kết nối mạng và thử lại.'); }; if (!script.parentNode) document.head.appendChild(script); return () => { disposed = true; if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [clientId, onError, onSuccess]);
  if (!clientId) return <button type="button" className="google-auth-button" onClick={() => onError('Google OAuth chưa được cấu hình.')}><span className="google-g-mark">G</span>{label}</button>;
  return <div className="google-auth-button-wrap" ref={containerRef} aria-label={label} aria-busy={!isReady} />;
}
