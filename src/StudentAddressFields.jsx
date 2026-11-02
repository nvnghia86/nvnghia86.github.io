import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import './student-profile.css';

const translations = {
  vi: { title: 'Thông tin cá nhân học sinh', address: 'Địa chỉ cá nhân', village: 'Thôn / xóm / số nhà, đường', province: 'Tỉnh / thành phố', commune: 'Xã / phường', chooseProvince: 'Chọn tỉnh / thành phố', chooseCommune: 'Chọn xã / phường', name: 'Họ tên', phone: 'Số điện thoại', username: 'Tài khoản', email: 'Email', save: 'Lưu thông tin cá nhân', saved: 'Đã lưu thông tin cá nhân.', loading: 'Đang tải...', edit: 'Sửa thông tin cá nhân', close: 'Đóng', retry: 'Tải lại', hint: 'Chọn tỉnh trước, sau đó chọn xã/phường và nhập thôn/xóm hoặc số nhà, đường.' },
  en: { title: 'Student personal profile', address: 'Home address', village: 'Village / hamlet / street address', province: 'Province / city', commune: 'Commune / ward', chooseProvince: 'Select province / city', chooseCommune: 'Select commune / ward', name: 'Full name', phone: 'Phone', username: 'Account', email: 'Email', save: 'Save personal profile', saved: 'Personal profile saved.', loading: 'Loading...', edit: 'Edit personal profile', close: 'Close', retry: 'Retry', hint: 'Choose a province, then a commune/ward, and enter your village or street address.' },
};
for (const locale of ['vi', 'en']) i18n.addResourceBundle(locale, 'studentProfile', translations[locale]);
export async function profileRequest(path, options = {}) {
  const base = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  const response = await fetch(`${base}${path}`, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const payload = await response.json();
  if (!response.ok || payload.success === false) throw new Error(payload.error?.message || payload.error || i18n.t('common.requestFailed'));
  return payload.success === true ? payload.data : payload;
}
export default function StudentAddressFields({ value, onChange, request = profileRequest, disabled = false, onError }) {
  const { t } = useTranslation('studentProfile');
  const [provinces, setProvinces] = useState([]), [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(false), [error, setError] = useState(''), [revision, setRevision] = useState(0);
  const requestRef = useRef(request); requestRef.current = request;
  useEffect(() => {
    let active = true;
    requestRef.current('/locations/provinces').then(data => { if (active) setProvinces(data.items || []); }).catch(failure => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [revision]);
  useEffect(() => {
    let active = true; setCommunes([]); setError('');
    if (!value.provinceId) { setLoading(false); return; }
    setLoading(true);
    requestRef.current(`/locations/communes?provinceId=${encodeURIComponent(value.provinceId)}`).then(data => { if (active) setCommunes(data.items || []); }).catch(failure => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [value.provinceId, revision]);
  return <fieldset className="student-address-fields wide" disabled={disabled}><legend>{t('address')}</legend><p className="muted-copy">{t('hint')}</p><div className="form-grid"><label className="field">{t('province')}<select aria-label={t('province')} value={value.provinceId || ''} onChange={event => onChange({ provinceId: event.target.value, communeId: '' })}><option value="">{t('chooseProvince')}</option>{provinces.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="field">{t('commune')}<select aria-label={t('commune')} disabled={!value.provinceId || loading} value={value.communeId || ''} onChange={event => onChange({ communeId: event.target.value })}><option value="">{loading ? t('loading') : t('chooseCommune')}</option>{communes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="field wide">{t('village')}<input aria-label={t('village')} maxLength={200} value={value.village || ''} onChange={event => onChange({ village: event.target.value })} /></label></div>{error && <p role="alert">{error} <button type="button" className="text-button" onClick={() => { setError(''); setRevision(v => v + 1); }}>{t('retry')}</button></p>}</fieldset>;
}
