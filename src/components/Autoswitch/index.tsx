import cn from 'classnames';
import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const Autoswitch = () => {
  const dispatch = useAppDispatch();
  const autoSwitch = useAppSelector((state) => state.autoSwitch);

  return (
    <div className={Styles[`${autoSwitch.controlType}`]}>
      <div className={Styles.overlay} />
      <div className={cn(Styles.wrapper)}>
        <button
          className={cn(Styles['cancel-btn'], 'button')}
          onClick={() => {
            dispatch(
              sendEvent({
                type: 'HIDE_AUTOSWITCH_NOTIFY',
              })
            );
          }}>
          {autoSwitch.cancelButtonText}
        </button>
        <div className={Styles.container}>
          {autoSwitch.thumbnail && (
            <div className={Styles['poster-wrapper']}>
              <img className={Styles.poster} src={autoSwitch.thumbnail} />
              {autoSwitch.thumbnailText && <div className={Styles['poster-text']}>{autoSwitch.thumbnailText}</div>}
            </div>
          )}
          {autoSwitch.badge && (
            <div
              className={Styles.badge}
              style={{ color: autoSwitch.badge.textColor, backgroundColor: autoSwitch.badge.badgeColor }}>
              {autoSwitch.badge.text}
            </div>
          )}
          <button
            className={cn(Styles['start-btn'], 'button')}
            onClick={() => {
              dispatch(
                sendEvent({
                  type: 'START_AUTOSWITCH',
                })
              );
            }}>
            <span className={Styles['btn-text']}>{autoSwitch.buttonText}</span>
            <span className={Styles.countdown}>{Math.ceil(autoSwitch.countdownValue)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
