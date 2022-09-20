import cn from 'classnames';
import useMediaQuery from 'hooks/useMedia';
import React from 'react';
import { AppThemeBySkin, SkinClass } from 'types';
import { ERROR_CODES, RawPlayerError } from 'types/errors';

import Styles from './index.module.css';
import { ErrorCfg } from './types';

type TemplateOpts = {
  config: ErrorCfg;
  error: RawPlayerError;
  skin: SkinClass;
  webVersion?: string;
  ssid?: string;
  handleClick: (url: string | undefined) => void;
};

export const Template = ({
  config: { icon, text, btn_text, footer_icons, getRedirectURL },
  error,
  skin,
  webVersion,
  ssid,
  handleClick,
}: TemplateOpts) => {
  const match = useMediaQuery('(max-width: 425px)');

  return (
    <div
      className={cn(
        Styles['error-container'],
        Styles[`code-${ERROR_CODES[error.title]}`],
        Styles[`${AppThemeBySkin[skin]}`]
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
                handleClick(getRedirectURL?.());
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
          <div className={Styles['videosession-id']}>ssid: {ssid}</div>
          {webVersion && <div>app version: {webVersion}</div>}
        </div>
      </div>
    </div>
  );
};
