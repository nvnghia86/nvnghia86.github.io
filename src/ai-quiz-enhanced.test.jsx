import { expect, it } from 'vitest';
import { normalizeAiRun } from './AiQuizEnhanced';

it('keeps AI run rendering safe when a streamed payload is incomplete or its geometry is invalid', () => {
  expect(normalizeAiRun(null)).toBeNull();
  const run = normalizeAiRun({
    runId: 'run-1',
    status: 'generating',
    jobs: [{ id: 'job-1', position: 1, status: 'completed', question: { question: 'Câu hỏi', options: 'không phải mảng', geometry: { boundingBox: [0, 0, 0, 0], elements: [] } } }],
  });
  expect(run.jobs).toHaveLength(1);
  expect(run.jobs[0].question.options).toEqual([]);
  expect(run.jobs[0].question.geometry).toBeNull();
});
