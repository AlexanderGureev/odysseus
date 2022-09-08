import adultIcon from 'assets/sprite/icons-24-adult-icon.svg';
import cn from 'classnames';
import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const AdultConfirmationNotice: React.FC = () => {
  const dispatch = useAppDispatch();
  const step = useAppSelector((state) => state.adultNotify.step);

  return (
    <div className={cn('notice', Styles.adult)}>
      <div className={Styles.wrapper}>
        <img src={adultIcon} />
        <div className={cn('notice-title', Styles.title)}>Только для взрослых</div>
        <div className={cn('notice-group', Styles.group, step === 'ADULT_NOTIFY_REJECTED' && Styles.hidden)}>
          <button
            className={cn('button', 'notice-btn-disagree', Styles.disagree)}
            onClick={() => {
              dispatch(sendEvent({ type: 'ADULT_NOTIFY_REJECT' }));
            }}>
            мне ещё нет 18
          </button>
          <button
            className={cn('button', 'notice-btn-agree', Styles.agree)}
            onClick={() => {
              dispatch(sendEvent({ type: 'ADULT_NOTIFY_RESOLVE' }));
            }}>
            мне уже есть 18
          </button>
        </div>
      </div>
    </div>
  );
};
