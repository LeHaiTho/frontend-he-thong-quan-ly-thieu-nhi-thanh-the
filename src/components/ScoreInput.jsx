import React from 'react';
import { Input } from 'antd';

/**
 * Ô nhập điểm 0–10 (bảng điểm). Giá trị rỗng được phép khi chưa nhập.
 */
const ScoreInput = ({ width = 76, value, onChange, disabled, onKeyDown, id }) => {
  const display =
    value === null || value === undefined || value === '' ? '' : String(value);

  const commit = (raw) => {
    const trimmed = String(raw ?? '').trim();
    if (trimmed === '') {
      onChange(null);
      return;
    }
    const num = parseFloat(trimmed.replace(',', '.'));
    if (Number.isNaN(num)) return;
    const clamped = Math.min(10, Math.max(0, num));
    onChange(Math.round(clamped * 10) / 10);
  };

  return (
    <Input
      id={id}
      size="small"
      disabled={disabled}
      style={{ width, textAlign: 'center' }}
      value={display}
      onChange={(e) => commit(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={onKeyDown}
      inputMode="decimal"
      maxLength={4}
    />
  );
};

export default ScoreInput;
