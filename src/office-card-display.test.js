// @vitest-environment node
import { it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const { JSDOM } = createRequire(import.meta.url)('jsdom');
const html=readFileSync(new URL('../public/office/card-game.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../public/office/card-game.js',import.meta.url),'utf8');
function display({query='',status='playing',closed=false,run='',saved={},players=Array.from({length:33},(_,index)=>({nickname:`Học sinh ${index+1}`,markerId:index+1,score:33-index}))}={}) {
  const dom=new JSDOM(html,{url:`https://quiz.example/office/card-game.html${query}#game=${'a'.repeat(48)}${run ? '&run='+run : ''}`,runScripts:'outside-only',pretendToBeVisual:true}),window=dom.window,requests=[];
  for (const [suffix, value] of Object.entries(saved)) window.localStorage.setItem(`quizzz.card-display.${'a'.repeat(48)}${suffix}`, JSON.stringify(value));
  window.localStorage.setItem('quizzz.locale','en');Object.defineProperty(window.navigator,'language',{value:'en-US'});
  window.setTimeout=()=>1;window.setInterval=()=>1;
  window.XMLHttpRequest=class {
    open(method,url){this.method=method;this.url=url;}setRequestHeader(){}
    send(){requests.push([this.method,this.url]);this.status=200;this.responseText=JSON.stringify(this.method==='POST'?{id:'display',displayToken:'b'.repeat(48)}:{id:'display',title:'Toán lớp 4',className:'4A',questionCount:2,pairUrl:'https://quiz.example/pair',qr:'data:image/png;base64,',paired:true,session:{id:'room',status,currentQuestion:0,questionCount:2,questionStatus:closed?'closed':'open',questionStartedAt:new Date().toISOString(),timeLimitSeconds:30,currentQuestionData:status==='playing'?{id:'q1',question:'Tính A = (a + b) x c - a.',options:['89','107','125','143']}:null,questionSummary:closed?{correctAnswer:'B',counts:{A:1,B:2,C:0,D:0}}:null,players}});this.onload();}
  };
  window.eval(script);
  return {window,document:window.document,requests,close:()=>window.close()};
}
it('uses Vietnamese for slides even with English Office/browser and saved English locale',()=>{
  const view=display();try{expect(view.document.documentElement.lang).toBe('vi');expect(view.document.querySelector('#ranking-title').textContent).toBe('Bảng xếp hạng');expect([...view.document.querySelectorAll('.option>b')].map(el=>el.textContent)).toEqual(['A.','B.','C.','D.']);expect(view.document.querySelector('.option>span').textContent).toBe('89');expect(view.document.querySelectorAll('.rank-score')).toHaveLength(33);expect(view.document.querySelector('.rank-score').textContent).toBe('33');expect(view.document.querySelector('#ranking').tabIndex).toBe(0);expect(view.requests.filter(([method])=>method==='POST')).toHaveLength(1);}finally{view.close();}
});
it('shows the per-question chart and every student answer in Vietnamese and explicit English',()=>{
  const players = [
    { nickname: 'Nguyễn Minh An', markerId: 1, score: 1, answer: 'B' },
    { nickname: 'Nguyễn Minh An 2', markerId: 2, score: 0, answer: 'A' },
    { nickname: 'Lê Ánh', markerId: 3, score: 1, answer: 'B' },
    { nickname: 'Trần Bình', markerId: 4, score: 0, answer: null },
  ];
  for(const query of ['', '?lang=en']){const view=display({query,closed:true,players});try{
    expect(view.document.querySelector('#stage')).toHaveProperty('className','is-reviewing');
    expect(view.document.querySelector('#question-results-title').textContent).toBe(query?'Question results':'Tổng hợp kết quả câu hỏi');
    expect(view.document.querySelector('#correct-choice').textContent).toBe(query?'Correct answer B':'Đáp án đúng B');
    expect([...view.document.querySelectorAll('.answer-count')].map(el=>el.textContent)).toEqual(['1','2','0','0']);
    expect(view.document.querySelector('.answer-column.correct .answer-letter').textContent).toBe('B');
    expect([...view.document.querySelectorAll('.student-result-name')].map(el=>el.textContent)).toEqual(['An','An','Ánh','Bình']);
    expect(view.document.querySelectorAll('.student-result')).toHaveLength(4);
    expect(view.document.querySelectorAll('.student-result.correct')).toHaveLength(2);
    expect(view.document.querySelectorAll('.student-result.incorrect')).toHaveLength(1);
    expect(view.document.querySelectorAll('.student-result.unanswered')).toHaveLength(1);
    expect(view.document.querySelector('.student-result').title).toBe('Nguyễn Minh An');
    expect(view.document.querySelector('.student-result.unanswered .student-result-answer').textContent).toBe('—');
    expect(view.document.documentElement.lang).toBe(query?'en':'vi');
  }finally{view.close();}}
});
it('keeps waiting and finished messages in Vietnamese',()=>{
  for(const status of ['lobby','finished']){const view=display({status});try{expect(view.document.querySelector('#notice').textContent).toBe(status==='lobby'?'Đã kết nối. Chờ bấm Bắt đầu trên điện thoại.':'Trò chơi đã kết thúc.');}finally{view.close();}}
});
it('uses the final leaderboard order for the podium, including tied scores and small classes', () => {
  const players = [
    { nickname: 'Mai', markerId: 4, score: 2 }, { nickname: 'An', markerId: 2, score: 5 },
    { nickname: 'Lan', markerId: 3, score: 4 }, { nickname: 'Hà', markerId: 1, score: 5 },
  ];
  const view = display({ status: 'finished', players });
  try {
    expect(view.document.querySelector('#stage')).toHaveProperty('className', 'is-finished');
    expect([...view.document.querySelectorAll('.podium-name')].map(node => node.textContent)).toEqual(['Hà', 'An', 'Lan']);
    expect(view.document.querySelector('.podium-1 .podium-score').textContent).toBe('5 điểm');
    expect(view.document.querySelectorAll('.rank-row')).toHaveLength(4);
  } finally { view.close(); }
  const small = display({ status: 'finished', query: '?lang=en', players: players.slice(0, 1) });
  try {
    expect(small.document.querySelectorAll('.podium-place')).toHaveLength(1);
    expect(small.document.querySelector('#celebration-title').textContent).toBe('Well done, everyone!');
  } finally { small.close(); }
});
it('opens a fresh replay instead of resuming the finished display, and resumes that replay on refresh', () => {
  const run = '11111111-1111-4111-8111-111111111111';
  const saved = { '': { id: 'finished', displayToken: 'old' } };
  const first = display({ run, saved });
  try {
    expect(first.requests[0][0]).toBe('POST');
    expect(JSON.parse(first.window.localStorage.getItem(`quizzz.card-display.${'a'.repeat(48)}`))).toEqual(saved['']);
    saved['.' + run] = JSON.parse(first.window.localStorage.getItem(`quizzz.card-display.${'a'.repeat(48)}.${run}`));
  } finally { first.close(); }
  const resumed = display({ run, saved });
  try { expect(resumed.requests[0]).toEqual(['GET', expect.stringContaining('/displays/display?token=')]); }
  finally { resumed.close(); }
});
