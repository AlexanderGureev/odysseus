import closeIcon from 'assets/sprite/icons-24-cross.svg';
import cn from 'classnames';
import { useAppDispatch, useAppSelector } from 'hooks';
import useMediaQuery from 'hooks/useMedia';
import React from 'react';
import { sendEvent } from 'store';
import { NoticeContent, TS_TRIGGER } from 'store/slices/trialSuggestion/utils';

import NoticeStyles from './notice.module.css';
import PopupStyles from './popup.module.css';

type Props = { content: NoticeContent; onClose: () => void; onClick: () => void };

const Popup: React.FC<Props> = ({ content, onClose, onClick }) => {
  return (
    <div className={PopupStyles.popup}>
      <div className={PopupStyles.container}>
        {content.title && <div className={PopupStyles.title} dangerouslySetInnerHTML={{ __html: content.title }} />}
        {content.description && (
          <div className={PopupStyles.description} dangerouslySetInnerHTML={{ __html: content.description }} />
        )}

        <div className={PopupStyles.group}>
          {content.payButtonText && (
            <button className={cn(PopupStyles['cancel-btn'], 'button')} onClick={onClick}>
              {content.payButtonText}
            </button>
          )}

          {content.closeButtonText && (
            <button className={cn(PopupStyles['start-btn'], 'button')} onClick={onClose}>
              {content.closeButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Notice: React.FC<Props> = ({ content, onClose, onClick }) => {
  return (
    <div className={NoticeStyles.wrapper}>
      <div className={NoticeStyles['close-wrapper']}>
        <img onClick={onClose} className={NoticeStyles.close} src={closeIcon} />
      </div>
      {content.title && <div className={NoticeStyles.title} dangerouslySetInnerHTML={{ __html: content.title }} />}
      {content.description && (
        <div className={NoticeStyles.description} dangerouslySetInnerHTML={{ __html: content.description }} />
      )}

      {content.payButtonText && (
        <button className={cn(NoticeStyles['cancel-btn'], 'button')} onClick={onClick}>
          {content.payButtonText}
        </button>
      )}
    </div>
  );
};

export const TrialSuggestionNotice: React.FC<{ type: TS_TRIGGER; content: NoticeContent }> = ({ type, content }) => {
  const dispatch = useAppDispatch();
  const fullscreen = useAppSelector((state) => state.fullscreen);
  const isMobile = useMediaQuery('(max-width: 599px)');

  const onClose = () => {
    dispatch(sendEvent({ type: 'CLICK_CLOSE_TRIAL_NOTICE' }));
  };

  const onClick = () => {
    dispatch(sendEvent({ type: 'CLICK_PAY_BUTTON_TRIAL_NOTICE' }));
  };

  const props = {
    content: {
      ...content,
      payButtonText: fullscreen.step === 'FULLSCREEN' ? 'Отключить рекламу бесплатно' : content.payButtonText,
    },
    onClose,
    onClick,
  };

  return type === 'triggerBeforePauserolls' && !isMobile ? <Popup {...props} /> : <Notice {...props} />;
};
