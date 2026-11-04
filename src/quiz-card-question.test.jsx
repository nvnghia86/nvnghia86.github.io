import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from './i18n';
import { QuizCardHost } from './QuizCardSession';

const socket=vi.hoisted(()=>({update:null}));
const sound=vi.hoisted(()=>({settings:{enabled:false,music:false,volume:.8},onSettingsChange:()=>{},audio:{setMusic:vi.fn(),play:vi.fn()}}));
vi.mock('./use-game-audio',()=>({useGameAudio:()=>sound}));
vi.mock('./quiz-card-hooks',async original=>({...await original(),useQuizSocket:(_api,_id,_role,update)=>{socket.update=update;return{connection:'connected',error:''};}}));
const error=vi.fn();
beforeEach(async()=>{await i18n.changeLanguage('vi');error.mockClear();});
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();});

describe('host question review',()=>{
  it('closes on timeout, highlights the answer and counts, and holds until the teacher moves on',async()=>{
    vi.useFakeTimers();const now=Date.now();
    const playing={id:'room',title:'Toán 4A',status:'playing',questionStatus:'open',currentQuestion:0,questionCount:2,timeLimitSeconds:1,questionStartedAt:new Date(now).toISOString(),version:3,currentQuestionData:{id:'q1',question:'1 + 1 = ?',options:['1','2','3','4']},players:[]};
    const closed={...playing,questionStatus:'closed',version:4,questionSummary:{questionId:'q1',position:0,correctAnswer:'B',counts:{A:1,B:2,C:0,D:0},answeredCount:3}};
    const next={...playing,currentQuestion:1,questionStartedAt:new Date(now+60000).toISOString(),currentQuestionData:{...playing.currentQuestionData,id:'q2'}};
    const api=vi.fn(async path=>path.endsWith('/close')?closed:path.endsWith('/next')?next:playing);
    const {container}=await act(async()=>render(<QuizCardHost api={api} API="http://localhost/api/v1" sessionId="room" onError={error} />));
    expect(screen.getByRole('button',{name:'Câu tiếp theo'})).toBeDisabled();
    await act(async()=>vi.advanceTimersByTimeAsync(1250));
    expect(api).toHaveBeenCalledWith('/quiz-sessions/room/close',expect.objectContaining({method:'POST',body:JSON.stringify({questionId:'q1'})}));
    expect(api.mock.calls.some(([path])=>path.endsWith('/next'))).toBe(false);
    expect(container.querySelector('.card-option-grid .is-correct')).toHaveTextContent('B2');
    expect(container.querySelector('.card-option-grid .is-correct')).toHaveTextContent('2 học sinh chọn');
    expect(container.querySelectorAll('.card-option-result')).toHaveLength(4);
    expect(screen.getByRole('button',{name:'Kết thúc câu'})).toBeDisabled();
    await act(async()=>vi.advanceTimersByTimeAsync(30000));
    expect(api.mock.calls.filter(([path])=>path.endsWith('/close'))).toHaveLength(1);
    act(()=>socket.update({...playing,version:999}));expect(screen.getByRole('button',{name:'Kết thúc câu'})).toBeDisabled();
    await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Câu tiếp theo'})));
    expect(api).toHaveBeenCalledWith('/quiz-sessions/room/next',expect.objectContaining({method:'POST'}));
    expect(container.querySelector('.card-option-grid .is-correct')).toBeNull();expect(error).not.toHaveBeenCalled();
  });
});
