import React, { useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export default function GoogleAuthButton({ label, onSuccess, onError }) {
  const containerRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  useEffect(() => {
    if (!clientId) return undefined;
    const render = () => { if (!window.google?.accounts?.id || !containerRef.current) return; containerRef.current.innerHTML = ''; window.google.accounts.id.initialize({ client_id: clientId, callback: async response => { try { const result = await fetch(`${API}/auth/google`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: response.credential }) }); const payload = await result.json().catch(() => ({})); if (!result.ok || payload.success === false) throw new Error(payload.error?.message || payload.error || 'Đăng nhập Google thất bại.'); onSuccess(payload.success === true && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload); } catch (error) { onError(error.message); } } }); window.google.accounts.id.renderButton(containerRef.current, { theme: 'outline', size: 'large', width: 320, text: 'continue_with' }); };
    if (window.google?.accounts?.id) { render(); return undefined; }
    const script = document.getElementById('google-identity-script') || document.createElement('script'); script.id = 'google-identity-script'; script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.defer = true; script.onload = render; if (!script.parentNode) document.head.appendChild(script); return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [clientId, onError, onSuccess]);
  if (!clientId) return <button type="button" className="google-auth-button" onClick={() => onError('Google OAuth chưa được cấu hình.')}><span className="google-g-mark">G</span>{label}</button>;
  return <div className="google-auth-button-wrap" ref={containerRef} aria-label={label} />;
}
