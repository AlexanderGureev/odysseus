import onlineIcon from 'assets/sprite/connection-icon.svg';
import offlineIcon from 'assets/sprite/connection-icon-bad.svg';
import rejectIcon from 'assets/sprite/connection-icon-reject.svg';
import cn from 'classnames';
import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const NetworkNotice = () => {
  const dispatch = useAppDispatch();
  const network = useAppSelector((state) => state.network);
  const networkRecovery = useAppSelector((state) => state.networkRecovery);

  const [isOnline, setIsOnline] = React.useState(false);
  const prevStatus = React.useRef(network.step);

  React.useEffect(() => {
    setIsOnline(network.step === 'ONLINE' && prevStatus.current === 'OFFLINE');
    prevStatus.current = network.step;
  }, [network.step]);

  return (
    <div
      className={cn(Styles.network, {
        [Styles.online]: isOnline,
        [Styles.offline]: network.step === 'OFFLINE',
        [Styles.rejected]: networkRecovery.step === 'REJECTED',
      })}>
      <div className={Styles.title}>
        <img
          src={networkRecovery.step === 'REJECTED' ? rejectIcon : network.step === 'ONLINE' ? onlineIcon : offlineIcon}
        />
        {networkRecovery.step === 'REJECTED'
          ? 'Не удается подключиться к серверу'
          : network.step === 'ONLINE'
          ? 'Соединение восстановлено'
          : 'Соединение потеряно'}
      </div>

      {networkRecovery.step === 'TIMEOUT_WAITING' && (
        <div className={Styles.group}>
          <button
            className={Styles.btn}
            onClick={() => {
              dispatch(sendEvent({ type: 'CLICK_RETRY_BUTTON' }));
            }}>
            Повторить
          </button>
          <span className={Styles.timer}>...{networkRecovery.timerValue}</span>
        </div>
      )}

      {networkRecovery.step === 'RETRY_PENDING' && (
        <div className={Styles.group}>
          <span className={Styles.timer}>Подключение...</span>
        </div>
      )}

      {networkRecovery.step === 'REJECTED' && (
        <button
          className={Styles.btn}
          onClick={() => {
            dispatch(sendEvent({ type: 'RELOAD' }));
          }}>
          Обновить страницу
        </button>
      )}
    </div>
  );
};
