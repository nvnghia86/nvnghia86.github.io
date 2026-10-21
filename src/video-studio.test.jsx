import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from './i18n';
import VideoStudio from './VideoStudio';

afterEach(cleanup);
beforeEach(async () => { await i18n.changeLanguage('vi'); });
function CurrentPath() { return <output data-testid="current-path">{useLocation().pathname}</output>; }

it('creates a project with separate LLM, image and video models', async () => {
  const id = '11111111-1111-4111-8111-111111111111';
  const catalog = {
    llm: [{ id: 'writer/model', provider: 'OpenRouter', available: true, pricing: { inputPerMillion: 1, outputPerMillion: 2 } }],
    image: [{ id: 'gemini-image', provider: 'OpenRouter', available: true, pricing: { items: [{ amount: 0.04, unit: 'image' }] } }],
    video: [
      { id: 'xai/grok-imagine-video', provider: '9Router', available: true },
      { id: 'google/veo-3.1', name: 'Veo 3.1', provider: 'OpenRouter', available: true, pricing: { items: [{ sku: 'generate', amount: 0.5, unit: 'second' }] } },
    ],
    tts: [{ id: 'openrouter/speech/model', name: 'Speech', provider: 'OpenRouter', available: true, pricing: { items: [] } }],
  };
  let saved;
  const api = vi.fn(async (path, options = {}) => {
    if (path === '/admin/video-models') return catalog;
    if (path === '/admin/video-projects' && !options.method) return { items: [] };
    if (path === '/admin/video-projects' && options.method === 'POST') {
      saved = JSON.parse(options.body);
      return { project: { id } };
    }
    if (path === `/admin/video-projects/${id}`) return { project: { id, title: 'Câu chuyện của Lan', story: saved.story, settings: saved, script: null, script_approved: false }, characters: [], shots: [], assets: [], jobs: [] };
    throw new Error(`Unexpected API: ${path}`);
  });
  const { container } = render(<MemoryRouter initialEntries={['/teacher/video-studio']}><CurrentPath /><Routes><Route path="/teacher/video-studio/:projectId?/:nodeId?" element={<VideoStudio api={api} apiBase="/api/v1" onError={vi.fn()} />} /></Routes></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Dự án mới' }));
  fireEvent.change(screen.getByLabelText('Tên dự án'), { target: { value: 'Câu chuyện của Lan' } });
  fireEvent.change(screen.getByLabelText('Nội dung hoặc cốt truyện'), { target: { value: 'Lan bước vào một khu rừng bí ẩn và gặp người bạn mới.' } });
  const videoModelSelect = screen.getByLabelText('Model tạo video');
  expect(videoModelSelect).toHaveValue('google/veo-3.1');
  expect(videoModelSelect).not.toHaveTextContent('9Router');
  expect(videoModelSelect).toHaveTextContent('Veo 3.1 · OpenRouter · Từ generate: 0,5');
  fireEvent.click(screen.getByRole('button', { name: 'Tạo dự án' }));
  expect(await screen.findByRole('heading', { name: 'Câu chuyện của Lan' })).toBeInTheDocument();
  expect(container.querySelector('.video-flow-layout > .video-flow-map')).toBeInTheDocument();
  expect(container.querySelector('.video-flow-layout > .video-node-inspector')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent(`/teacher/video-studio/${id}/script`));
  expect(saved.models).toEqual({ llm: 'writer/model', image: 'gemini-image', video: 'google/veo-3.1', tts: 'openrouter/speech/model' });
});
