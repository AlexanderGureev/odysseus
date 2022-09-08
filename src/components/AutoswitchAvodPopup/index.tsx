import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const AutoswitchAvodPopup = () => {
  const dispatch = useAppDispatch();
  const autoSwitch = useAppSelector((state) => state.autoSwitch);

  return (
    <div className="auto-switch">
      <div className="title">За прошедшую серию было показано несколько рекламных вставок</div>
      {autoSwitch.autoswitchNotifyText && (
        <div className="description" dangerouslySetInnerHTML={{ __html: autoSwitch.autoswitchNotifyText }} />
      )}

      <button
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
        {autoSwitch.cancelButtonText}
      </button>
      <button
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
  );
};
