import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModelSelect, PromptAction, VersionGallery } from './VideoStudioControls';
import { buildVideoFlow, nextVideoNode } from './video-flow';

const stageNames = ['input', 'script', 'characters', 'keyframes', 'clips', 'timeline', 'export', 'output'];
const typeKey = type => ({ character: 'characters', keyframe: 'keyframes', clip: 'clips' }[type] || type);
const position = node => ({ x: 28 + node.column * 252, y: 56 + node.row * 146 });
const emptyShot = () => ({ sceneTitle: '', description: '', dialogue: '', camera: '', durationSeconds: 8, characters: [] });

function ScriptEditor({ script, onChange, disabled, t }) {
  const updateCharacter = (index, field, value) => {
    const oldName = script.characters[index].name;
    onChange({ ...script, characters: script.characters.map((c, i) => i === index ? { ...c, [field]: value } : c),
      shots: field === 'name' ? script.shots.map(s => ({ ...s, characters: s.characters.map(name => name === oldName ? value : name) })) : script.shots });
  };
  const updateShot = (index, field, value) => onChange({ ...script, shots: script.shots.map((s, i) => i === index ? { ...s, [field]: value } : s) });
  return <fieldset className="video-script-fields" disabled={disabled}>
    <legend>{t('videoStudio.scriptEditor')}</legend>
    <h4>{t('videoStudio.flowCharacters')}</h4>
    {script.characters.map((character, index) => <div className="video-card" key={index}>
      <div className="form-grid">
        <label className="field">{t('videoStudio.characterName', { count: index + 1 })}<input value={character.name} maxLength={120} onChange={e => updateCharacter(index, 'name', e.target.value)} /></label>
        <label className="field">{t('videoStudio.characterDescription')}<textarea value={character.description} maxLength={1000} onChange={e => updateCharacter(index, 'description', e.target.value)} /></label>
      </div>
      <button type="button" className="secondary-button" onClick={() => onChange({ ...script, characters: script.characters.filter((_, i) => i !== index), shots: script.shots.map(s => ({ ...s, characters: s.characters.filter(name => name !== character.name) })) })}>{t('videoStudio.removeCharacter')}</button>
    </div>)}
    <button type="button" className="secondary-button" disabled={script.characters.length >= 8} onClick={() => onChange({ ...script, characters: [...script.characters, { name: '', description: '' }] })}>{t('videoStudio.addCharacter')}</button>
    <h4>{t('videoStudio.shots')}</h4>
    {script.shots.map((shot, index) => <details className="video-script-scene" key={index} open={index === 0 ? true : undefined}>
      <summary>{index + 1}. {shot.sceneTitle || t('videoStudio.shot')} · {t('videoStudio.seconds', { count: shot.durationSeconds })}</summary>
      <div className="form-grid">
        <label className="field">{t('videoStudio.sceneTitle')}<input value={shot.sceneTitle} maxLength={160} onChange={e => updateShot(index, 'sceneTitle', e.target.value)} /></label>
        <label className="field">{t('videoStudio.shotDuration')}<input type="number" min={4} max={8} value={shot.durationSeconds} onChange={e => updateShot(index, 'durationSeconds', Number(e.target.value))} /></label>
        <label className="field wide">{t('videoStudio.sceneDescription')}<textarea rows={3} value={shot.description} maxLength={1200} onChange={e => updateShot(index, 'description', e.target.value)} /></label>
        <label className="field">{t('videoStudio.dialogue')}<textarea value={shot.dialogue} maxLength={1000} onChange={e => updateShot(index, 'dialogue', e.target.value)} /></label>
        <label className="field">{t('videoStudio.camera')}<textarea value={shot.camera} maxLength={400} onChange={e => updateShot(index, 'camera', e.target.value)} /></label>
      </div>
      <div className="video-character-picker"><span>{t('videoStudio.shotCharacters')}</span>{script.characters.filter(c => c.name).map((character, i) => <label key={i}><input type="checkbox" checked={shot.characters.includes(character.name)} disabled={!shot.characters.includes(character.name) && shot.characters.length >= 3} onChange={e => updateShot(index, 'characters', e.target.checked ? [...shot.characters, character.name] : shot.characters.filter(name => name !== character.name))} />{character.name}</label>)}</div>
      <button type="button" className="secondary-button" disabled={script.shots.length <= 1} onClick={() => onChange({ ...script, shots: script.shots.filter((_, i) => i !== index) })}>{t('videoStudio.removeShot')}</button>
    </details>)}
    <button type="button" className="secondary-button" disabled={script.shots.length >= 30} onClick={() => onChange({ ...script, shots: [...script.shots, emptyShot()] })}>{t('videoStudio.addShot')}</button>
  </fieldset>;
}

