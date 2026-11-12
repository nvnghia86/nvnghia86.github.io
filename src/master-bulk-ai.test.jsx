// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MasterBulkAiQuiz from './MasterBulkAiQuiz';

class MockEventSource {
  constructor(url) {
    this.url = url;
    this.readyState = 1;
    this.listeners = {};
  }
  addEventListener(event, cb) {
    this.listeners[event] = cb;
  }
  close() {
    this.readyState = 2;
  }
}

describe('MasterBulkAiQuiz bulk AI generation with per-thread providers & API keys', () => {
  beforeEach(() => {
    vi.stubGlobal('EventSource', MockEventSource);
    window.localStorage?.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('allows configuring provider & model per thread, entering API key per provider, and submitting with autoSave inactive', async () => {
    const fetchMock = vi.fn(async (url, options = {}) => {
      if (String(url).includes('/ai/quiz/bulk-runs') && options.method === 'POST') {
        const body = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              runId: 'bulk-run-1',
              status: 'generating',
              requestedCount: 8,
              completedCount: 1,
              failedCount: 0,
              savedCount: 1,
              autoSave: body.autoSave,
              saveActive: body.saveActive,
              jobs: [
                {
                  id: 'job-1',
                  position: 1,
                  status: 'completed',
                  attempts: 1,
                  workerId: 2,
                  provider: 'gemini',
                  model: 'gemini-2.0-flash',
                  grade: 'Lớp 4',
                  subject: 'Toán học',
                  questionType: 'comparison',
                  difficulty: 'Vừa',
                  lessonTitle: 'Ôn tập các số đến 100 000',
                  savedQuestionId: 'q-saved-1',
                  savedIsActive: false,
                  question: {
                    question: 'So sánh 45 120 ... 45 102',
                    type: 'comparison',
                    options: ['<', '=', '>'],
                    answer: 2,
                    isActive: false,
                  },
                },
              ],
            },
          }),
        };
      }
      if (String(url).includes('/ai/quiz/providers')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { items: [] },
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({ success: true, data: { lessons: [] } }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const onError = vi.fn();
    render(<MasterBulkAiQuiz onError={onError} />);

    // Multi-select Grade 3 in addition to defaults ('4', '5')
    fireEvent.click(screen.getByLabelText('Lớp 3'));
    // Multi-select So sánh (<, =, >) in addition to defaults ('multiple-choice', 'essay')
    fireEvent.click(screen.getByLabelText(/So sánh/i));
    // Multi-select Nâng cao in addition to defaults ('Dễ', 'Vừa', 'Khó')
    fireEvent.click(screen.getByLabelText('Nâng cao'));

    // Change Concurrency to 3 threads
    fireEvent.change(screen.getByLabelText(/Luồng chạy song song/i), { target: { value: '3' } });

    // Configure Thread #1 -> OpenRouter (openai/gpt-4o-mini)
    // Configure Thread #2 -> Google Gemini (gemini-2.0-flash)
    fireEvent.change(screen.getByLabelText('Provider Luồng 2'), { target: { value: 'gemini' } });
    // Configure Thread #3 -> Groq Cloud (llama-3.3-70b-versatile)
    fireEvent.change(screen.getByLabelText('Provider Luồng 3'), { target: { value: 'groq' } });

    // Enter API Key for each active provider
    fireEvent.change(screen.getByLabelText('API Key cho OpenRouter'), {
      target: { value: 'sk-or-test-key-111' },
    });
    fireEvent.change(screen.getByLabelText('API Key cho Google Gemini'), {
      target: { value: 'AIzaSy-test-key-222' },
    });
    fireEvent.change(screen.getByLabelText('API Key cho Groq Cloud'), {
      target: { value: 'gsk-test-key-333' },
    });

    // Submit bulk run
    const startBtn = screen.getByRole('button', { name: /Chạy tạo .* câu hỏi bằng AI/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/ai/quiz/bulk-runs'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    const postCall = fetchMock.mock.calls.find(([url, opts]) => String(url).includes('/ai/quiz/bulk-runs') && opts?.method === 'POST');
    const submittedPayload = JSON.parse(postCall[1].body);

    expect(submittedPayload.grades).toEqual(expect.arrayContaining(['3', '4', '5']));
    expect(submittedPayload.subjects).toEqual(expect.arrayContaining(['Toán học', 'Tiếng Việt', 'Tiếng Anh']));
    expect(submittedPayload.questionTypes).toEqual(expect.arrayContaining(['multiple-choice', 'comparison', 'essay']));
    expect(submittedPayload.difficulties).toEqual(expect.arrayContaining(['Dễ', 'Vừa', 'Khó', 'Nâng cao']));
    expect(submittedPayload.autoSave).toBe(true);
    expect(submittedPayload.saveActive).toBe(false);
    expect(submittedPayload.concurrency).toBe(3);

    // Verify per-provider API keys and per-thread worker configurations
    expect(submittedPayload.providerKeys).toMatchObject({
      openrouter: 'sk-or-test-key-111',
      gemini: 'AIzaSy-test-key-222',
      groq: 'gsk-test-key-333',
    });
    expect(submittedPayload.workers).toEqual([
      expect.objectContaining({
        workerId: 1,
        provider: 'openrouter',
        model: 'openai/gpt-4o-mini',
        apiKey: 'sk-or-test-key-111',
      }),
      expect.objectContaining({
        workerId: 2,
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        apiKey: 'AIzaSy-test-key-222',
      }),
      expect.objectContaining({
        workerId: 3,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        apiKey: 'gsk-test-key-333',
      }),
    ]);

    // Verify rendered job shows worker thread, provider, model, and Inactive status
    expect(await screen.findByText(/So sánh 45 120 \.\.\. 45 102/i)).toBeTruthy();
    expect(screen.getByText(/Luồng #2 · gemini \(gemini-2\.0-flash\)/i)).toBeTruthy();
    expect(screen.getByText(/Đã lưu \(Inactive\)/i)).toBeTruthy();
    expect(onError).not.toHaveBeenCalled();
  });
});
