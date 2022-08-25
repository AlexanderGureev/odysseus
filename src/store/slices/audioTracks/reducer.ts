import { createAction, createSlice } from '@reduxjs/toolkit';
import { fetchConfig } from 'api';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { ERROR_CODES } from 'types/errors';
import { buildQueryParams } from 'utils';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';
import { request } from 'utils/request';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
  audioTracksConfig: {},
  currentConfig: null,
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'FETCHING_AUDIO_TRACKS_CONFIG',
    PARSE_CONFIG_RESOLVE: 'SELECTING_AUDIO_TRACK_CONFIG',
  },
  FETCHING_AUDIO_TRACKS_CONFIG: {
    FETCHING_AUDIO_TRACKS_CONFIG_RESOLVE: 'SELECTING_AUDIO_TRACK_CONFIG',
    FETCHING_AUDIO_TRACKS_CONFIG_REJECT: 'DISABLED',
  },
  SELECTING_AUDIO_TRACK_CONFIG: {
    SELECTING_AUDIO_TRACK_CONFIG_RESOLVE: 'READY',
  },
  READY: {
    CHANGE_TRACK: 'IDLE',
    CHANGE_AUDIO_TRACK: 'CHANGE_AUDIO_TRACK_PENDING',
  },
  CHANGE_AUDIO_TRACK_PENDING: {
    CHANGE_TRACK: 'IDLE',
    CHANGE_AUDIO_TRACK_REJECT: 'IDLE',
  },
  DISABLED: {},
};

const audioTracks = createSlice({
  name: 'audioTracks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (next === undefined) return state;

      logger.log('[FSM]', 'audioTracks', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'PARSE_CONFIG_RESOLVE':
          return { ...state, step };
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, audioTracks.name),
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

      const { step } = getState().audioTracks;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        FETCHING_AUDIO_TRACKS_CONFIG: async () => {
          try {
            if (!window.ENV?.APP_STATIC_ENDPOINT || !window.ENV?.LINKED_AUDIO_TRACKS_CONFIG_PATH) {
              throw new Error('env is not setup');
            }

            const endpoint = `${window.ENV.APP_STATIC_ENDPOINT}${window.ENV.LINKED_AUDIO_TRACKS_CONFIG_PATH}`;

            const response = await request.get(endpoint);
            if (!response.ok) throw new Error(`request failed: ${response.status}, ${response.statusText}`);

            const data = await response.json();
            dispatch(
              sendEvent({
                type: 'FETCHING_AUDIO_TRACKS_CONFIG_RESOLVE',
                payload: {
                  audioTracksConfig: data,
                },
              })
            );
          } catch (err) {
            logger.error('[audioTracks]', 'fetch config', err?.message);

            dispatch(
              sendEvent({
                type: 'FETCHING_AUDIO_TRACKS_CONFIG_REJECT',
              })
            );
          }
        },
        SELECTING_AUDIO_TRACK_CONFIG: () => {
          const {
            audioTracks: { audioTracksConfig },
            root: {
              meta: { trackId },
            },
          } = getState();

          const currentConfig = audioTracksConfig[`${trackId}`] || null;
          dispatch(sendEvent({ type: 'SELECTING_AUDIO_TRACK_CONFIG_RESOLVE', payload: { currentConfig } }));
        },
        CHANGE_AUDIO_TRACK_PENDING: async () => {
          try {
            const {
              root: { meta, session, config },
              audioTracks: { currentConfig },
              playback,
            } = getState();

            if (!currentConfig || !window.ENV?.SIREN_PUBLIC_HOST) {
              throw new PlayerError(ERROR_CODES.UNKNOWN, 'audio track config or SIREN_PUBLIC_HOST is undefined');
            }

            const queryParams = buildQueryParams({
              track_id: currentConfig.linkedVideoId,
              partner_id: meta.partnerId,
              user_token: meta.userToken,
            });

            const configURL = `${window.ENV.SIREN_PUBLIC_HOST}/player/config?${queryParams}`;

            services.postMessageService.emit('BI', {
              payload: {
                page: 'player',
                block: 'footer',
                event_type: 'click',
                event_name: 'audio_choose',
                event_value: currentConfig.currentLang === 'rus' ? 'english' : 'russian',
              },
            });

            services.postMessageService.emit('new_track', {
              payload: {
                auto: false,
                overlay: false,
                project_id: config.config?.project_id,
                target: 'change_audio_track',
                time_cursor: playback.currentTime || 0,
                track_id: meta.trackId,
                videosession_id: session.videosession_id,
                trackDescription: {
                  playerConfig: configURL,
                  trackId: Number(currentConfig.linkedVideoId),
                  canonicalUrl: currentConfig.canonicalUrl,
                },
              },
            });

            const { location } = await services.embeddedCheckService.getIframeLocation();
            const trackConfig = await fetchConfig(configURL, location);

            dispatch(
              sendEvent({
                type: 'CHANGE_TRACK',
                meta: {
                  config: trackConfig,
                  context: {
                    user_token: meta.userToken,
                  },
                  params: {
                    p2p: false,
                    startAt: null,
                    sign: null,
                    pf: null,
                    pt: null,
                  },
                },
              }),
              {
                currentSession: true,
              }
            );
          } catch (err) {
            dispatch(
              sendEvent({
                type: 'CHANGE_AUDIO_TRACK_REJECT',
                meta: { error: err.serialize() },
              })
            );
          }
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'audioTracks', step);
        effect();
      }
    },
  });

export default {
  ...audioTracks,
  config,
  addMiddleware,
};
