import cn from 'classnames';
import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const TrailerSubNotice = () => {
  const dispatch = useAppDispatch();
  const { buttonText, description } = useAppSelector((state) => state.trailerSubNotice);

  return (
    <div className={Styles.wrapper}>
      {buttonText && (
        <button
          className={cn(Styles.button, 'button')}
          onClick={() => {
            dispatch(sendEvent({ type: 'CLICK_SUB_BUTTON' }));
          }}>
          {buttonText}
        </button>
      )}

      {description && (
        <div
          onClick={() => {
            dispatch(sendEvent({ type: 'CLICK_SUB_BUTTON', meta: { btn_type: 'about' } }));
          }}
          className={Styles.description}
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}
    </div>
  );
};
