// @vitest-environment node
import { it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const { JSDOM } = createRequire(import.meta.url)('jsdom');
const html=readFileSync(new URL('../public/office/card-game.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../public/office/card-game.js',import.meta.url),'utf8');
function display({query='',status='playing',closed=false}={}) {
  const dom=new JSDOM(html,{url:`https://quiz.example/office/card-game.html${query}#game=${'a'.repeat(48)}`,runScripts:'outside-only',pretendToBeVisual:true}),window=dom.window,requests=[];
  window.localStorage.setItem('quizzz.locale','en');Object.defineProperty(window.navigator,'language',{value:'en-US'});
  window.setTimeout=()=>1;window.setInterval=()=>1;
  window.XMLHttpRequest=class {
    open(method,url){this.method=method;this.url=url;}setRequestHeader(){}
    send(){requests.push([this.method,this.url]);this.status=200;this.responseText=JSON.stringify(this.method==='POST'?{id:'display',displayToken:'b'.repeat(48)}:{id:'display',title:'Toán lớp 4',className:'4A',questionCount:2,pairUrl:'https://quiz.example/pair',qr:'data:image/png;base64,',paired:true,session:{id:'room',status,currentQuestion:0,questionCount:2,questionStatus:closed?'closed':'open',questionStartedAt:new Date().toISOString(),timeLimitSeconds:30,currentQuestionData:status==='playing'?{id:'q1',question:'Tính A = (a + b) x c - a.',options:['89','107','125','143']}:null,questionSummary:closed?{correctAnswer:'B',counts:{A:1,B:2,C:0,D:0}}:null,players:Array.from({length:33},(_,index)=>({nickname:`Học sinh ${index+1}`,markerId:index+1,score:33-index}))}});this.onload();}
  };
  window.eval(script);
  return {window,document:window.document,requests,close:()=>window.close()};
}
it('uses Vietnamese for slides even with English Office/browser and saved English locale',()=>{
  const view=display();try{expect(view.document.documentElement.lang).toBe('vi');expect(view.document.querySelector('#ranking-title').textContent).toBe('Bảng xếp hạng');expect([...view.document.querySelectorAll('.option>b')].map(el=>el.textContent)).toEqual(['A.','B.','C.','D.']);expect(view.document.querySelector('.option>span').textContent).toBe('89');expect(view.document.querySelectorAll('.rank-score')).toHaveLength(33);expect(view.document.querySelector('.rank-score').textContent).toBe('33');expect(view.document.querySelector('#ranking').tabIndex).toBe(0);expect(view.requests.filter(([method])=>method==='POST')).toHaveLength(1);}finally{view.close();}
});
it('keeps correct answer counts/highlights in Vietnamese and supports explicitly requested English',()=>{
  for(const query of ['', '?lang=en']){const view=display({query,closed:true});try{expect(view.document.querySelector('.correct>b').textContent).toBe('B.');expect(view.document.querySelector('.correct small').textContent).toBe(query?'2 students selected · Correct answer':'2 học sinh chọn · Đáp án đúng');expect(view.document.documentElement.lang).toBe(query?'en':'vi');}finally{view.close();}}
});
it('keeps waiting and finished messages in Vietnamese',()=>{
  for(const status of ['lobby','finished']){const view=display({status});try{expect(view.document.querySelector('#notice').textContent).toBe(status==='lobby'?'Đã kết nối. Chờ bấm Bắt đầu trên điện thoại.':'Trò chơi đã kết thúc.');}finally{view.close();}}
});
