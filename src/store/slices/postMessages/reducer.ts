import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { adEvents } from './effects/adEvents';
import { adultNotify } from './effects/adultNotify';
import { autoswitchPopup } from './effects/autoswitchPopup';
import { baseEvents } from './effects/baseEvents';
import { resumeNotify } from './effects/resumeNotify';
import { trialSuggestion } from './effects/trialSuggestion';
import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'POSTMESSAGE_LISTENERS_INIT',
    START_PLAYBACK: 'READY',
  },
  POSTMESSAGE_LISTENERS_INIT: {
    POSTMESSAGE_LISTENERS_INIT_RESOLVE: 'IDLE',
  },
  READY: {
    AD_BREAK_STARTED: 'IDLE',
    POSTMESSAGE_EVENT: 'PROCESSING_POSTMESSAGE_EVENT',
    NETWORK_ERROR: 'IDLE',
  },
  PROCESSING_POSTMESSAGE_EVENT: {
    PROCESSING_POSTMESSAGE_EVENT_RESOLVE: 'READY',
  },
};

const postMessages = createSlice({
  name: 'postMessages',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      if (next === undefined) return state;

      logger.log('[FSM]', 'postMessages', `${state.step} -> ${type} -> ${next}`);

      return next ? { ...state, step: next, ...payload } : { ...state, ...payload };
    });
  },
});

const addMiddleware = () => {
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, postMessages.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().postMessages;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        POSTMESSAGE_LISTENERS_INIT: () => {
          services.postMessageService
            .on('play', () => {
              dispatch(sendEvent({ type: 'POSTMESSAGE_EVENT', meta: { event: { type: 'DO_PLAY' } } }));
            })
            .on('pause', () => {
              dispatch(sendEvent({ type: 'POSTMESSAGE_EVENT', meta: { event: { type: 'DO_PAUSE' } } }));
            })
            .on('seek', ({ data }) => {
              const { duration } = getState().playback;
              if (!duration) return;

              const event: EventPayload = {
                type: 'SEEK',
                meta: { to: data.to > duration ? duration : data.to < 0 ? 0 : data.to },
              };

              dispatch(sendEvent({ type: 'POSTMESSAGE_EVENT', meta: { event } }));
            })
            .on('mute', () => {
              dispatch(
                sendEvent({
                  type: 'POSTMESSAGE_EVENT',
                  meta: { event: { type: 'SET_MUTE', payload: { value: true } } },
                })
              );
            })
            .on('unmute', () => {
              dispatch(
                sendEvent({
                  type: 'POSTMESSAGE_EVENT',
                  meta: { event: { type: 'SET_MUTE', payload: { value: false } } },
                })
              );
            })
            .on('setVolume', ({ data: { value } }) => {
              dispatch(
                sendEvent({
                  type: 'POSTMESSAGE_EVENT',
                  meta: { event: { type: 'SET_VOLUME', payload: { value } } },
                })
              );
            });

          dispatch(sendEvent({ type: 'POSTMESSAGE_LISTENERS_INIT_RESOLVE' }));
        },
        PROCESSING_POSTMESSAGE_EVENT: () => {
          const {
            payload: { meta },
          } = action as PayloadAction<{
            meta: {
              event: EventPayload;
            };
          }>;

          logger.log('[postMessages]', 'method', meta.event);

          dispatch(sendEvent({ ...meta.event, isPostMessageEvent: true }));
          dispatch(sendEvent({ type: 'PROCESSING_POSTMESSAGE_EVENT_RESOLVE' }));
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'postMessages', step);
        effect();
      }
    },
  });

  startListening({
    predicate: () => true,
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

      const event = action as PayloadAction<EventPayload>;

      autoswitchPopup(event, opts);
      baseEvents(event, opts);
      adEvents(event, opts);
      resumeNotify(event, opts);
      adultNotify(event, opts);
      trialSuggestion(event, opts);
    },
  });
};

export default {
  ...postMessages,
  config,
  addMiddleware,
};
