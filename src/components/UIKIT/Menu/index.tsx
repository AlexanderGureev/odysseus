import cn from 'classnames';
import { useMenuState } from 'hooks';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

import Styles from './index.module.css';
import { MenuProps } from './types';

export const Menu = <T extends object, V>(props: React.PropsWithChildren<MenuProps<T, V>>) => {
  const ref = useRef<HTMLDivElement>(null);
  const { state, close } = useMenuState(ref, isMobile ? 0 : 500);
  const [ids, setSubMenu] = useState<string[]>([]);

  const sub = ids.reduce(
    (acc: MenuProps<T, V> | undefined, id) => acc?.items?.find((i) => i.id === id)?.subMenu,
    props
  );

  const { items, onSelect, selected = null, closeOnSelect = false, onOpen, onClick } = sub || props;

  const onAnimationEnd = useCallback(() => {
    if (state === 'leave') setSubMenu([]);
  }, [state]);

  useEffect(() => {
    if (state === 'enter') onOpen?.();
  }, [onOpen, state]);

  return (
    <div
      ref={ref}
      className={cn(Styles.container, { [Styles.selectable]: selected !== null })}
      onAnimationEnd={onAnimationEnd}>
      <div className={cn(Styles.menu, Styles[`${state}`])}>
        {items.map(({ id, title, icon, value, selectedTitle, subMenu, disabled = false }, index) => {
          return (
            <div
              key={title}
              className={cn(Styles.item, {
                [Styles.active]: selected === value,
                [Styles.disabled]: typeof disabled === 'function' ? disabled() : disabled,
              })}
              onClick={() => {
                onClick?.(items[index] as T);

                if (selected === value) return;

                if (subMenu) setSubMenu((p) => [...p, id]);
                else {
                  onSelect?.(items[index] as T);
                  if (closeOnSelect) close();
                }
              }}>
              {icon && <img src={icon} />}
              <span className={Styles.title}>{title}</span>
              {selectedTitle && <span className={Styles['selected-title']}>{selectedTitle}</span>}
            </div>
          );
        })}
      </div>
      {props.children}
    </div>
  );
};
