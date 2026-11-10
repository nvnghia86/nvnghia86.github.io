import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import i18n from './i18n';
import { CardGamePair, PreparedCardGames } from './PreparedCardGames';
import { GameRoomBuilder } from './GameRoomBuilder';

beforeEach(async () => { await i18n.changeLanguage('vi'); window.location.hash=''; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.location.hash=''; });
function builder() {
 const game={id:'saved',title:'Bài dạy',classId:'4a',className:'4A',questionCount:1,timeLimitSeconds:20,presentationKey:'a'.repeat(48)};
 let saved=false;
 const api=vi.fn(async(path,request)=>{
  if(path.startsWith('/quiz-sets'))return{items:[{id:'quiz',title:'Ôn tập',questionCount:1}]};
  if(path==='/questions')return{items:[]};
  if(path==='/classes')return{items:[{id:'4a',name:'4A',studentCount:33}]};
  if(path==='/card-games'&&request?.method==='POST'){saved=true;return game;}
  if(path==='/card-games')return{items:saved?[game]:[]};
  if(path==='/rooms'&&request?.method==='POST')return{room:{id:'direct-room'}};
  throw new Error(path);
 });
 const onError=vi.fn();
 render(<MemoryRouter><GameRoomBuilder mode="card-scan" api={api} API="/api/v1" onError={onError}/></MemoryRouter>);
 return {api,onError};
}
async function chooseQuizAndClass(){
 await screen.findByRole('option',{name:'Ôn tập · 1 câu'});
 const selectors=screen.getAllByRole('combobox');
 fireEvent.change(selectors[0],{target:{value:'quiz'}});fireEvent.change(selectors[1],{target:{value:'4a'}});
}
it('keeps direct web play as the default and uses the existing room endpoint with no PIN',async()=>{
 const {api,onError}=builder();await chooseQuizAndClass();
 expect(screen.getByRole('radio',{name:'Chơi ngay trên web'})).toBeChecked();expect(screen.queryByLabelText('Mã điều khiển 6 số')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:/Tạo phòng và vào màn điều khiển/}));
 await waitFor(()=>expect(window.location.hash).toBe('#/quiz/direct-room/host'));
 expect(api.mock.calls.filter(([,options])=>options?.method==='POST').map(([url])=>url)).toEqual(['/rooms']);expect(onError).not.toHaveBeenCalled();
});
it('saves a prepared game without opening or starting a room and keeps a leading-zero PIN',async()=>{
 const {api,onError}=builder();await chooseQuizAndClass();fireEvent.click(screen.getByRole('radio',{name:'Lưu game để chơi sau / PowerPoint'}));
 fireEvent.change(screen.getByLabelText('Mã điều khiển 6 số'),{target:{value:'012345'}});
 fireEvent.click(screen.getByRole('button',{name:'Lưu game để chơi sau'}));await screen.findByRole('link',{name:'Mở trình chiếu'});
 const posts=api.mock.calls.filter(([,options])=>options?.method==='POST');expect(posts).toHaveLength(1);expect(posts[0][0]).toBe('/card-games');expect(JSON.parse(posts[0][1].body).pin).toBe('012345');expect(window.location.hash).toBe('');expect(screen.getByLabelText('Mã điều khiển 6 số')).toHaveValue('');expect(onError).not.toHaveBeenCalled();
 await act(async()=>i18n.changeLanguage('en'));expect(screen.getByRole('button',{name:'Export PowerPoint'})).toBeInTheDocument();expect(screen.getByRole('radio',{name:'Play now on the web'})).toBeInTheDocument();
});
it('requires a correct PIN before navigating to the scanner and never requests login or starts the game',async()=>{
 let valid=false;const api=vi.fn(async(path,request)=>{
  if(request?.method==='POST'){if(JSON.parse(request.body).pin!=='012345')throw new Error('Mã điều khiển không đúng.');valid=true;return{sessionId:'room',scannerToken:'token'};}
  return{title:'Quiz ở nhà',className:'4A'};
 });
 render(<MemoryRouter initialEntries={['/card-pair/key']}><Routes><Route path="/card-pair/:pairKey" element={<CardGamePair api={api}/>}/><Route path="/quiz/:id/scan" element={<h1>Scanner connected</h1>}/></Routes></MemoryRouter>);
 const pin=await screen.findByLabelText('Mã điều khiển 6 số');fireEvent.change(pin,{target:{value:'999999'}});fireEvent.click(screen.getByRole('button',{name:'Kết nối'}));await screen.findByRole('alert');expect(valid).toBe(false);expect(screen.queryByText('Scanner connected')).toBeNull();
 fireEvent.change(pin,{target:{value:'012345'}});fireEvent.click(screen.getByRole('button',{name:'Kết nối'}));await screen.findByRole('heading',{name:'Scanner connected'});expect(valid).toBe(true);expect(api.mock.calls.every(([url])=>url.startsWith('/card-games/pair/'))).toBe(true);
});
it('offers retry after a pairing page load fails instead of leaving an endless loading state',async()=>{
 const api=vi.fn().mockRejectedValueOnce(new Error('Mất kết nối')).mockResolvedValue({title:'Quiz ở nhà',className:'4A'});
 render(<MemoryRouter initialEntries={['/card-pair/key']}><Routes><Route path="/card-pair/:pairKey" element={<CardGamePair api={api}/>}/></Routes></MemoryRouter>);
 await screen.findByRole('alert');expect(screen.queryByRole('status')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Thử lại'}));await screen.findByLabelText('Mã điều khiển 6 số');expect(api).toHaveBeenCalledTimes(2);
});
it('force finishes an active saved game after confirmation and refreshes its status',async()=>{
 let playing=true;
 const game={id:'saved',title:'Bài dạy',className:'4A',questionCount:2,timeLimitSeconds:20,presentationKey:'a'.repeat(48),runCount:1,playStatus:'playing'};
 const api=vi.fn(async(path,request)=>{
  if(path==='/card-games/saved/force-finish'&&request?.method==='POST'){playing=false;return{finishedCount:1};}
  if(path==='/card-games')return{items:[{...game,playStatus:playing?'playing':'played'}]};
  throw new Error(path);
 });
 vi.spyOn(window,'confirm').mockReturnValue(true);
 render(<MemoryRouter><PreparedCardGames api={api} API="/api/v1" onError={vi.fn()}/></MemoryRouter>);
 fireEvent.click(await screen.findByRole('button',{name:'Buộc kết thúc'}));
 await waitFor(()=>expect(screen.getByText('Đã diễn ra')).toBeInTheDocument());
 expect(window.confirm).toHaveBeenCalledWith('Buộc kết thúc tất cả lượt đang chơi của game này và lưu kết quả hiện tại?');
 expect(api).toHaveBeenCalledWith('/card-games/saved/force-finish',{method:'POST'});
 expect(screen.queryByRole('button',{name:'Buộc kết thúc'})).toBeNull();
});
