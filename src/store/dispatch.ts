import { PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch, AppState } from 'store';
import { logger } from 'utils/logger';

import type { EventPayload } from './types';

export type CreateDispatchOpts = { dispatch: AppDispatch; getState: () => AppState };

export type SessionDispatch = (
  action: PayloadAction<EventPayload>,
  opts?: {
    currentSession: boolean;
  }
) => void;

export const createDispatch = ({ dispatch, getState }: CreateDispatchOpts): SessionDispatch => {
  const {
    session: { id },
  } = getState().root;

  return (action, opts) => {
    const currentId = getState().root.session.id;

    if (!opts?.currentSession || !currentId || !id || currentId === id) {
      dispatch(action);
      return;
    }

    logger.log('[DISPATCH]', 'skip', { id, currentId, action });
  };
};
