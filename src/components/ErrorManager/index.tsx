import cn from 'classnames';
import { useAppDispatch, useAppSelector } from 'hooks/store';
import useMediaQuery from 'hooks/useMedia';
import React, { useEffect } from 'react';
import { sendEvent } from 'store';
import { selectMailOptions } from 'store/selectors';
import { AppThemeBySkin, SkinClass } from 'types';
import { ERROR_CODES, ERROR_ITEM_MAP, ERROR_TYPE, RawPlayerError } from 'types/errors';

import Styles from './index.module.css';
import { ERROR_TEXT_BY_TYPE } from './templates';

const ErrorTemplate: React.FC<{ error: RawPlayerError }> = ({ error }) => {
  const dispatch = useAppDispatch();
  const match = useMediaQuery('(max-width: 425px)');
  const {
    session,
    meta: { isEmbedded, skin },
    config,
  } = useAppSelector((state) => state.root);

  const mailOpts = useAppSelector((state) => selectMailOptions(state));

  const { icon, text, btn_text, footer_icons, onClick } = ERROR_TEXT_BY_TYPE[error.title]({
    isEmbedded,
    theme: skin || SkinClass.DEFAULT,
    sharingUrl: config?.playlist?.items?.[0]?.sharing_url,
    mailOpts,
  });

  return (
    <div
      className={cn(
        Styles['error-container'],
        Styles[`code-${ERROR_CODES[error.title]}`],
        Styles[`${AppThemeBySkin[skin || SkinClass.DEFAULT]}`]
      )}>
      <div className={Styles['error-modal']}>
        <div className={Styles.header}>
          <img src={`${icon}`} />
        </div>
        <div className={Styles.body}>{text(match)}</div>
        <div className={Styles.footer}>
          {btn_text?.() ? (
            <button
              className={cn(Styles['footer-btn'], 'button')}
              onClick={() => {
                if (onClick) onClick?.(dispatch);
                else {
                  dispatch(sendEvent({ type: 'RELOAD' }));
                }
              }}>
              {btn_text()}
            </button>
          ) : null}
          {footer_icons?.().map(({ src, href }) => (
            <a href={href} target="_blank" rel="noreferrer" key={href}>
              <img src={src} />
            </a>
          ))}
        </div>
        <div className={Styles['error-code']}>Код ошибки: {ERROR_CODES[error.title]}</div>
        <div className={Styles['meta-container']}>
          <div className={Styles['videosession-id']}>ssid: {session.sid}</div>
          {mailOpts.webVersion && <div>app version: {mailOpts.webVersion}</div>}
        </div>
      </div>
    </div>
  );
};

const ErrorManager = ({ children }: React.PropsWithChildren) => {
  const { step, error } = useAppSelector((state) => state.error);

  if (error && step === 'ERROR') {
    return <ErrorTemplate error={ERROR_ITEM_MAP[error.code]} />;
  }

  return (
    <>
      {children}
      {error && <ErrorTemplate error={ERROR_ITEM_MAP[error.code]} />}
    </>
  );
};

export { ErrorManager };
