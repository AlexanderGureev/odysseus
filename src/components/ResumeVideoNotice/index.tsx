import cn from 'classnames';
import { useAppDispatch } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';
import { secToHumanReadeable } from 'utils';

import Styles from './index.module.css';

export const ResumeVideoNotice: React.FC<{ time: number }> = ({ time }) => {
  const dispatch = useAppDispatch();

  return (
    <div className={cn('notice', Styles.resume)}>
      <div className="notice-title">Продолжить c {secToHumanReadeable(time)}?</div>
      <div className="notice-group">
        <button
          className={cn('button', 'notice-btn-disagree', Styles.disagree)}
          onClick={() => {
            dispatch(sendEvent({ type: 'RESUME_VIDEO_NOTIFY_REJECT' }));
          }}>
          Смотреть с начала
        </button>
        <button
          className={cn('button', 'notice-btn-agree', Styles.agree)}
          onClick={() => {
            dispatch(sendEvent({ type: 'RESUME_VIDEO_NOTIFY_RESOLVE' }));
          }}>
          Продолжить просмотр
        </button>
      </div>
    </div>
  );
};
