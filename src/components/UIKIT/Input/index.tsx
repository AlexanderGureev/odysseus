import cn from 'classnames';
import React, { useRef, useState } from 'react';

import Styles from './index.module.css';

type InputSize = 's-size' | 'm-size';

export const Input: React.FC<{
  onChange?: (value: string) => void;
  className?: string;
  size?: InputSize;
  placeholder?: string;
  isValid?: boolean;
  error?: string;
  validate?: (value: string) => boolean;
}> = ({ placeholder, onChange, className, size = 'm-size', isValid, validate, error }) => {
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange?.(e.target.value);
  };

  return (
    <div
      className={cn(Styles.container, className, {
        [Styles.invalid]: isValid !== undefined ? !isValid : validate?.(value) ?? false,
      })}>
      <div className={cn(Styles.wrapper, Styles[size], placeholder && Styles['with-placeholder'])}>
        <input
          placeholder={placeholder}
          onChange={handleChange}
          className={cn(Styles.input, { [Styles.entred]: value.length > 0 })}
        />
        <div className={Styles.line} />
        {value.length && placeholder ? <div className={Styles.placeholder}>{placeholder}</div> : null}
      </div>
      {error ? <div className={Styles.error}>{error}</div> : null}
    </div>
  );
};

export const Textarea: React.FC<{
  placeholder?: string;
  maxHeight?: number;
  maxLength?: number;
  showCount?: boolean;
  onChange?: (value: string) => void;
  className?: string;
  inputClassName?: string;
  validate?: (value: string) => boolean;
  isValid?: boolean;
}> = ({ className, inputClassName, showCount, onChange, placeholder, maxHeight, maxLength, validate, isValid }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isScroll, setIsScroll] = useState(false);
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!ref.current) return;

    if (maxHeight) {
      e.target.style.height = 'inherit';
      e.target.style.height = e.target.scrollHeight < maxHeight ? `${e.target.scrollHeight}px` : `${maxHeight}px`;
    }

    setValue(ref.current.value);
    onChange?.(ref.current.value);
  };

  const onScroll = () => {
    if (!ref.current) return;

    if (ref.current.scrollTop > 0) {
      setIsScroll(true);
    } else {
      setIsScroll(false);
    }
  };

  return (
    <div
      className={cn(Styles.container, className, {
        [Styles.invalid]: isValid !== undefined ? !isValid : validate?.(value) ?? false,
      })}>
      <div className={cn(Styles.wrapper, Styles.textarea, isScroll && Styles.scroll)}>
        <textarea
          ref={ref}
          onChange={handleChange}
          onScroll={onScroll}
          placeholder={placeholder}
          className={cn(Styles.input, inputClassName, { [Styles.entred]: value.length > 0 })}
        />
        <div className={Styles.line} />
      </div>
      {showCount && value.length > 0 && (
        <div className={Styles['text-counter']}>{maxLength ? `${value.length} / ${maxLength}` : value.length}</div>
      )}
    </div>
  );
};
