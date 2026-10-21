import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import './video-studio.css';
import { ModelSelect } from './VideoStudioControls';
import VideoFlowWorkspace from './VideoFlowWorkspace';

const root = '/admin/video-projects';
const blank = { title: '', story: '', style: '', targetSeconds: 60, aspectRatio: '16:9', language: 'vi', models: { llm: '', image: '', video: '', tts: '' } };

export default function VideoStudio({ api, apiBase, onError }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { projectId: routeProjectId, nodeId: routeNodeId } = useParams();
  const projectId = routeProjectId || null;
  const [catalog, setCatalog] = useState(null);
  const [projects, setProjects] = useState([]);
  const [data, setData] = useState(null);
  const [form, setForm] = useState(blank);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const requestRef = useRef(0);
  const projectRef = useRef(projectId);
  const mutationRef = useRef(false);
  projectRef.current = projectId;

  function openProject(id, nodeId) {
    navigate(`/teacher/video-studio/${id}${nodeId ? `/${encodeURIComponent(nodeId)}` : ''}`);
  }

  async function refreshProjects() {
    const result = await api(root);
    setProjects(result.items || []);
  }
  async function refreshProject(id = projectId) {
    if (!id) return;
    const request = ++requestRef.current;
    try {
      const snapshot = await api(`${root}/${id}`, { silent: true });
      if (request === requestRef.current && projectRef.current === id) setData(snapshot);
      return snapshot;
    } catch (error) { onError(error.message); }
  }
  useEffect(() => {
    let active = true;
    Promise.all([api('/admin/video-models'), api(root)]).then(([models, list]) => {
      if (!active) return;
      const videoModels = (models.video || []).filter(model => model.provider?.toLowerCase() === 'openrouter');
      const videoCatalog = { ...models, video: videoModels };
      setCatalog(videoCatalog);
      setProjects(list.items || []);
      setForm(previous => ({ ...previous, language: 'vi', models: Object.fromEntries(['llm', 'image', 'video', 'tts'].map(kind => [kind, videoCatalog[kind]?.find(item => item.available)?.id || videoCatalog[kind]?.[0]?.id || ''])) }));
    }).catch(error => onError(error.message));
    return () => { active = false; };
  }, []);
  useEffect(() => { if (projectId) refreshProject(projectId); else setData(null); }, [projectId]);
  useEffect(() => {
    if (!projectId) return;
    const timer = window.setInterval(() => { if (!mutationRef.current) refreshProject(projectId); }, 4000);
    return () => window.clearInterval(timer);
  }, [projectId]);

  async function mutate(key, path, body = {}, method = 'POST') {
    if (mutationRef.current) return;
    mutationRef.current = true;
    ++requestRef.current;
    setBusy(key); setMessage('');
    try {
      const result = await api(path, { method, body: JSON.stringify(body) });
      if (result?.project && result?.shots) setData(result);
      else await refreshProject(projectId);
      setMessage(t(result?.job ? 'videoStudio.queued' : 'videoStudio.saved'));
      await refreshProjects().catch(error => onError(error.message));
      return result;
    } catch (error) { onError(error.message); return null; }
    finally { mutationRef.current = false; setBusy(''); }
  }
  async function createProject(event) {
    event.preventDefault();
    if (busy) return;
    setBusy('create');
    try {
      const result = await api(root, { method: 'POST', body: JSON.stringify(form) });
      setCreating(false); setData(null); openProject(result.project.id); await refreshProjects();
    } catch (error) { onError(error.message); }
    finally { mutationRef.current = false; setBusy(''); }
  }
  async function download(asset) {
    try {
      const response = await fetch(`${apiBase}${root}/${projectId}/media/${asset.id}`, { credentials: 'include' });
      if (!response.ok) throw new Error(t('videoStudio.fileError'));
      const href = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = href; link.download = `${data.project.title.replace(/[^\p{L}\p{N}_-]+/gu, '-')}.mp4`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(href), 60000);
    } catch (error) { onError(error.message); }
  }
  function moveShot(shotId, direction) {
    const order = (data?.shots || []).map(shot => shot.id);
    const index = order.indexOf(shotId);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= order.length) return;
    [order[index], order[next]] = [order[next], order[index]];
    mutate(`timeline-${shotId}`, `${root}/${projectId}/timeline`, { shotIds: order }, 'PATCH');
  }
  return <section className="content-page video-studio"><p className="eyebrow">{t('videoStudio.eyebrow')}</p><div className="video-page-heading"><div><h1>{t('videoStudio.title')}</h1><p className="muted-copy">{t('videoStudio.description')}</p></div>{projectId && <button type="button" className="secondary-button" onClick={() => navigate('/teacher/video-studio')}>{t('videoStudio.back')}</button>}</div>
    {!projectId && <div className="video-home-grid"><div className="panel"><div className="video-section-heading"><h2>{t('videoStudio.projects')}</h2><div className="video-heading-actions">{projects.length > 0 && <button type="button" className="primary-button" onClick={() => { setCreating(false); openProject(projects[0].id); }}>{t('videoStudio.continueProject')}</button>}<button type="button" className="secondary-button" onClick={() => setCreating(value => !value)}>{t('videoStudio.newProject')}</button></div></div>{projects.length ? <div className="video-project-list">{projects.map(project => <button key={project.id} type="button" onClick={() => openProject(project.id)}><strong>{project.title}</strong><small>{new Date(project.updated_at).toLocaleString(i18n.language)} · {project.script_approved ? t('videoStudio.scriptApproved') : t('videoStudio.script')}</small><span>→</span></button>)}</div> : <p className="muted-copy">{t('videoStudio.noProjects')}</p>}</div>
      {creating && <form className="panel video-create-form" onSubmit={createProject}><h2>{t('videoStudio.newProject')}</h2><div className="form-grid"><label className="field wide">{t('videoStudio.name')}<input required maxLength="160" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label><label className="field wide">{t('videoStudio.story')}<textarea required minLength="20" rows="7" value={form.story} onChange={event => setForm({ ...form, story: event.target.value })} /></label><label className="field wide">{t('videoStudio.style')}<input maxLength="500" placeholder={t('videoStudio.styleHint')} value={form.style} onChange={event => setForm({ ...form, style: event.target.value })} /></label><label className="field">{t('videoStudio.duration')}<input type="number" min="30" max="120" value={form.targetSeconds} onChange={event => setForm({ ...form, targetSeconds: Number(event.target.value) })} /></label><label className="field">{t('videoStudio.ratio')}<select value={form.aspectRatio} onChange={event => setForm({ ...form, aspectRatio: event.target.value })}><option>16:9</option><option>9:16</option></select></label><div className="field"><span>{t('videoStudio.language')}</span><strong>{t('videoStudio.fixedLanguage')}</strong></div><ModelSelect kind="llm" label={t('videoStudio.modelLlm')} models={catalog} value={form.models.llm} onChange={value => setForm({ ...form, models: { ...form.models, llm: value } })} t={t} locale={i18n.language} /><ModelSelect kind="image" label={t('videoStudio.modelImage')} models={catalog} value={form.models.image} onChange={value => setForm({ ...form, models: { ...form.models, image: value } })} t={t} locale={i18n.language} /><ModelSelect kind="video" label={t('videoStudio.modelVideo')} models={catalog} value={form.models.video} onChange={value => setForm({ ...form, models: { ...form.models, video: value } })} t={t} locale={i18n.language} /><ModelSelect kind="tts" required={false} label={t('videoStudio.modelTts')} models={catalog} value={form.models.tts} onChange={value => setForm({ ...form, models: { ...form.models, tts: value } })} t={t} locale={i18n.language} /><div className="wide"><button className="primary-button" type="submit" disabled={Boolean(busy) || !catalog}>{t('videoStudio.create')}</button></div></div></form>}</div>}
    {projectId && !data && <p className="muted-copy">{t('videoStudio.loading')}</p>}
    {data && <VideoFlowWorkspace key={projectId} data={data} catalog={catalog} apiBase={apiBase} busy={busy} message={message} mutate={mutate} refreshProject={refreshProject} moveShot={moveShot} download={download} onError={onError} selectedNodeId={routeNodeId} onNodeChange={nodeId => openProject(projectId, nodeId)} />}
  </section>;
}
