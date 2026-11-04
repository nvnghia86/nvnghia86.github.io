import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import i18n from './i18n';
import PreparedCardGameDetail from './PreparedCardGameDetail';
import { PreparedCardGames } from './PreparedCardGames';

const questions=[{id:'q1',question:'2 + 2 = ?',options:['1','2','3','4'],answer:3,type:'multiple-choice',geometry:{imageUrl:'https://quiz.test/square.png'}},{id:'q2',question:'3 x 3 = ?',options:['6','7','8','9'],answer:3,type:'multiple-choice'}];
const original={id:'game',title:'Ôn tập lớp 4',classId:'class',className:'4A',timeLimitSeconds:20,questions,questionCount:2,version:1,canEdit:true,runCount:0,runs:[],playStatus:'notStarted',presentationKey:'abc'};
beforeEach(async()=>{await i18n.changeLanguage('vi');});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
function setup({game=original,rejectSave=false,afterFailure,entry='/teacher/card-scan/games/game'}={}){
 let current=structuredClone(game);
 const api=vi.fn(async(path,request)=>{
  if(path==='/card-games/game/sharing'){
   const {isShared}=JSON.parse(request.body);current={...current,isShared};return {isShared};
  }
  if(path==='/card-games/game'&&request?.method==='PATCH'){
   if(rejectSave){if(afterFailure)current=afterFailure;throw new Error('Game đã diễn ra, không thể chỉnh sửa nội dung.');}
   const input=JSON.parse(request.body);current={...current,...input,version:current.version+1,questions:input.questionEdits.map(edit=>({...current.questions.find(q=>q.id===edit.id),...edit})),questionCount:input.questionIds.length};return current;
  }
  if(path==='/card-games/game')return current;
  if(path==='/classes')return{items:[{id:'class',name:'4A'},{id:'class2',name:'4B'}]};
  if(path==='/questions')return{items:questions};
  if(path.startsWith('/card-games/game/runs/'))return{run:{id:'run',status:'finished',startedAt:'2026-11-04T10:00:00Z',finishedAt:'2026-11-04T10:03:00Z'},studentCount:2,questionCount:2,completedQuestions:1,accuracy:50,averageScore:0.5,students:[{id:'student1',nickname:'Nguyễn Minh An',markerId:1,score:1,correctCount:1,incorrectCount:0,unansweredCount:0},{id:'student2',nickname:'Trần Gia Bảo',markerId:2,score:0,correctCount:0,incorrectCount:1,unansweredCount:0}],questions:questions.map((q,i)=>({...q,position:i,correctAnswer:'D',wasAsked:i===0,isClosed:i===0,counts:{A:1,B:0,C:0,D:1},answeredCount:i===0?2:0,unansweredCount:i===0?0:null}))};
  throw new Error(path);
 });
 render(<MemoryRouter initialEntries={[entry]}><Routes><Route path="/teacher/card-scan/games/:gameId" element={<PreparedCardGameDetail api={api}/>}/></Routes></MemoryRouter>);
 return{api};
}

