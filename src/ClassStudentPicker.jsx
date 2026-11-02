import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import './class-student-picker.css';

const copy = {
  vi: { title: 'Chọn học sinh thêm vào lớp', hint: 'Tìm theo từng cột, chọn nhiều học sinh rồi thêm trực tiếp vào lớp.', username: 'Tài khoản', name: 'Họ tên', email: 'Email', phone: 'Số điện thoại', school: 'Trường học', address: 'Địa chỉ cá nhân', village: 'Thôn / xóm', commune: 'Xã / phường', province: 'Tỉnh / thành phố', filter: 'Lọc {{column}}', select: 'Chọn {{name}}', all: 'Chọn tất cả học sinh có thể thêm trên trang này', add: 'Thêm {{count}} học sinh vào lớp', selected: 'Đã chọn {{count}} · Tìm thấy {{total}}', member: 'Đã trong lớp', loading: 'Đang tải...', empty: 'Không có học sinh phù hợp.', previous: 'Trang trước', next: 'Trang sau', page: 'Trang {{page}} / {{total}}', clear: 'Bỏ chọn', success: 'Đã thêm {{count}} học sinh trực tiếp vào lớp.', retry: 'Tải lại' },
  en: { title: 'Add students to class', hint: 'Filter each column, select students, then add them directly to the class.', username: 'Account', name: 'Full name', email: 'Email', phone: 'Phone', school: 'School', address: 'Home address', village: 'Village / hamlet', commune: 'Commune / ward', province: 'Province / city', filter: 'Filter {{column}}', select: 'Select {{name}}', all: 'Select all eligible students on this page', add: 'Add {{count}} students', selected: '{{count}} selected · {{total}} found', member: 'Already enrolled', loading: 'Loading...', empty: 'No matching students.', previous: 'Previous', next: 'Next', page: 'Page {{page}} / {{total}}', clear: 'Clear selection', success: '{{count}} students added directly to the class.', retry: 'Retry' },
};
for (const locale of ['vi', 'en']) i18n.addResourceBundle(locale, 'classStudents', copy[locale]);
const columns = ['username', 'name', 'phone', 'email', 'village', 'commune', 'province', 'school'];
export default function ClassStudentPicker({ classId, request, onAdded, onError }) {
  const { t } = useTranslation('classStudents');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const requestRef = useRef(request); requestRef.current = request;
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    const timer = setTimeout(() => {
      const query = new URLSearchParams({ classId, page: String(page), ...filters });
      requestRef.current(`/classes/students?${query}`).then(result => { if (active) setData(result); }).catch(failure => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [classId, page, filters, revision]);
  const eligible = data.items.filter(item => item.status !== 'accepted');
  const allChecked = eligible.length > 0 && eligible.every(item => selected.includes(item.studentId));
  async function add() {
    setSaving(true); setMessage('');
    try {
      const result = await request('/classes/members/bulk', { method: 'POST', body: JSON.stringify({ classId, studentIds: selected }) });
      setSelected([]); setMessage(t('success', { count: result.added })); setRevision(value => value + 1);
      await onAdded();
    } catch (failure) { onError(failure.message); }
    finally { setSaving(false); }
  }
  return <section className="class-student-picker"><div className="panel-heading"><div><h3>{t('title')}</h3><p className="muted-copy">{t('hint')}</p></div></div>
    {message && <p className="result-box" role="status">{message}</p>}
    <div className="management-table-wrap"><table className="management-table student-picker-table"><thead><tr><th><input type="checkbox" aria-label={t('all')} checked={allChecked} disabled={loading || saving || !eligible.length} onChange={event => setSelected(current => event.target.checked ? [...new Set([...current, ...eligible.map(item => item.studentId)])] : current.filter(id => !eligible.some(item => item.studentId === id)))} /></th>{columns.map(column => <th key={column}>{t(column)}<input aria-label={t('filter', { column: t(column) })} placeholder={t('filter', { column: t(column) })} value={filters[column] || ''} disabled={saving} onChange={event => { setFilters(current => ({ ...current, [column]: event.target.value })); setPage(1); }} /></th>)}</tr></thead>
    <tbody>{loading ? <tr><td colSpan={columns.length + 1}>{t('loading')}</td></tr> : error ? <tr><td colSpan={columns.length + 1} role="alert">{error} <button type="button" className="text-button" onClick={() => setRevision(value => value + 1)}>{t('retry')}</button></td></tr> : data.items.length ? data.items.map(item => <tr key={item.studentId}><td><input type="checkbox" aria-label={t('select', { name: item.name })} title={item.status === 'accepted' ? t('member') : undefined} disabled={saving || item.status === 'accepted'} checked={item.status === 'accepted' || selected.includes(item.studentId)} onChange={event => setSelected(current => event.target.checked ? [...current, item.studentId] : current.filter(id => id !== item.studentId))} /></td>{columns.map(column => <td key={column}>{item[column] || '—'}{column === 'name' && item.status === 'accepted' && <small className="student-picker-member">{t('member')}</small>}</td>)}</tr>) : <tr><td colSpan={columns.length + 1}>{t('empty')}</td></tr>}</tbody></table></div>
    <div className="student-picker-footer"><span>{t('selected', { count: selected.length, total: data.total })}</span><button className="text-button" type="button" disabled={saving} onClick={() => setSelected([])}>{t('clear')}</button><button type="button" className="primary-button" disabled={saving || !selected.length || selected.length > 200} onClick={add}>{saving ? t('loading') : t('add', { count: selected.length })}</button></div>
    <div className="student-picker-pagination"><button type="button" className="secondary-button" disabled={loading || saving || page <= 1} onClick={() => setPage(value => value - 1)}>{t('previous')}</button><span>{t('page', { page, total: Math.max(1, Math.ceil(data.total / 30)) })}</span><button type="button" className="secondary-button" disabled={loading || saving || page * 30 >= data.total} onClick={() => setPage(value => value + 1)}>{t('next')}</button></div>
  </section>;
}
