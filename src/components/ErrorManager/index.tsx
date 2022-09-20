import { useAppDispatch, useAppSelector } from 'hooks/store';
import React, { useCallback } from 'react';
import { sendEvent } from 'store';
import { selectMailOptions } from 'store/selectors';
import { SkinClass } from 'types';
import { ERROR_ITEM_MAP, RawPlayerError } from 'types/errors';

import { Template } from './ErrorTemplate';
import { ERROR_TEXT_BY_TYPE } from './templates';

export const ErrorTemplate: React.FC<{ error: RawPlayerError }> = ({ error }) => {
  const dispatch = useAppDispatch();
  const {
    session,
    meta: { isEmbedded, skin },
    config,
  } = useAppSelector((state) => state.root);

  const mailOpts = useAppSelector((state) => selectMailOptions(state));

  const errorCfg = ERROR_TEXT_BY_TYPE[error.title]({
    isEmbedded,
    theme: skin || SkinClass.DEFAULT,
    sharingUrl: config?.playlist?.items?.[0]?.sharing_url,
    mailOpts,
  });

  const handleClick = useCallback(
    (url: string | undefined) => {
      if (url) dispatch(sendEvent({ type: 'OPEN_URL', meta: { url, target: '_blank' } }));
      else dispatch(sendEvent({ type: 'RELOAD' }));
    },
    [dispatch]
  );

  return (
    <Template
      config={errorCfg}
      error={error}
      ssid={session.id}
      skin={skin || SkinClass.DEFAULT}
      webVersion={mailOpts.webVersion}
      handleClick={handleClick}
    />
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
