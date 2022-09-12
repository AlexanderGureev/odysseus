import cn from 'classnames';
import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const PayButton = () => {
  const dispatch = useAppDispatch();
  const { text } = useAppSelector((state) => state.payButton);

  return (
    <div className={Styles.wrapper}>
      <button
        className={cn(Styles.button, 'button')}
        onClick={() => {
          dispatch(sendEvent({ type: 'CLICK_PAY_BUTTON' }));
        }}>
        {text}
      </button>
    </div>
  );
};
