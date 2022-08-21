import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppState } from 'store';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import { getTrackInfo } from 'store/selectors';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { Nullable } from 'types';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    START_PLAYBACK: null,
  },
  INITIALIZE_MEDIASESSION: {
    INITIALIZE_MEDIASESSION_RESOLVE: 'READY',
    INITIALIZE_MEDIASESSION_REJECT: 'DISABLED',
  },
  READY: {
    AD_BREAK_STARTED: 'IDLE',
    NETWORK_ERROR: 'IDLE',
    CHANGE_TRACK: 'IDLE',
    MEDIA_EVENT: 'PROCESSING_MEDIA_EVENT',
  },
  PROCESSING_MEDIA_EVENT: {
    PROCESSING_MEDIA_EVENT_RESOLVE: 'READY',
  },
  DISABLED: {},
};

const actionHandlers: Array<
  [MediaSessionAction, (state: AppState) => Nullable<(details: MediaSessionActionDetails) => EventPayload>]
> = [
  ['play', () => () => ({ type: 'DO_PLAY' })],
  ['pause', () => () => ({ type: 'DO_PAUSE' })],
  [
    'nexttrack',
    (state) => {
      if (!state.changeTrack.next) return null;

      return () => ({
        type: 'GO_TO_NEXT_TRACK',
      });
    },
  ],
  [
    'previoustrack',
    (state) => {
      if (!state.changeTrack.prev) return null;

      return () => ({
        type: 'GO_TO_PREV_TRACK',
      });
    },
  ],
  ['seekforward', () => () => ({ type: 'INC_SEEK', payload: { value: 30 } })],
  ['seekbackward', () => () => ({ type: 'DEC_SEEK', payload: { value: -30 } })],
  ['seekto', () => (details) => ({ type: 'SEEK', meta: { to: details.seekTime! } })],
];

const mediaSession = createSlice({
  name: 'mediaSession',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload, meta } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (next === undefined) return state;

      logger.log('[FSM]', 'mediaSession', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'START_PLAYBACK':
          state.step = meta.isFirst ? 'INITIALIZE_MEDIASESSION' : 'READY';
          break;
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () => {
  startListening({
    predicate: (_, currentState, prevState) => isStepChange(prevState, currentState, mediaSession.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().mediaSession;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INITIALIZE_MEDIASESSION: () => {
          const isSupported = 'mediaSession' in navigator;

          if (!isSupported) {
            return dispatch(
              sendEvent({
                type: 'INITIALIZE_MEDIASESSION_REJECT',
              })
            );
          }

          try {
            const { project_name, season_name, episode_name, thumbnail_url } = getTrackInfo(getState());
            const artwork = thumbnail_url ? [{ src: thumbnail_url, type: 'image/jpeg' }] : [];

            navigator.mediaSession.metadata = new MediaMetadata({
              title: `${project_name} ${season_name} ${episode_name}`,
              artwork,
            });
          } catch (err) {
            logger.log('[mediaSession]', 'The media session metadata is not supported yet.');
          }

          for (const [action, getHandler] of actionHandlers) {
            try {
              const handler = getHandler(getState());
              navigator.mediaSession.setActionHandler(
                action,
                handler
                  ? (details) => {
                      const event = handler(details);
                      dispatch(sendEvent({ type: 'MEDIA_EVENT', meta: { event } }));
                    }
                  : null
              );
            } catch (err) {
              logger.log('[mediaSession]', `The media session action "${action}" is not supported yet.`);
            }
          }

          dispatch(
            sendEvent({
              type: 'INITIALIZE_MEDIASESSION_RESOLVE',
            })
          );
        },
        PROCESSING_MEDIA_EVENT: () => {
          const {
            payload: { meta },
          } = action as PayloadAction<{
            meta: {
              event: EventPayload;
            };
          }>;

          logger.log('[mediaSession]', 'event', meta.event);

          dispatch(sendEvent({ ...meta.event, isMediaEvent: true }));
          dispatch(sendEvent({ type: 'PROCESSING_MEDIA_EVENT_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'mediaSession', step);
        effect();
      }
    },
  });

  startListening({
    predicate: (_, currentState) => currentState.mediaSession.step !== 'DISABLED',
    effect: (action) => {
      try {
        const event = action as PayloadAction<EventPayload>;

        switch (event.payload.type) {
          case 'CHANGE_TRACK':
            navigator.mediaSession.playbackState = 'none';
            break;
          case 'SET_PLAYING':
          case 'DO_PLAY_RESOLVE':
            navigator.mediaSession.playbackState = 'playing';
            break;
          case 'SET_PAUSED':
          case 'DO_PAUSE':
            navigator.mediaSession.playbackState = 'paused';
            break;
        }
      } catch (err) {}
    },
  });
};

export default {
  ...mediaSession,
  config,
  addMiddleware,
};
