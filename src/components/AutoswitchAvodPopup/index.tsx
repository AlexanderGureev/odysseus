import closeIcon from 'assets/sprite/icons-24-cross.svg';
import cn from 'classnames';
import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const AutoswitchAvodPopup = () => {
  const dispatch = useAppDispatch();
  const autoSwitch = useAppSelector((state) => state.autoSwitch);
  const fullscreen = useAppSelector((state) => state.fullscreen);

  const onClose = () => {
    dispatch(sendEvent({ type: 'HIDE_AUTOSWITCH_NOTIFY', meta: { source: 'close-icon' } }));
  };

  return (
    <div className={Styles.wrapper}>
      <img onClick={onClose} className={Styles.close} src={closeIcon} />
      <div className={Styles.title}>
        За прошедшую серию
        <br />
        было показано несколько рекламных вставок
      </div>
      {autoSwitch.autoswitchNotifyText && (
        <div className={Styles.description} dangerouslySetInnerHTML={{ __html: autoSwitch.autoswitchNotifyText }} />
      )}

      <div className={Styles.group}>
        <button
          className={cn(Styles['cancel-btn'], 'button')}
          onClick={() => {
            dispatch(
              sendEvent({
                type: 'CLICK_SUB_BUTTON',
              })
            );

            dispatch(
              sendEvent({
                type: 'HIDE_AUTOSWITCH_NOTIFY',
              })
            );
          }}>
          {fullscreen.step === 'FULLSCREEN' ? 'Отключить бесплатно' : autoSwitch.cancelButtonText}
        </button>
        <button
          className={cn(Styles['start-btn'], 'button')}
          onClick={() => {
            dispatch(
              sendEvent({
                type: 'START_AUTOSWITCH',
              })
            );
          }}>
          {autoSwitch.buttonText}
        </button>
      </div>
    </div>
  );
};
