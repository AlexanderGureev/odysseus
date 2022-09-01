import { createAction, createSlice } from '@reduxjs/toolkit';
import { fetchConfig } from 'api';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { TLinkedTracks } from 'types';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

import { checkToken } from '../updater/effects';
import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',

  prev: null,
  next: null,
  type: null,
  params: {},
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    PARSE_CONFIG_RESOLVE: null,
    GO_TO_NEXT_TRACK: 'CHECK_TOKEN_PENDING',
    GO_TO_PREV_TRACK: 'CHECK_TOKEN_PENDING',
  },
  CHECK_TOKEN_PENDING: {
    CHECK_TOKEN_RESOLVE: 'FETCH_TRACK_CONFIG',
    CHECK_TOKEN_REJECT: 'ERROR',
  },
  FETCH_TRACK_CONFIG: {
    CHANGE_TRACK: 'IDLE',
    FETCH_TRACK_CONFIG_REJECT: 'ERROR',
  },
  // CHANGE_TRACK_PENDING: {},
  ERROR: {},
};

const changeTrack = createSlice({
  name: 'changeTrack',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'changeTrack', `${state.step} -> ${type} -> ${next}`);

      const step = next || state.step;

      switch (type) {
        case 'GO_TO_NEXT_TRACK':
          return { ...state, step, type: 'next', ...payload };
        case 'GO_TO_PREV_TRACK':
          return { ...state, step, type: 'previous', ...payload };

        case 'PARSE_CONFIG_RESOLVE': {
          const {
            config: {
              playlist: { items },
            },
            features: { NEXT_EPISODE, PREV_EPISODE },
          } = payload;

          const { linked_tracks } = items[0];

          return {
            ...initialState,
            prev:
              NEXT_EPISODE === 'POSTMESSAGE' && linked_tracks?.previous
                ? {
                    caption: linked_tracks.previous.caption,
                    thumbnail: linked_tracks.previous.thumbnail,
                  }
                : null,
            next:
              PREV_EPISODE === 'POSTMESSAGE' && linked_tracks?.next
                ? {
                    caption: linked_tracks.next.caption,
                    thumbnail: linked_tracks.next.thumbnail,
                  }
                : null,
          };
        }
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, changeTrack.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const opts = {
        dispatch,
        getState,
        services,
      };

      const { step } = getState().changeTrack;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        CHECK_TOKEN_PENDING: () => checkToken(opts),
        FETCH_TRACK_CONFIG: async () => {
          try {
            const {
              changeTrack: { type, params },
              root: {
                config: {
                  playlist: { items },
                },
                meta,
              },
            } = getState();

            const { linked_tracks } = items[0];
            const data = linked_tracks?.[`${type as keyof TLinkedTracks}`];
            const configURL = data?.playerConfig;

            if (!configURL) {
              throw new PlayerError(ERROR_CODES.ERROR_NOT_AVAILABLE, 'playerConfig is undefined');
            }

            const { location } = await services.embeddedCheckService.getIframeLocation();
            const config = await fetchConfig(configURL, location);
            const query = data.trackVod?.queryParams;

            dispatch(
              sendEvent({
                type: 'CHANGE_TRACK',
                meta: {
                  config,
                  context: {
                    user_token: meta.userToken,
                  },
                  params: {
                    p2p: `${query?.p2p}` === '1',
                    startAt: null,
                    sign: query?.sign,
                    pf: query?.previewFrom,
                    pt: query?.previewTo,
                    ...params,
                  },
                },
              }),
              {
                currentSession: true,
              }
            );
          } catch (err) {
            logger.error('[change track]', err);
            dispatch(sendEvent({ type: 'FETCH_TRACK_CONFIG_REJECT', meta: { error: err.serialize() } }));
          }
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'changeTrack', step);
        effect();
      }
    },
  });

export default {
  ...changeTrack,
  config,
  addMiddleware,
};