it('shows saved questions, correct answers and diagrams and edits only the saved snapshot',async()=>{
 const {api}=setup();await screen.findByRole('heading',{name:original.title});
 expect(screen.getByRole('img')).toHaveAttribute('src','https://quiz.test/square.png');expect(screen.getAllByText('Đáp án đúng')).toHaveLength(2);
 fireEvent.click(screen.getByRole('button',{name:'Chỉnh sửa quiz'}));await screen.findByRole('option',{name:'4B'});
 fireEvent.change(screen.getByLabelText('Tên quiz'),{target:{value:'Ôn tập đã sửa'}});
 fireEvent.change(screen.getByLabelText('Lớp'),{target:{value:'class2'}});
 fireEvent.change(screen.getByLabelText('Thời gian mỗi câu (giây)'),{target:{value:'40'}});
 fireEvent.change(screen.getAllByLabelText('Nội dung câu hỏi')[0],{target:{value:'A = (a + b) x c - a'}});
 fireEvent.change(screen.getAllByLabelText('Đáp án A')[0],{target:{value:'107'}});
 fireEvent.click(screen.getAllByRole('radio',{name:'Đáp án đúng'})[0]);
 fireEvent.click(screen.getAllByRole('button',{name:'Đưa câu xuống'})[0]);
 fireEvent.click(screen.getByRole('button',{name:'Lưu thay đổi'}));await screen.findByText(/Đã lưu thay đổi/);
 const writes=api.mock.calls.filter(([,request])=>request?.method==='PATCH');expect(writes).toHaveLength(1);
 const payload=JSON.parse(writes[0][1].body);expect(payload).toMatchObject({title:'Ôn tập đã sửa',version:1,classId:'class2',timeLimitSeconds:40,pin:'',questionIds:['q2','q1']});expect(payload.questionEdits[1]).toMatchObject({question:'A = (a + b) x c - a',answer:0,options:['107','2','3','4']});
 expect(api.mock.calls.every(([path])=>!/^\/questions\//.test(path))).toBe(true);
});

it('keeps question choices when filtering and can remove and add a question while editing',async()=>{
 setup({entry:'/teacher/card-scan/games/game?edit=1'});await screen.findByRole('button',{name:'Chọn câu hỏi (tối đa 30)'});await screen.findByRole('option',{name:'4B'});
 fireEvent.click(screen.getAllByRole('button',{name:'Bỏ câu khỏi quiz'})[0]);expect(screen.getAllByLabelText('Nội dung câu hỏi')).toHaveLength(1);
 fireEvent.click(screen.getByRole('button',{name:'Chọn câu hỏi (tối đa 30)'}));const dialog=await screen.findByRole('dialog');
 const box=within(dialog).getByRole('checkbox',{name:/2 \+ 2/});expect(box).not.toBeChecked();fireEvent.click(box);expect(box).toBeChecked();
 fireEvent.click(within(dialog).getByRole('button',{name:/Xong/}));expect(screen.getAllByLabelText('Nội dung câu hỏi')).toHaveLength(2);
 fireEvent.click(screen.getByRole('button',{name:'Hủy chỉnh sửa'}));expect(screen.getByRole('button',{name:'Chỉnh sửa quiz'})).toBeInTheDocument();
});

it('locks played quizzes and shows separate run statistics with highlighted correct options in both languages',async()=>{
 const game={...original,canEdit:false,playStatus:'played',runCount:2,runs:[{id:'run2',status:'finished',startedAt:'2026-11-04T10:00:00Z'},{id:'run1',status:'finished',startedAt:'2026-11-03T10:00:00Z'}]};
 const {api}=setup({game,entry:'/teacher/card-scan/games/game?edit=1&tab=statistics'});await screen.findByText('Nguyễn Minh An');
 expect(screen.queryByRole('button',{name:'Chỉnh sửa quiz'})).toBeNull();expect(screen.getByText('Nội dung được khóa',{exact:false})).toBeInTheDocument();
 expect(screen.getByText('50%')).toBeInTheDocument();expect(screen.getByText('1/2')).toBeInTheDocument();
 const correct=screen.getAllByText('1 chọn').find(node=>node.parentElement.classList.contains('is-correct'));expect(correct).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Chọn lượt chơi'),{target:{value:'run1'}});await waitFor(()=>expect(api).toHaveBeenCalledWith('/card-games/game/runs/run1',{silent:true}));
 fireEvent.click(screen.getAllByRole('button',{name:'Làm mới'}).at(-1));await screen.findByText('Nguyễn Minh An');expect(screen.getByLabelText('Chọn lượt chơi')).toHaveValue('run1');
 await act(async()=>i18n.changeLanguage('en'));expect(screen.getByRole('heading',{name:'Student results'})).toBeInTheDocument();expect(screen.getByLabelText('Choose a run')).toHaveValue('run1');
});

it('handles a start on another device by rejecting a stale edit and showing the locked quiz',async()=>{
 const locked={...original,canEdit:false,playStatus:'playing',runs:[]};
 setup({rejectSave:true,afterFailure:locked,entry:'/teacher/card-scan/games/game?edit=1'});await screen.findByRole('button',{name:'Lưu thay đổi'});fireEvent.click(screen.getByRole('button',{name:'Lưu thay đổi'}));
 await screen.findByRole('alert');await waitFor(()=>expect(screen.queryByRole('button',{name:'Lưu thay đổi'})).toBeNull());expect(screen.queryByRole('button',{name:'Chỉnh sửa quiz'})).toBeNull();
});

it('retains entered changes on a version conflict and lets the teacher explicitly reload the latest version',async()=>{
 setup({rejectSave:true,afterFailure:{...original,version:2,title:'Bản sửa từ máy khác'},entry:'/teacher/card-scan/games/game?edit=1'});
 await screen.findByLabelText('Tên quiz');fireEvent.change(screen.getByLabelText('Tên quiz'),{target:{value:'Nội dung đang nhập'}});fireEvent.click(screen.getByRole('button',{name:'Lưu thay đổi'}));
 await screen.findByRole('button',{name:'Tải lại bản mới nhất'});expect(screen.getByLabelText('Tên quiz')).toHaveValue('Nội dung đang nhập');expect(screen.getByRole('button',{name:'Lưu thay đổi'})).toBeDisabled();
 fireEvent.click(screen.getByRole('button',{name:'Tải lại bản mới nhất'}));expect(screen.getByLabelText('Tên quiz')).toHaveValue('Bản sửa từ máy khác');expect(screen.getByRole('button',{name:'Lưu thay đổi'})).not.toBeDisabled();
});

it('offers details, edit and results icons according to saved game state',async()=>{
 const api=vi.fn(async()=>({items:[original,{...original,id:'played',canEdit:false,runCount:1,playStatus:'played'}]}));
 render(<MemoryRouter><PreparedCardGames api={api} API="/api/v1" onError={vi.fn()}/></MemoryRouter>);
 await screen.findAllByRole('button',{name:'Xem chi tiết'});expect(screen.getAllByRole('button',{name:'Chỉnh sửa quiz'})).toHaveLength(1);expect(screen.getAllByRole('button',{name:'Thống kê lượt chơi'})).toHaveLength(1);
});

it('opens a distinct replay and lets the owner share or unshare a finished quiz', async () => {
 const open = vi.spyOn(window, 'open').mockImplementation(() => null);
 const {api} = setup({game:{...original,canEdit:false,playStatus:'played'}});
 const replay = await screen.findByRole('button',{name:'Chơi lại'});
 fireEvent.click(replay);fireEvent.click(replay);
 expect(open.mock.calls[0][0]).toMatch(/#game=abc&run=[a-f0-9-]{36}$/);
 expect(open.mock.calls[0][0]).not.toBe(open.mock.calls[1][0]);
 fireEvent.click(screen.getByRole('button',{name:'Chia sẻ vào kho dùng chung'}));
 fireEvent.click(await screen.findByRole('button',{name:'Dừng chia sẻ'}));
 await screen.findByText('Đã dừng chia sẻ quiz.');
 expect(api.mock.calls.filter(([path])=>path.endsWith('/sharing')).map(([,request])=>JSON.parse(request.body).isShared)).toEqual([true,false]);
});

it('copies a library quiz into the chosen class with a separate PIN', async () => {
 const api = vi.fn(async (path, request) => {
  if(path==='/card-games')return {items:[]};
  if(path==='/card-games/shared')return {items:[{id:'shared',title:'Quiz của đồng nghiệp',authorName:'Giáo viên B',questionCount:2,timeLimitSeconds:20}]};
  if(path==='/card-games/shared/shared/copies'&&request.method==='POST')return {id:'copied'};
  throw new Error(path);
 });
 render(<MemoryRouter><Routes>
   <Route path="/" element={<PreparedCardGames api={api} API="/api/v1" onError={vi.fn()} classes={[{id:'class4b',name:'4B'}]} />} />
   <Route path="/teacher/card-scan/games/copied" element={<h1>Đã mở bản sao</h1>} />
 </Routes></MemoryRouter>);
 fireEvent.click(screen.getByRole('button',{name:'Mở kho dùng chung'}));
 fireEvent.click(await screen.findByRole('button',{name:'Dùng quiz này'}));
 expect(screen.getByRole('button',{name:'Lưu bản sao'})).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Lớp'),{target:{value:'class4b'}});
 fireEvent.change(screen.getByLabelText('Mã điều khiển 6 số'),{target:{value:'012345'}});
 fireEvent.click(screen.getByRole('button',{name:'Lưu bản sao'}));
 await screen.findByRole('heading',{name:'Đã mở bản sao'});
 const [,request] = api.mock.calls.find(([path])=>path.endsWith('/copies'));
 expect(JSON.parse(request.body)).toEqual({classId:'class4b',pin:'012345',copyId:expect.stringMatching(/^[a-f0-9-]{36}$/)});
});
