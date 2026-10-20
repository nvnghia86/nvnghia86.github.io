import React, { useState } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import i18n from './i18n';
import VideoStudio from './VideoStudio';
import VideoFlowWorkspace from './VideoFlowWorkspace';
import { buildVideoFlow, nextVideoNode } from './video-flow';

afterEach(cleanup);
beforeEach(async () => { await i18n.changeLanguage('vi'); });
const catalog = { llm: [{ id: 'chat', available: true }], image: [{ id: 'image', available: true }], video: [{ id: 'google/veo', available: true }] };
function fixture(approved = false) {
  return {
    project: { id: 'project', title: 'Hành trình của Lan', story: 'Lan bước vào một khu rừng bí ẩn và gặp người bạn mới.', settings: { models: { llm: 'chat', image: 'image', video: 'google/veo' }, aspectRatio: '16:9', targetSeconds: 60 }, script_approved: approved,
      script: { characters: [{ name: 'Lan', description: 'Tóc đen, áo xanh' }], shots: [{ sceneTitle: 'Khu rừng', description: 'Lan đi qua khu rừng', dialogue: 'Xin chào!', camera: 'Toàn cảnh', durationSeconds: 8, characters: ['Lan'] }] } },
    characters: approved ? [{ id: 'lan', name: 'Lan', description: 'Tóc đen, áo xanh', selected_asset_id: null }] : [],
    shots: approved ? [{ id: 'forest', position: 0, scene_title: 'Khu rừng', description: 'Lan đi qua khu rừng', duration_seconds: 8, character_ids: ['lan'], selected_keyframe_id: null, selected_clip_id: null }] : [],
    assets: [], jobs: [],
  };
}
const inspector = () => screen.getByRole('article', { name: 'Chi tiết node' });
const renderStudio = props => render(<MemoryRouter initialEntries={['/teacher/video-studio']}><Routes><Route path="/teacher/video-studio/:projectId?/:nodeId?" element={<VideoStudio {...props} />} /></Routes></MemoryRouter>);
function StatefulWorkspace(props) {
  const [data, setData] = useState(props.data);
  const mutate = async (...args) => {
    const result = await props.mutate(...args);
    if (result?.project && result?.shots) setData(result);
    else if (result?.job) setData(await props.refreshProject());
    return result;
  };
  return <VideoFlowWorkspace {...props} data={data} mutate={mutate} />;
}
function RoutedWorkspaceHarness({ data, mutate }) {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(data);
  const runMutation = async (...args) => { const result = await mutate(...args); if (result?.project) setSnapshot(result); return result; };
  return <><output data-testid="route-node">{nodeId}</output><VideoFlowWorkspace data={snapshot} catalog={catalog} apiBase="/api" mutate={runMutation} busy="" onError={vi.fn()} selectedNodeId={nodeId} onNodeChange={next => navigate(`/teacher/video-studio/project/${next}`)} /></>;
}

