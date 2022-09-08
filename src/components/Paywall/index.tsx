import cn from 'classnames';
import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const Paywall = () => {
  const dispatch = useAppDispatch();
  const { title, description, paywallButtonText } = useAppSelector((state) => state.paywall);

  return (
    <div className={cn('notice', Styles.paywall)}>
      <div className={Styles.wrapper}>
        {title && <div className={cn('notice-title', Styles.title)} dangerouslySetInnerHTML={{ __html: title }} />}
        {description && <div className={Styles.description} dangerouslySetInnerHTML={{ __html: description }} />}
      </div>
      <button
        className={cn('button', Styles.btn)}
        onClick={() => {
          dispatch(sendEvent({ type: 'CLICK_SUB_BUTTON' }));
        }}>
        {paywallButtonText}
      </button>
    </div>
  );
};
