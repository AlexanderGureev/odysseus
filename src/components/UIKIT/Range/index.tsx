import './styles.css';

import cn from 'classnames';
import { useMouse, useUpdateEffect } from 'hooks';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { off, on } from 'utils';

type Props = {
  direction?: 'horisontal' | 'vertical';
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
  onDrag?: (status: boolean) => void;
  bufferValue?: number;
  transitionStep?: number | null;
};

const GRADIENT_DEG: Record<'horisontal' | 'vertical', string> = {
  horisontal: '90deg',
  vertical: '0deg',
};

const TRANSFORM_THUMB: Record<'horisontal' | 'vertical', (pos: number) => string> = {
  horisontal: (pos) => `translateX(${pos}px)`,
  vertical: (pos) => `translate(-50%, -${pos}px)`,
};

const MIN_DIFF = 5;

export const Range = ({
  direction = 'horisontal',
  radius = '10px',
  value: initialValue,
  max,
  step = 1,
  onChange,
  hoverColor = '--hover-color',
  progressColor = '--progress-color',
  bufferColor = '--buffer-color',
  getFormattedLabel = (label) => label,
  ariaLabel,
  onDragEnd,
  bufferValue,
  onDrag,
  transitionStep = MIN_DIFF,
}: React.PropsWithChildren<Props>) => {
  const [currentValue, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLDivElement>(null);
  const thumbLabelRef = useRef<HTMLDivElement>(null);
  const isKeyboardEvent = useRef<boolean>(false);
  const prevIsDrag = useRef<boolean>(false);
  const isDisableTransition = useRef<boolean>(true);

  const [isOverlap, setOverlap] = useState(false);

  const { isMouseDown: isDrag, elW, elH, elX, elY, isEnter } = useMouse(inputRef);

  const w = direction === 'horisontal' ? elW : elH;
  const x = direction === 'horisontal' ? elX : elH - elY;
  const pos = x > w ? w : x > 0 ? x : 0;
  const gradientPercent = (x / w) * 100;
  const value = Number(((pos / w) * max).toFixed(3));
  const progressValue = w * (currentValue / max);
  const bufferPercent = bufferValue ? bufferValue / max : null;

  useLayoutEffect(() => {
    if (!transitionStep) return;
    isDisableTransition.current = Math.abs(initialValue - currentValue) > transitionStep;
  }, [currentValue, initialValue, transitionStep]);

  useUpdateEffect(() => {
    if (!isDrag) setValue(initialValue);
  }, [isDrag, initialValue]);

  useEffect(() => {
    onDrag?.(isDrag);
  }, [isDrag, onDrag]);

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
      className={cn('range-input', direction, (isDrag || isDisableTransition.current) && 'transition-disable')}
      ref={inputRef}
      role="slider"
      tabIndex={0}
      aria-valuemin={0}
      aria-valuenow={currentValue}
      aria-valuemax={max}
      aria-label={ariaLabel}>
      <div className="range-input-track" style={{ borderRadius: radius }}>
        {bufferPercent && (
          <div
            className="range-input-buffer"
            style={{
              borderRadius: radius,
              backgroundColor: `var(${bufferColor})`,
              transform: `${direction === 'horisontal' ? 'scaleX' : 'scaleY'}(${bufferPercent})`,
            }}
          />
        )}
        <div
          className="range-input-progress"
          style={{
            borderRadius: radius,
            backgroundColor: `var(${progressColor})`,
            transform: `${direction === 'horisontal' ? 'scaleX' : 'scaleY'}(${currentValue / max})`,
          }}
        />
        <div
          className={cn('range-input-hover')}
          style={{
            borderRadius: radius,
            background: `linear-gradient(${
              GRADIENT_DEG[direction]
            },  ${`var(${hoverColor})`} ${gradientPercent}%,  transparent ${gradientPercent}%)`,
          }}
        />
      </div>

      <div
        className="range-input-thumb-position"
        style={{
          transform: TRANSFORM_THUMB[direction](progressValue),
        }}>
        <div className="range-input-thumb" />
      </div>

      {thumbLabel && (
        <div
          className="range-input-thumb-label-position"
          style={{
            transform: TRANSFORM_THUMB[direction](progressValue),
          }}>
          <div
            ref={thumbLabelRef}
            aria-hidden="true"
            className={cn('range-input-thumb-label', {
              active: isDrag || (isEnter && !isOverlap),
            })}>
            {thumbLabel}
          </div>
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
