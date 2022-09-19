/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createAction, createSlice } from '@reduxjs/toolkit';
import { ExperimentsCfg, ExperimentsState, PlayerExperiment } from 'services/ExperimentsService/types';
import { FSM_EVENT, sendEvent } from 'store/actions';
import { isStepChange, startListening } from 'store/middleware';
import type { AppEvent, EventPayload, FSMConfig } from 'store/types';
import { logger } from 'utils/logger';

import { Meta } from '../root';
import { FSMState, State } from './types';

const ymParams: { [key in PlayerExperiment]?: Record<string, any> } = {
  EXP_ACTI_73: {
    page: 'player',
  },
};

const selectActiveExperiments = ({ isEmbedded, partnerId }: Meta, config: ExperimentsCfg) => {
  const data = Object.keys(config).reduce((acc: PlayerExperiment[], name) => {
    const experimentName = name as PlayerExperiment;
    const { value, partners, embedType } = config[experimentName]!;

    if (value !== 'experiment') return acc;
    if (partnerId && partners?.length && !partners.includes(`${partnerId}`)) return acc;
    if (embedType === 'embedded' && !isEmbedded) return acc;
    if (embedType === 'resource' && isEmbedded) return acc;

    return [...acc, experimentName];
  }, []);

  return data;
};

const initialState: FSMState = {
  step: 'IDLE',
  web: {
    experiments: {},
  },
  player: {
    experiments: {},
    distribution: {},
  },
};

const config: FSMConfig<State, AppEvent> = {
  IDLE: {
    DO_INIT: 'INIT_EXPERIMENTS_SUBSCRIBER',
    PARSE_CONFIG_RESOLVE: null,
    SET_EXPERIMENT: null,
    INIT_ANALYTICS_RESOLVE: 'INIT_EXPERIMENTS',
  },
  INIT_EXPERIMENTS_SUBSCRIBER: {
    INIT_EXPERIMENTS_SUBSCRIBER_RESOLVE: 'IDLE',
  },
  INIT_EXPERIMENTS: {
    INIT_EXPERIMENTS_RESOLVE: 'IDLE',
    INIT_EXPERIMENTS_REJECT: 'IDLE',
  },
};

const experiments = createSlice({
  name: 'experiments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAction<EventPayload>(FSM_EVENT), (state, action) => {
      const { type, payload } = action.payload;

      const next = config[state.step]?.[type];
      const step = next || state.step;
      if (next === undefined) return state;

      logger.log('[FSM]', 'experiments', `${state.step} -> ${type} -> ${next}`);

      switch (type) {
        case 'PARSE_CONFIG_RESOLVE':
          state.web.experiments = { ...state.web.experiments, ...payload.params.experiments };
          break;
        case 'SET_EXPERIMENT':
          const { name, group } = payload;
          state.web.experiments[name] = group;
          break;
        case 'INIT_EXPERIMENTS_RESOLVE':
          state.step = step;
          state.player = payload;
          break;
        default:
          return { ...state, step, ...payload };
      }
    });
  },
});

const addMiddleware = () => {
  startListening({
    predicate: (action, currentState, prevState) => isStepChange(prevState, currentState, experiments.name),
    effect: (action, api) => {
      const {
        getState,
        extra: { services, createDispatch },
      } = api;

      const dispatch = createDispatch({
        getState,
        dispatch: api.dispatch,
      });

      const { step } = getState().experiments;

      const handler: { [key in State]?: () => Promise<void> | void } = {
        INIT_EXPERIMENTS_SUBSCRIBER: () => {
          services.postMessageService.on('set_experiment_group', ({ data }) => {
            dispatch(sendEvent({ type: 'SET_EXPERIMENT', payload: data }));
          });

          dispatch(sendEvent({ type: 'INIT_EXPERIMENTS_SUBSCRIBER_RESOLVE' }));
        },
        INIT_EXPERIMENTS: () => {
          const { experiments: experimentsCfg } = getState().root.config;

          if (!experimentsCfg) {
            dispatch(sendEvent({ type: 'INIT_EXPERIMENTS_REJECT' }));
            return;
          }

          const { root } = getState();

          const { experiments, distribution } = services.experimentsService.init(experimentsCfg);
          const data = selectActiveExperiments(root.meta, experimentsCfg);

          const state = data.reduce((state: ExperimentsState, name) => {
            const nextState = services.experimentsService.engageExperiment(name, state, distribution);
            if (!nextState) return state;

            const params = {
              event_type: 'auto',
              event_name: 'experiment',
              event_value: name,
              block: name,
              ...ymParams[name],
            };

            services.ymService.log(params);
            services.postMessageService.emit('BI', {
              payload: params,
            });
            services.horusService.routeEvent('HORUS_CUSTOM_EVENT', {
              additional: params,
            });

            return { ...state, ...nextState };
          }, experiments);

          dispatch(
            sendEvent({
              type: 'INIT_EXPERIMENTS_RESOLVE',
              payload: {
                distribution,
                experiments: state,
              },
            })
          );
        },
      };

      const effect = handler[step];
      if (effect) {
        logger.log('[MW]', 'experiments', step);
        effect();
      }
    },
  });
};

export default {
  ...experiments,
  config,
  addMiddleware,
};
