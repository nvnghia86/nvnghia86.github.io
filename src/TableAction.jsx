import React from 'react';
import { Tooltip } from 'antd';
import { Pencil, Trash2, UserRoundPlus, UsersRound, QrCode, ShieldCheck, Settings2, ArrowUp, ArrowDown, LockKeyhole, LockKeyholeOpen, Eye, ChartColumn, Send, CircleStop, Check, X } from 'lucide-react';
import './table-actions.css';

const icons = { edit: Pencil, delete: Trash2, members: UsersRound, cards: QrCode, roles: ShieldCheck, settings: Settings2, promote: ArrowUp, demote: ArrowDown, activate: LockKeyholeOpen, deactivate: LockKeyhole, view: Eye, results: ChartColumn, publish: Send, close: CircleStop, add: UserRoundPlus, approve: Check, reject: X };
export default function TableAction({ action = 'edit', label, danger = false, className = '', ...props }) {
  const Icon = icons[action] || Settings2;
  return <Tooltip title={label} mouseEnterDelay={0.25}><button {...props} type="button" className={`table-icon-button ${danger ? 'is-danger' : ''} ${className}`} aria-label={label} title={label}><Icon size={18} strokeWidth={1.8} aria-hidden="true" focusable="false" /></button></Tooltip>;
}