export default function VideoFlowWorkspace({ data, catalog, apiBase, busy, message, mutate, refreshProject, moveShot, download, onError, selectedNodeId, onNodeChange }) {
  const { t, i18n } = useTranslation();
  const flow = useMemo(() => buildVideoFlow(data), [data]);
  const [selectedId, setSelectedId] = useState(() => selectedNodeId || nextVideoNode(flow).id);
  const [zoom, setZoom] = useState(0.85);
  const [prompts, setPrompts] = useState({});
  const [draft, setDraft] = useState(data.project.script);
  const [dirty, setDirty] = useState(false);
  const [input, setInput] = useState({ title: data.project.title, story: data.project.story });
  const [inputDirty, setInputDirty] = useState(false);
  const inspector = useRef(null);
  const viewport = useRef(null);
  const base = `/admin/video-projects/${data.project.id}`;
  const scriptVersion = JSON.stringify(data.project.script);
  useEffect(() => { if (!dirty) setDraft(data.project.script); }, [scriptVersion, dirty]);
  useEffect(() => {
    const routeNode = flow.nodes.find(n => n.id === selectedNodeId);
    if (routeNode && routeNode.id !== selectedId) setSelectedId(routeNode.id);
    else if (!routeNode && !flow.nodes.some(n => n.id === selectedId)) setSelectedId(nextVideoNode(flow).id);
  }, [flow, selectedId, selectedNodeId]);
  useEffect(() => {
    if (!flow.nodes.some(n => n.id === selectedId)) return;
    if (selectedNodeId !== selectedId) onNodeChange?.(selectedId);
  }, [flow, selectedId, selectedNodeId, onNodeChange]);
  const selected = flow.nodes.find(n => n.id === selectedId) || nextVideoNode(flow);
  const running = data.jobs.some(j => ['queued', 'running'].includes(j.status));
  const disabled = Boolean(busy);
  const scriptBusy = data.jobs.some(j => j.stage === 'script' && ['queued', 'running'].includes(j.status));
  const label = node => node.item ? (node.type === 'character' ? node.item.name : `${node.item.position + 1}. ${node.item.scene_title || t('videoStudio.shot')}`) : t(`videoStudio.flow${typeKey(node.type)[0].toUpperCase()}${typeKey(node.type).slice(1)}`);
  const stageLabel = type => t(`videoStudio.flow${typeKey(type)[0].toUpperCase()}${typeKey(type).slice(1)}`);
  const statusLabel = status => t(`videoStudio.flowStatus${status[0].toUpperCase()}${status.slice(1)}`);
  const media = asset => `${apiBase}${base}/media/${asset.id}`;
  function select(id, reveal = false) {
    setSelectedId(id);
    onNodeChange?.(id);
    if (reveal) inspector.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }
  useEffect(() => {
    const point = position(selected);
    viewport.current?.scrollTo?.({ left: Math.max(0, point.x * zoom - 80), top: Math.max(0, point.y * zoom - 60), behavior: 'smooth' });
  }, [selected.id, zoom]);
  function continueFrom(snapshot) {
    const updated = buildVideoFlow(snapshot);
    // Always offer a timeline review after approving the final clip.
    select(selected.type === 'clip' && updated.nodes.find(n => n.id === 'timeline').status === 'done' ? 'timeline' : nextVideoNode(updated).id, true);
  }
  function editScript(value) { setDraft(value); setDirty(true); }
  async function saveScript() {
    const names = draft?.characters.map(c => c.name.trim().toLowerCase()) || [];
    if (!draft?.shots.length || draft.characters.some(c => !c.name.trim() || !c.description.trim()) || new Set(names).size !== names.length || draft.shots.some(s => !s.description.trim() || s.durationSeconds < 4 || s.durationSeconds > 8)) {
      onError(t('videoStudio.scriptValidation')); return null;
    }
    const result = await mutate('save-script', `${base}/script`, { script: draft }, 'PATCH');
    if (result) { setDirty(false); setDraft(result.project.script); }
    return result;
  }
  async function approveScript() {
    if (dirty && !(await saveScript())) return;
    if (data.project.script_approved && !dirty) { continueFrom(data); return; }
    const result = await mutate('approve-script', `${base}/script/approve`);
    if (result) continueFrom(result);
  }
  const selectedKind = selected.type === 'character' ? 'image' : selected.type;
  const targetPath = selected.item ? `${base}/${selected.type === 'character' ? 'characters' : 'shots'}/${selected.item.id}/${selectedKind}` : null;
  const dependencies = selected.dependencies.map(id => flow.nodes.find(n => n.id === id)).filter(Boolean);
  const selectedAssetId = selected.item?.[selected.type === 'character' ? 'selected_asset_id' : selected.type === 'keyframe' ? 'selected_keyframe_id' : 'selected_clip_id'];
  const afterNode = () => {
    if (selected.type === 'input') return select('script', true);
    if (selected.id === 'timeline') return select('export', true);
    if (selected.id === 'export') return select('output', true);
    if (selected.id === 'output') return;
    const next = nextVideoNode(flow);
    select(next.id === selected.id ? 'timeline' : next.id, true);
  };
  const rows = Math.max(1, ...flow.nodes.map(n => n.row + 1));
  const width = 2044, height = rows * 146 + 68;

  return <div className="video-workspace">
    <div className="video-workspace-head"><div><h2>{data.project.title}</h2><p className="muted-copy">{t('videoStudio.flowProgress', { approved: data.shots.filter(s => s.selected_clip_id).length, total: data.shots.length })}</p></div>
      <div className="video-heading-actions"><button type="button" className="primary-button" onClick={() => select(nextVideoNode(flow).id, true)}>{t('videoStudio.nextRequired')} →</button><button type="button" className="secondary-button" disabled={disabled} onClick={() => refreshProject()}>{t('videoStudio.refresh')}</button></div>
    </div>
    {message && <p className="video-message" role="status">{message}</p>}
    <section className="video-flow-map" aria-label={t('videoStudio.flowMap')}>
      <div className="video-flow-toolbar"><strong>{t('videoStudio.flowMap')}</strong><span>{t('videoStudio.flowMapHint')}</span><label>{t('videoStudio.zoom')}<input type="range" min="0.5" max="1.2" step="0.05" value={zoom} onChange={e => setZoom(Number(e.target.value))} /><output>{Math.round(zoom * 100)}%</output></label></div>
      <div className="video-flow-viewport" ref={viewport} tabIndex={0} aria-label={t('videoStudio.flowMap')}>
        <div style={{ width: width * zoom, height: height * zoom }}>
          <div className="video-flow-canvas" style={{ width, height, transform: `scale(${zoom})` }}>
            {stageNames.map((type, index) => <div key={type} className="video-flow-column" style={{ left: 28 + index * 252 }}>{String(index + 1).padStart(2, '0')} · {stageLabel(type)}</div>)}
            <svg width={width} height={height} className="video-flow-edges" aria-hidden="true"><defs><marker id="video-flow-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#7aaebf" /></marker></defs>{flow.edges.map(edge => {
              const from = position(flow.nodes.find(n => n.id === edge.from)), to = position(flow.nodes.find(n => n.id === edge.to));
              const x = from.x + 210, y = from.y + 55, endY = to.y + 55;
              return <path key={`${edge.from}-${edge.to}`} d={`M${x},${y} C${x + 24},${y} ${to.x - 24},${endY} ${to.x - 5},${endY}`} fill="none" stroke="#7aaebf" strokeWidth="2" markerEnd="url(#video-flow-arrow)" />;
            })}</svg>
            {flow.nodes.map(node => <button key={node.id} type="button" className={`video-flow-node ${node.status}${selected.id === node.id ? ' is-selected' : ''}`} style={{ left: position(node).x, top: position(node).y }} aria-pressed={selected.id === node.id} aria-label={`${stageLabel(node.type)}: ${label(node)} — ${statusLabel(node.status)}`} onClick={() => select(node.id)}>
              <small>{stageLabel(node.type)}</small><strong>{label(node)}</strong><span className={`video-flow-badge ${node.status}`}>{statusLabel(node.status)}</span>
            </button>)}
          </div>
        </div>
      </div>
    </section>

    <article className="panel video-node-inspector" ref={inspector} aria-label={t('videoStudio.nodeDetails')}>
      <div className="video-inspector-heading"><div><span className="eyebrow">{stageLabel(selected.type)}</span><h3>{label(selected)}</h3><span className={`video-flow-badge ${selected.status}`}>{statusLabel(selected.status)}</span></div>
        <div className="video-heading-actions">
          {selected.type === 'script' && draft && <button type="button" className="primary-button" disabled={disabled || running || inputDirty} onClick={approveScript}>{t(data.project.script_approved && !dirty ? 'videoStudio.continueFlow' : dirty ? 'videoStudio.saveApproveContinue' : 'videoStudio.approveScriptContinue')} →</button>}
          {selected.type !== 'script' && selected.type !== 'output' && selected.status === 'done' && <button type="button" className="primary-button" onClick={afterNode}>{t('videoStudio.continueFlow')} →</button>}
        </div>
      </div>
      {dependencies.length > 0 && <div className="video-node-dependencies"><span>{t('videoStudio.dependencies')}</span>{dependencies.map(node => <button type="button" className="secondary-button" key={node.id} onClick={() => select(node.id)}>{node.status === 'done' ? '✓ ' : '← '}{label(node)}</button>)}</div>}
      {selected.status === 'locked' && <p className="video-hint" role="status">{t('videoStudio.nodeLocked')}</p>}
      {selected.status === 'queued' && <p role="status">{selected.job?.n8n_dispatch_count > 0 ? t('videoStudio.nodeDispatchSent', { count: selected.job.n8n_dispatch_count, time: selected.job.n8n_last_dispatched_at ? new Date(selected.job.n8n_last_dispatched_at).toLocaleTimeString(i18n.language) : '—' }) : t('videoStudio.nodeDispatchPending')}</p>}
      {selected.status === 'running' && <p role="status">{t('videoStudio.nodeRunning')}</p>}
      {selected.job?.status === 'failed' && <div className="video-node-error" role="alert"><p>{selected.job.error || t('videoStudio.error')}</p>{selected.job.attempts < 3 && <button type="button" className="secondary-button" disabled={disabled || selected.status === 'locked' || dirty || inputDirty || scriptBusy} onClick={() => mutate(`retry-${selected.job.id}`, `${base}/jobs/${selected.job.id}/retry`)}>{t('videoStudio.retryJob')}</button>}</div>}

      {selected.type === 'input' && <form onSubmit={async e => { e.preventDefault(); const result = await mutate('input', base, input, 'PATCH'); if (result) { setInputDirty(false); select('script', true); } }}>
        <div className="form-grid"><label className="field">{t('videoStudio.name')}<input required value={input.title} maxLength={160} onChange={e => { setInput({ ...input, title: e.target.value }); setInputDirty(true); }} /></label><label className="field wide">{t('videoStudio.story')}<textarea required minLength={20} maxLength={12000} rows={6} value={input.story} onChange={e => { setInput({ ...input, story: e.target.value }); setInputDirty(true); }} /></label></div>
        <p className="muted-copy">{data.project.settings.style} · {data.project.settings.aspectRatio} · {t('videoStudio.seconds', { count: data.project.settings.targetSeconds })}</p>
        {inputDirty && <p className="video-hint">{t('videoStudio.inputWarning')}</p>}
        <button type="submit" className="primary-button" disabled={disabled || running || !inputDirty}>{t('videoStudio.saveInputContinue')}</button>
      </form>}

      {selected.type === 'script' && <>
        <ModelSelect kind="llm" label={t('videoStudio.modelLlm')} models={catalog} value={data.project.settings.models.llm} onChange={model => mutate('model-llm', `${base}/models`, { kind: 'llm', model }, 'PATCH')} disabled={disabled} t={t} locale={i18n.language} />
        <p className="video-story">{data.project.story}</p>
        {(dirty || inputDirty) && <p className="video-hint">{t('videoStudio.unsavedDraft')}</p>}
        {data.characters.length + data.shots.length > 0 && <p className="video-hint">{t('videoStudio.scriptWarning')}</p>}
        <PromptAction value={prompts.script} onChange={value => setPrompts({ ...prompts, script: value })} onRun={() => mutate('script', `${base}/script/generate`, { prompt: prompts.script })} label={t(data.project.script ? 'videoStudio.regenerateScript' : 'videoStudio.generateScript')} disabled={disabled || running || dirty || inputDirty} busy={scriptBusy} t={t} />
        {!draft && <button type="button" className="secondary-button video-manual-script" disabled={disabled || running} onClick={() => editScript({ characters: [], shots: [{ ...emptyShot(), description: data.project.story.slice(0, 1200) }] })}>{t('videoStudio.manualScript')}</button>}
        {draft && <><div className="video-section-heading"><p>{t('videoStudio.scriptCounts', { characters: draft.characters.length, shots: draft.shots.length })}</p><button type="button" className="secondary-button" disabled={disabled || running || !dirty} onClick={saveScript}>{t('videoStudio.saveScript')}</button></div><ScriptEditor script={draft} onChange={editScript} disabled={disabled || running} t={t} /></>}
      </>}

      {['character', 'keyframe', 'clip'].includes(selected.type) && <>
        <ModelSelect kind={selected.type === 'clip' ? 'video' : 'image'} label={t(selected.type === 'clip' ? 'videoStudio.modelVideo' : 'videoStudio.modelImage')} models={catalog} value={data.project.settings.models[selected.type === 'clip' ? 'video' : 'image']} disabled={disabled} onChange={model => mutate('model', `${base}/models`, { kind: selected.type === 'clip' ? 'video' : 'image', model }, 'PATCH')} t={t} locale={i18n.language} />
        <p className="video-story">{selected.item.description}</p>
        {selected.item.dialogue && <p><b>{t('videoStudio.dialogue')}: </b>{selected.item.dialogue}</p>}
        {selected.item.camera && <p><b>{t('videoStudio.camera')}: </b>{selected.item.camera}</p>}
        {selected.type !== 'character' && <p>{t('videoStudio.seconds', { count: selected.item.duration_seconds })}</p>}
        <VersionGallery projectId={data.project.id} items={selected.versions} kind={selectedKind} selectedId={selectedAssetId} onApprove={async assetId => { const result = await mutate(`approve-${selected.id}`, `${targetPath}/approve`, { assetId }); if (result) continueFrom(result); }} apiBase={apiBase} t={t} locale={i18n.language} busy={disabled || selected.status === 'locked' || scriptBusy} />
        {!selected.versions.length && <p className="muted-copy">{t('videoStudio.noVersions')}</p>}
        <PromptAction value={prompts[selected.id]} onChange={value => setPrompts({ ...prompts, [selected.id]: value })} onRun={() => mutate(selected.id, `${targetPath}/generate`, { prompt: prompts[selected.id] })} label={t(selected.type === 'clip' ? 'videoStudio.generateClip' : selected.versions.length ? 'videoStudio.regenerate' : 'videoStudio.generate')} disabled={disabled || ['locked', 'running'].includes(selected.status)} busy={selected.status === 'running'} t={t} />
        {selectedAssetId && <p className="video-hint">{t('videoStudio.changeVersionHint')}</p>}
      </>}

      {['characters', 'keyframes', 'clips'].includes(selected.type) && <p className="muted-copy">{t(selected.id === 'characters' && data.project.script_approved ? 'videoStudio.noCharacters' : 'videoStudio.pendingNodes')}</p>}
      {selected.type === 'timeline' && <><p>{t('videoStudio.timelineHint')}</p><div className="video-timeline">{data.shots.map((shot, index) => {
        const asset = data.assets.find(a => a.id === shot.selected_clip_id);
        return <div className="video-timeline-shot" key={shot.id}>{asset ? <video src={media(asset)} controls preload="metadata" /> : <div className="video-timeline-placeholder">{t('videoStudio.clipMissing')}</div>}<strong>{index + 1}. {shot.scene_title}</strong><small>{t('videoStudio.seconds', { count: shot.duration_seconds })}</small><div className="video-heading-actions"><button type="button" className="secondary-button" onClick={() => select(`clip-${shot.id}`)}>{t('videoStudio.openClip')}</button><button type="button" className="secondary-button" aria-label={t('videoStudio.moveUp')} disabled={disabled || running || index === 0} onClick={() => moveShot(shot.id, -1)}>↑</button><button type="button" className="secondary-button" aria-label={t('videoStudio.moveDown')} disabled={disabled || running || index === data.shots.length - 1} onClick={() => moveShot(shot.id, 1)}>↓</button></div></div>;
      })}</div><section className="video-voiceover"><h4>{t('videoStudio.voiceover')}</h4><p className="muted-copy">{t('videoStudio.voiceoverHint')}</p><VersionGallery projectId={data.project.id} items={data.assets.filter(asset => asset.kind === 'audio')} kind="audio" selectedId={data.project.selected_audio_id} onApprove={assetId => mutate('voiceover-approve', `${base}/voiceover/approve`, { assetId })} apiBase={apiBase} t={t} locale={i18n.language} busy={disabled || running || selected.status === 'locked'} /><button type="button" className="primary-button" disabled={disabled || running || selected.status === 'locked' || data.jobs.some(job => job.stage === 'tts' && ['queued', 'running'].includes(job.status))} onClick={() => mutate('voiceover', `${base}/voiceover/generate`)}>{t(data.assets.some(asset => asset.kind === 'audio') ? 'videoStudio.regenerateVoiceover' : 'videoStudio.generateVoiceover')}</button></section></>}
      {selected.type === 'export' && <><p>{t('videoStudio.exportHint')}</p><p>{t('videoStudio.scriptCounts', { characters: data.characters.length, shots: data.shots.length })} · {data.project.settings.aspectRatio}{data.project.selected_audio_id ? ` · ${t('videoStudio.voiceoverIncluded')}` : ''}</p><button type="button" className="primary-button" disabled={disabled || ['locked', 'running'].includes(selected.status)} onClick={() => mutate('export', `${base}/export`)}>{t('videoStudio.exportAction')}</button></>}
      {selected.type === 'output' && <>{!flow.exports.length && <p>{t('videoStudio.noOutput')}</p>}{flow.exports.map(asset => <div className="video-output" key={asset.id}><p><strong>{t(flow.currentExports.some(a => a.id === asset.id) ? 'videoStudio.currentOutput' : 'videoStudio.previousOutput')}</strong> · {new Date(asset.created_at).toLocaleString(i18n.language)}</p><video src={media(asset)} controls preload="metadata" /><button type="button" className="primary-button" onClick={() => download(asset)}>{t('videoStudio.download')}</button></div>)}</>}
    </article>
    <details className="panel video-flow-jobs"><summary>{t('videoStudio.latestJobs')} ({data.jobs.length})</summary><div className="video-job-list">{data.jobs.slice(0, 20).map(job => <div className="video-job" key={job.id}><strong>{stageLabel(job.stage)}</strong><span className={`video-job-status ${job.status}`}>{t(`videoStudio.job${job.status[0].toUpperCase()}${job.status.slice(1)}`)}</span><small>{new Date(job.created_at).toLocaleString(i18n.language)}</small><small className="video-job-dispatch">{job.status === 'queued' ? job.n8n_dispatch_count > 0 ? t('videoStudio.nodeDispatchSent', { count: job.n8n_dispatch_count, time: job.n8n_last_dispatched_at ? new Date(job.n8n_last_dispatched_at).toLocaleString(i18n.language) : '—' }) : t('videoStudio.nodeDispatchPending') : job.status === 'running' ? t('videoStudio.nodeRunning') : ''}</small>{job.error && <p>{job.error}</p>}</div>)}</div></details>
  </div>;
}
