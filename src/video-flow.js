// The graph is derived from persisted approvals, never from a local step counter.
export function buildVideoFlow(data) {
  const { project, characters = [], shots = [], assets = [], jobs = [] } = data;
  const approved = project.script_approved;
  const nodes = [], edges = [];
  const add = (id, type, column, row, item, dependencies = [], complete = false, versions = []) => {
    const stage = type === 'character' ? 'character' : type;
    const job = jobs.find(job => job.stage === stage && (job.target_id || null) === (item?.id || null));
    const blocked = dependencies.some(id => nodes.find(node => node.id === id)?.status !== 'done');
    const running = job && ['queued', 'running'].includes(job.status);
    const status = running ? (job.status === 'queued' ? 'queued' : 'running') : blocked ? 'locked' : complete ? 'done' : job?.status === 'failed' ? 'failed' : versions.length ? 'review' : 'ready';
    const node = { id, type, column, row, item, dependencies, status, versions, job };
    nodes.push(node);
    dependencies.forEach(from => edges.push({ from, to: id }));
    return node;
  };
  add('input', 'input', 0, 0, null, [], true);
  add('script', 'script', 1, 0, null, ['input'], approved, project.script ? [project.script] : []);
  if (approved) {
    characters.forEach((character, row) => add(`character-${character.id}`, 'character', 2, row, character, ['script'], !!character.selected_asset_id, assets.filter(a => a.kind === 'image' && a.target_id === character.id)));
    if (!characters.length) add('characters', 'characters', 2, 0, null, ['script'], true);
    shots.forEach((shot, row) => {
      const refs = (shot.character_ids || []).map(id => characters.find(c => c.id === id)?.selected_asset_id).filter(Boolean).sort();
      const dependencies = (shot.character_ids || []).map(id => `character-${id}`);
      add(`keyframe-${shot.id}`, 'keyframe', 3, row, shot, dependencies.length ? dependencies : ['script'], !!shot.selected_keyframe_id,
        assets.filter(a => a.kind === 'keyframe' && a.target_id === shot.id && JSON.stringify([...(a.source_asset_ids || [])].sort()) === JSON.stringify(refs)));
      add(`clip-${shot.id}`, 'clip', 4, row, shot, [`keyframe-${shot.id}`], !!shot.selected_clip_id,
        assets.filter(a => a.kind === 'clip' && a.target_id === shot.id && shot.selected_keyframe_id && a.source_asset_id === shot.selected_keyframe_id));
    });
  } else {
    add('characters', 'characters', 2, 0, null, ['script']);
    add('keyframes', 'keyframes', 3, 0, null, ['characters']);
    add('clips', 'clips', 4, 0, null, ['keyframes']);
  }
  const clipIds = shots.map(s => s.selected_clip_id);
  const allClips = approved && shots.length > 0 && clipIds.every(Boolean);
  add('timeline', 'timeline', 5, 0, null, approved ? shots.map(s => `clip-${s.id}`) : ['clips'], allClips);
  const exportSources = [...clipIds, ...(project.selected_audio_id ? [project.selected_audio_id] : [])];
  const exports = assets.filter(a => a.kind === 'export');
  const currentExports = allClips ? exports.filter(a => JSON.stringify(a.source_asset_ids || []) === JSON.stringify(exportSources)) : [];
  add('export', 'export', 6, 0, null, ['timeline'], !!currentExports.length);
  add('output', 'output', 7, 0, null, ['export'], !!currentExports.length, currentExports);
  return { nodes, edges, exports, currentExports };
}

export function nextVideoNode(flow) {
  return flow.nodes.find(node => !['done', 'locked', 'running'].includes(node.status))
    || flow.nodes.find(node => node.status === 'running')
    || flow.nodes.find(node => node.id === 'output');
}

export function formatDialogue(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim();
    return text === '[object Object]' ? '' : text;
  }
  if (Array.isArray(value)) return value.map(formatDialogue).filter(Boolean).join('\n');
  if (!value || typeof value !== 'object') return '';
  const speaker = value.speaker ?? value.character ?? value.name;
  const line = value.text ?? value.line ?? value.content ?? value.utterance ?? value.dialogue;
  if (line !== undefined) {
    const text = formatDialogue(line);
    return `${speaker && text ? `${formatDialogue(speaker)}: ` : ''}${text}`;
  }
  return Object.entries(value).map(([name, text]) => {
    const lineText = formatDialogue(text);
    return lineText ? `${name}: ${lineText}` : '';
  }).filter(Boolean).join('\n');
}
