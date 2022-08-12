import cn from 'classnames';
import { useAppDispatch, useAppSelector } from 'hooks/store';
import useMediaQuery from 'hooks/useMedia';
import React, { useEffect } from 'react';
import { sendEvent } from 'store';
import { SkinClass } from 'types';
import { ERROR_CODES, ERROR_TYPE, RawPlayerError } from 'types/errors';

import Styles from './index.module.css';
import { ERROR_TEXT_BY_TYPE } from './templates';

const ErrorTemplate: React.FC<{ error: RawPlayerError }> = ({ error }) => {
  const { icon, text, btn_text, footer_icons, onClick } = ERROR_TEXT_BY_TYPE[error.title](SkinClass.MORE_TV, true);
  const match = useMediaQuery('(max-width: 375px)');
  const { session } = useAppSelector((state) => state.root);

  return (
    <div className={cn(Styles.error_container, `code_${ERROR_CODES[error.title]}`)}>
      <div className={Styles.error_modal}>
        <div className={Styles.error_modal__header}>
          <img src={`${icon}`} />
        </div>
        <div className={Styles.error_modal__body}>{text(match)}</div>
        <div className={Styles.error_modal__footer}>
          {btn_text?.() ? (
            <div className={Styles.footer_btn} onClick={onClick}>
              {btn_text()}
            </div>
          ) : null}
          {footer_icons?.().map(({ src, href }) => (
            <a href={href} target="_blank" rel="noreferrer" key={href}>
              <img src={src} />
            </a>
          ))}
        </div>
        <div className={Styles.error_code}>Код ошибки: {ERROR_CODES[error.title]}</div>
        <div className={Styles.meta_container}>
          <div className={Styles.videosession_id}>ssid: {session.sid}</div>
          <div>app version: 2.53.0</div>
        </div>
      </div>
    </div>
  );
};

const ErrorManager = ({ children }: React.PropsWithChildren) => {
  const dispatch = useAppDispatch();
  const { step, error } = useAppSelector((state) => state.error);

  useEffect(() => {
    // dispatch(
    //   sendEvent({
    //     type: 'SHOW_ERROR',
    //     payload: {
    //       error: {
    //         code: 105,
    //         title: ERROR_TYPE.ENCRYPTED,
    //       },
    //     },
    //   })
    // );
  }, [dispatch]);

  if (error && step === 'ERROR') {
    return <ErrorTemplate error={error} />;
  }

  return (
    <>
      {children}
      {error && <ErrorTemplate error={error} />}
    </>
  );
};

export { ErrorManager };
