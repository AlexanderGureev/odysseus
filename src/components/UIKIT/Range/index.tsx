import './styles.css';

import cn from 'classnames';
import { useMouse, useUpdateEffect } from 'hooks';
import React, { useEffect, useRef, useState } from 'react';
import { off, on } from 'utils';

type Props = {
  direction?: 'horisontal' | 'vertical';
  width?: string;
  height?: string;
  radius?: string;
  value: number;
  max: number;
  step?: number;
  onChange?: (value: number) => void;
  hoverColor?: string;
  progressColor?: string;
  bufferColor?: string;
  getFormattedLabel?: (value: number) => React.ReactNode;
  ariaLabel?: string;
  onDragEnd?: (value: number) => void;
  bufferValue?: number;
};

const GRADIENT_DEG: Record<'horisontal' | 'vertical', string> = {
  horisontal: '90deg',
  vertical: '0deg',
};

export const Range = ({
  direction = 'horisontal',
  width = '100%',
  height = '10px',
  radius = '10px',
  value: initialValue,
  max,
  step = 1,
  onChange,
  hoverColor = 'rgba(255,255,255,.7)',
  progressColor = '#fe1717',
  bufferColor = 'rgba(255,255,255,.5)',
  getFormattedLabel = (label) => label,
  ariaLabel,
  onDragEnd,
  bufferValue,
}: React.PropsWithChildren<Props>) => {
  const [currentValue, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLDivElement>(null);
  const thumbLabelRef = useRef<HTMLDivElement>(null);
  const isKeyboardEvent = useRef<boolean>(false);
  const prevIsDrag = useRef<boolean>(false);
  const [isOverlap, setOverlap] = useState(false);

  const { isMouseDown: isDrag, elW, elH, elX, elY, isEnter } = useMouse(inputRef);

  const w = direction === 'horisontal' ? elW : elH;
  const x = direction === 'horisontal' ? elX : elH - elY;
  const pos = x > w ? w : x > 0 ? x : 0;
  const gradientPercent = (x / w) * 100;
  const value = Number(((pos / w) * max).toFixed(1));
  const progressValue = w * (currentValue / max);
  const bufferPx = bufferValue ? w * (bufferValue / max) : null;

  useUpdateEffect(() => {
    if (!isDrag) setValue(initialValue);
  }, [isDrag, initialValue]);

  useEffect(() => {
    if (isKeyboardEvent.current) {
      isKeyboardEvent.current = false;
      onChange?.(currentValue);
      onDragEnd?.(currentValue);
    }
  }, [currentValue, onDragEnd, onChange]);

  useEffect(() => {
    if (isDrag && value !== currentValue) {
      setValue(value);
      onChange?.(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, currentValue, isDrag]);

  useEffect(() => {
    if (!isDrag && prevIsDrag.current) onDragEnd?.(value);
    prevIsDrag.current = isDrag;
  }, [isDrag, onDragEnd, value]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (inputRef.current !== document.activeElement) return;

      switch (e.code) {
        case 'ArrowUp':
        case 'ArrowRight': {
          isKeyboardEvent.current = true;
          setValue((prev) => (prev + step > max ? max : prev + step));
          return;
        }
        case 'ArrowDown':
        case 'ArrowLeft': {
          isKeyboardEvent.current = true;
          setValue((prev) => (prev - step < 0 ? 0 : prev - step));
          return;
        }
        case 'Home': {
          isKeyboardEvent.current = true;
          setValue(0);
          return;
        }
        case 'End': {
          isKeyboardEvent.current = true;
          setValue(max);
          return;
        }
      }
    };

    on(document, 'keydown', handleKey);

    return () => {
      off(document, 'keydown', handleKey);
    };
  }, [max, step]);

  useEffect(() => {
    if (!thumbLabelRef.current || !isEnter) return;

    const { width } = thumbLabelRef.current.getBoundingClientRect();
    const [start, end] = [progressValue - (width + 10), progressValue + (width + 10)];

    setOverlap(pos >= start && pos <= end);
  }, [isEnter, progressValue, pos]);

  const thumbLabel = getFormattedLabel(currentValue);
  const label = getFormattedLabel(value);

  return (
    <div
      className={cn('range-input', direction)}
      ref={inputRef}
      style={{ width, height }}
      role="slider"
      tabIndex={0}
      aria-valuemin={0}
      aria-valuenow={currentValue}
      aria-valuemax={max}
      aria-label={ariaLabel}>
      <div className="range-input-track" style={{ borderRadius: radius }} />
      {bufferPx && (
        <div
          className="range-input-buffer"
          style={{
            borderRadius: radius,
            background: `linear-gradient(${GRADIENT_DEG[direction]},  ${bufferColor} ${bufferPx}px,  transparent ${bufferPx}px)`,
          }}
        />
      )}
      <div
        className="range-input-progress"
        style={{
          borderRadius: radius,
          background: `linear-gradient(${GRADIENT_DEG[direction]},  ${progressColor} ${progressValue}px,  transparent ${progressValue}px)`,
        }}
      />
      <div
        className={cn('range-input-hover', {
          active: isEnter,
        })}
        style={{
          borderRadius: radius,
          background: `linear-gradient(${GRADIENT_DEG[direction]},  ${hoverColor} ${gradientPercent}%,  transparent ${gradientPercent}%)`,
        }}
      />
      <div
        className="range-input-thumb"
        style={{
          [direction === 'horisontal' ? 'left' : 'bottom']: progressValue,
        }}
      />
      {thumbLabel && (
        <div
          ref={thumbLabelRef}
          aria-hidden="true"
          className={cn('range-input-thumb-label', {
            active: isDrag || (isEnter && !isOverlap),
          })}
          style={{
            [direction === 'horisontal' ? 'left' : 'bottom']: progressValue,
          }}>
          {thumbLabel}
        </div>
      )}
      {label && (
        <div
          aria-hidden="true"
          className={cn('range-input-label', {
            active: isEnter && !isDrag,
          })}
          style={{
            [direction === 'horisontal' ? 'left' : 'bottom']: pos,
          }}>
          {label}
        </div>
      )}
    </div>
  );
};
