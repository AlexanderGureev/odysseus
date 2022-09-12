import closeIcon from 'assets/sprite/icons-24-cross.svg';
import cn from 'classnames';
import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';
import { NoticeContent } from 'store/slices/trialSuggestion/utils';

import Styles from './index.module.css';

export const AdDisableSuggestionNotice: React.FC<{ content: NoticeContent }> = ({ content }) => {
  const dispatch = useAppDispatch();
  const fullscreen = useAppSelector((state) => state.fullscreen);

  const onClose = () => {
    dispatch(sendEvent({ type: 'HIDE_AUTOSWITCH_NOTIFY', meta: { source: 'close-icon' } }));
  };

  return (
    <div className={Styles.wrapper}>
      <div className={Styles.container}>
        <img onClick={onClose} className={Styles.close} src={closeIcon} />
        {content.title && <div className={Styles.title} dangerouslySetInnerHTML={{ __html: content.title }} />}
        {content.description && (
          <div className={Styles.description} dangerouslySetInnerHTML={{ __html: content.description }} />
        )}

        <div className={Styles.group}>
          {content.closeButtonText && (
            <button
              className={cn(Styles['start-btn'], 'button')}
              onClick={() => {
                dispatch(sendEvent({ type: 'CLICK_CLOSE_AD_DISABLE_SUGGESTION' }));
              }}>
              {content.closeButtonText}
            </button>
          )}

          {content.payButtonText && (
            <button
              className={cn(Styles['cancel-btn'], 'button')}
              onClick={() => {
                dispatch(sendEvent({ type: 'CLICK_SUB_BUTTON' }));
              }}>
              {fullscreen.step === 'FULLSCREEN' ? 'Отключить бесплатно' : content.payButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
