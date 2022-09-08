import cn from 'classnames';
import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const PayNotice = () => {
  const dispatch = useAppDispatch();
  const { text, btnText } = useAppSelector((state) => state.payNotify);

  const onClick = () => {
    dispatch(sendEvent({ type: 'CLICK_SUB_BUTTON' }));
  };

  return (
    <div className={Styles.notice}>
      <div onClick={onClick} className={Styles.text} dangerouslySetInnerHTML={{ __html: text }} />
      <button className={cn('button', Styles.btn)} onClick={onClick}>
        {btnText}
      </button>
    </div>
  );
};
