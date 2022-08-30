import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Problem } from 'services/MailService/types';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import { getTrackInfo } from 'store/selectors';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { FSMState, State } from './types';

const initialState: FSMState = {
  step: 'IDLE',
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    PARSE_CONFIG_RESOLVE: null,
  },
  READY: {
    SEND_ERROR_REPORT: 'SEND_ERROR_REPORT_PENDING',
  },
  SEND_ERROR_REPORT_PENDING: {
    SEND_ERROR_REPORT_RESOLVE: 'READY',
    SEND_ERROR_REPORT_REJECT: 'READY',
  },
  DISABLED: {},
};

const errorReports = createSlice({
  name: 'errorReports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;

      if (next === undefined) return state;

      logger.log('[FSM]', 'errorReports', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'PARSE_CONFIG_RESOLVE':
          const {
            features: { FEATURE_COMPLAIN },
          } = payload;

          state.step = FEATURE_COMPLAIN ? 'READY' : 'DISABLED';
          break;
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () =>
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, errorReports.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().errorReports;

      const opts = {
        dispatch,
        getState,
        services,
      };

      const handler: { [key in State]?: () => Promise<void> | void } = {
        SEND_ERROR_REPORT_PENDING: async () => {
          try {
            const {
              root: { meta, session, config, features },
            } = getState();

            const {
              payload: {
                meta: { problems, description },
              },
            } = action as PayloadAction<{
              meta: {
                problems: Problem[];
                description: string;
              };
            }>;

            const { project_name, episode_name, season_name } = getTrackInfo(getState());
            const { location } = await services.embeddedCheckService.getIframeLocation();

            await services.mailService.send({
              clientIp: window.ENV.IP,
              email: features.EMAIL_FOR_COMPLAINTS || 'player@more.tv',
              app_version: window.ENV.APP_VERSION || 'unknown',
              web_version: 'unknown',
              list_problem: problems,
              player_location: location,
              problem_description: description,
              project_name,
              season_name,
              episode_name,
              track_id: meta.trackId,
              user_id: config.config.user_id,
              videosession_id: session.videosession_id,
            });

            dispatch(sendEvent({ type: 'SEND_ERROR_REPORT_RESOLVE' }));
          } catch (err) {
            logger.error('[mailService]', 'error send report', err?.message);
            dispatch(sendEvent({ type: 'SEND_ERROR_REPORT_REJECT' }));
          }
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'errorReports', step);
        effect();
      }
    },
  });

export default {
  ...errorReports,
  config,
  addMiddleware,
};
