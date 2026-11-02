import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SearchableSelector } from './AccountCreate';

afterEach(cleanup);
const items = [{ id: 'a', name: '4A · Trường A' }, { id: 'b', name: '4B · Trường B' }];
function Fixture({ multiple = true }) {
  const [value, onChange] = useState(multiple ? [] : 'a');
  return <><SearchableSelector items={items} labelFor={item => item.name} placeholder="Chọn lớp phụ trách" value={value} onChange={onChange} multiple={multiple} /><button>Outside</button><output data-testid="value">{JSON.stringify(value)}</output></>;
}

describe('searchable class selection', () => {
  it('closes on outside clicks, clears the search, and keeps selected classes', () => {
    render(<Fixture />);
    const input = screen.getByRole('combobox'); fireEvent.focus(input);
    fireEvent.click(screen.getByRole('option', { name: /4A/ }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByTestId('value')).toHaveTextContent('["a"]');
    fireEvent.change(input, { target: { value: '4B' } });
    expect(screen.queryByRole('option', { name: /4A/ })).toBeNull();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('value')).toHaveTextContent('["a"]');
    fireEvent.click(input);
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByRole('option', { name: /4A/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('closes on Escape and when Tab leaves, while focus within the selector keeps it open', () => {
    render(<Fixture />);
    const input = screen.getByRole('combobox'); fireEvent.focus(input);
    const option = screen.getAllByRole('option')[0];
    fireEvent.blur(input, { relatedTarget: option });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.blur(option, { relatedTarget: screen.getByRole('button', { name: 'Outside' }) });
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.focus(input); fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.click(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('retains the selected single scope label when dismissing a partial search', () => {
    render(<Fixture multiple={false} />);
    const input = screen.getByRole('combobox');
    expect(input).toHaveValue('4A · Trường A');
    fireEvent.focus(input); fireEvent.change(input, { target: { value: '4B' } });
    fireEvent.pointerDown(document.body);
    expect(input).toHaveValue('4A · Trường A');
    fireEvent.click(input); fireEvent.click(screen.getByRole('option', { name: /4B/ }));
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input).toHaveValue('4B · Trường B');
  });
});
