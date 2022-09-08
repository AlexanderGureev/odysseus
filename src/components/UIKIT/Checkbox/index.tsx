import React from 'react';

import Styles from './index.module.css';

export const Checkbox: React.FC<{ label?: string; value: string; onChange?: (value: boolean) => void }> = ({
  onChange,
  label,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked);
  };

  return (
    <label className={Styles.checkbox}>
      <input className={Styles.input} type="checkbox" onChange={handleChange} />
      {label ? <div className={Styles.label}>{label}</div> : null}
    </label>
  );
};