it('completes script → character → keyframe → clip → export through visible actions', async () => {
  let state = fixture();
  const base = '/admin/video-projects/project';
  const api = vi.fn(async (path, options = {}) => {
    if (path === '/admin/video-models') return catalog;
    if (path === '/admin/video-projects') return { items: [state.project] };
    if (path === base) return structuredClone(state);
    if (path === `${base}/script/approve`) state = fixture(true);
    else if (path.endsWith('/generate')) {
      const kind = path.includes('/characters/') ? 'image' : path.includes('/keyframe/') ? 'keyframe' : 'clip';
      state.assets.unshift({ id: kind, kind, target_id: kind === 'image' ? 'lan' : 'forest', mime_type: kind === 'clip' ? 'video/mp4' : 'image/png', source_asset_ids: kind === 'keyframe' ? ['image'] : [], source_asset_id: kind === 'clip' ? 'keyframe' : null, created_at: '2026-10-19' });
      return { job: { id: kind } };
    } else if (path.endsWith('/approve')) {
      const { assetId } = JSON.parse(options.body);
      if (path.includes('/characters/')) state.characters[0].selected_asset_id = assetId;
      else state.shots[0][path.includes('/keyframe/') ? 'selected_keyframe_id' : 'selected_clip_id'] = assetId;
    } else if (path === `${base}/export`) {
      state.assets.unshift({ id: 'export', kind: 'export', source_asset_ids: ['clip'], mime_type: 'video/mp4', created_at: '2026-10-19' });
      return { job: { id: 'export' } };
    } else throw new Error(`Unexpected request ${path}`);
    return structuredClone(state);
  });
  const onError = vi.fn();
  render(<StatefulWorkspace data={state} catalog={catalog} apiBase="/api" mutate={async (_key, path, body, method) => {
    const result = await api(path, { method, body: JSON.stringify(body || {}) });
    return result?.job ? { job: result.job } : structuredClone(state);
  }} refreshProject={async () => structuredClone(state)} busy="" onError={onError} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Duyệt kịch bản & tiếp tục →' }));
  await waitFor(() => expect(within(inspector()).getByRole('heading', { name: 'Lan' })).toBeInTheDocument());
  fireEvent.click(within(inspector()).getByRole('button', { name: 'Tạo ảnh' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Duyệt & tiếp tục' }));
  await waitFor(() => expect(within(inspector()).getByText('Ảnh mốc', { selector: '.eyebrow' })).toBeInTheDocument());
  fireEvent.click(within(inspector()).getByRole('button', { name: 'Tạo ảnh' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Duyệt & tiếp tục' }));
  await waitFor(() => expect(within(inspector()).getByRole('button', { name: 'Tạo clip' })).toBeEnabled());
  fireEvent.click(within(inspector()).getByRole('button', { name: 'Tạo clip' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Duyệt & tiếp tục' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Tiếp tục →' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Ghép và xuất MP4' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Tiếp tục →' }));
  expect(await screen.findByRole('button', { name: 'Tải MP4' })).toBeEnabled();
  expect(screen.getByText('Bản xuất theo luồng hiện tại')).toBeInTheDocument();
  expect(onError).not.toHaveBeenCalled();
});

it('saves edited dialogue before approval and retains edits during polling', async () => {
  const state = fixture();
  const mutate = vi.fn(async (key, path, body) => key === 'save-script' ? { ...state, project: { ...state.project, script: body.script } } : fixture(true));
  const props = { data: state, catalog, mutate, busy: '', onError: vi.fn(), refreshProject: vi.fn(), moveShot: vi.fn(), download: vi.fn() };
  const view = render(<VideoFlowWorkspace {...props} />);
  fireEvent.change(screen.getByLabelText('Lời thoại'), { target: { value: 'Lời thoại đã sửa' } });
  view.rerender(<VideoFlowWorkspace {...props} data={structuredClone(state)} />);
  expect(screen.getByLabelText('Lời thoại')).toHaveValue('Lời thoại đã sửa');
  fireEvent.click(screen.getByRole('button', { name: 'Lưu, duyệt & tiếp tục →' }));
  await waitFor(() => expect(mutate).toHaveBeenCalledTimes(2));
  expect(mutate.mock.calls[0][2].script.shots[0].dialogue).toBe('Lời thoại đã sửa');
  expect(mutate.mock.calls[1][1]).toMatch(/script\/approve$/);
});

it('continues an approved script without approving again or resetting generated assets', () => {
  const state = fixture(true), mutate = vi.fn();
  render(<VideoFlowWorkspace data={state} catalog={catalog} mutate={mutate} busy="" onError={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Kịch bản: Kịch bản/ }));
  fireEvent.click(within(inspector()).getByRole('button', { name: 'Tiếp tục →' }));
  expect(within(inspector()).getByRole('heading', { name: 'Lan' })).toBeInTheDocument();
  expect(mutate).not.toHaveBeenCalled();
});

it('keeps the character node selected when approval updates the route', async () => {
  const approved = fixture(true);
  const mutate = vi.fn(async (_key, path) => path.endsWith('/script/approve') ? approved : approved);
  render(<MemoryRouter initialEntries={['/teacher/video-studio/project/script']}><Routes><Route path="/teacher/video-studio/:projectId/:nodeId" element={<RoutedWorkspaceHarness data={fixture()} mutate={mutate} />} /></Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Duyệt kịch bản & tiếp tục →' }));
  await waitFor(() => expect(screen.getByTestId('route-node')).toHaveTextContent('character-lan'));
  expect(within(inspector()).getByRole('heading', { name: 'Lan' })).toBeInTheDocument();
  expect(mutate).toHaveBeenCalledTimes(1);
});

it('shows queued script jobs as waiting for n8n instead of looking idle', () => {
  const state = fixture();
  state.jobs = [{ id: 'queued-script', stage: 'script', status: 'queued', target_id: null, created_at: '2026-10-19T00:00:00Z' }];
  render(<VideoFlowWorkspace data={state} catalog={catalog} mutate={vi.fn()} busy="" onError={vi.fn()} />);
  expect(within(inspector()).getByRole('status')).toHaveTextContent('Dispatcher chưa gửi job đến n8n');
  expect(screen.getByRole('button', { name: /Kịch bản: Kịch bản — Đang chờ n8n/ })).toBeInTheDocument();
});

it('locks dependent generation and export until their inputs are approved', () => {
  const state = fixture(true);
  render(<VideoFlowWorkspace data={state} catalog={catalog} mutate={vi.fn()} busy="" onError={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Ảnh mốc: 1\. Khu rừng/ }));
  expect(within(inspector()).getByRole('button', { name: 'Tạo ảnh' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: /Clip: 1\. Khu rừng/ }));
  expect(within(inspector()).getByRole('button', { name: 'Tạo clip' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: /Ghép video: Ghép video/ }));
  expect(within(inspector()).getByRole('button', { name: 'Ghép và xuất MP4' })).toBeDisabled();
});

it('supports character-free scripts and invalidates exports after clip changes', () => {
  const state = fixture(true);
  state.characters = [];
  state.shots[0].character_ids = [];
  let flow = buildVideoFlow(state);
  expect(nextVideoNode(flow).type).toBe('keyframe');
  state.shots[0].selected_keyframe_id = 'keyframe';
  state.shots[0].selected_clip_id = 'clip-new';
  state.assets = [{ id: 'export-old', kind: 'export', source_asset_ids: ['clip-old'] }];
  flow = buildVideoFlow(state);
  expect(nextVideoNode(flow).id).toBe('export');
  expect(flow.currentExports).toHaveLength(0);
  expect(flow.exports).toHaveLength(1);
});

it('updates node labels and the approval action when switching to English', async () => {
  render(<VideoFlowWorkspace data={fixture()} catalog={catalog} mutate={vi.fn()} busy="" onError={vi.fn()} />);
  await i18n.changeLanguage('en');
  expect(await screen.findByRole('button', { name: 'Approve script & continue →' })).toBeEnabled();
  expect(screen.getByRole('button', { name: /Assemble video: Assemble video/ })).toBeInTheDocument();
});
