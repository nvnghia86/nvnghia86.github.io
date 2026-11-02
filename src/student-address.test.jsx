import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import StudentAddressFields from './StudentAddressFields';
import ClassStudentPicker from './ClassStudentPicker';

describe('student personal address', () => {
 it('clears commune when changing province and loads the matching commune list', async () => {
  const request=vi.fn(async path=>path==='/locations/provinces'?{items:[{id:'p1',name:'Tỉnh A'},{id:'p2',name:'Tỉnh B'}]}:path.includes('p1')?{items:[{id:'c1',name:'Xã A'}]}:{items:[{id:'c2',name:'Xã B'}]});
  function Form(){const [value,setValue]=useState({provinceId:'p1',communeId:'c1',village:''});return <><StudentAddressFields value={value} onChange={patch=>setValue(current=>({...current,...patch}))} request={request}/><output data-testid="value">{JSON.stringify(value)}</output></>;}
  render(<Form/>);
  await screen.findByRole('option',{name:'Xã A'});
  fireEvent.change(screen.getByLabelText('Tỉnh / thành phố'),{target:{value:'p2'}});
  await screen.findByRole('option',{name:'Xã B'});
  expect(screen.getByLabelText('Xã / phường').value).toBe('');
  fireEvent.change(screen.getByLabelText('Thôn / xóm / số nhà, đường'),{target:{value:'Thôn An Bình'}});
  expect(screen.getByTestId('value').textContent).toContain('Thôn An Bình');
  expect(screen.queryByRole('option',{name:'Xã A'})).toBeNull();
  cleanup();
 });
 it('shows and filters individual student village, commune and province',async()=>{
  const request=vi.fn(async()=>({items:[{studentId:'s1',name:'Nguyễn An',village:'Thôn An Bình',commune:'Xã Tân Bình',province:'Tỉnh A'}],total:1,page:1,pageSize:30}));
  render(<ClassStudentPicker classId="class1" request={request} onAdded={vi.fn()} onError={vi.fn()}/>);
  await screen.findByText('Thôn An Bình');
  expect(screen.getByText('Xã Tân Bình')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Lọc Thôn / xóm'),{target:{value:'An Bình'}});
  fireEvent.change(screen.getByLabelText('Lọc Xã / phường'),{target:{value:'Tân Bình'}});
  fireEvent.change(screen.getByLabelText('Lọc Tỉnh / thành phố'),{target:{value:'Tỉnh A'}});
  await waitFor(()=>{const url=new URL(request.mock.calls.at(-1)[0],'http://localhost');expect(url.searchParams.get('village')).toBe('An Bình');expect(url.searchParams.get('commune')).toBe('Tân Bình');expect(url.searchParams.get('province')).toBe('Tỉnh A');});
  cleanup();
 });
});
