import { VIDEO_TYPE } from 'components/Player';
import { ViewedTimeContainer } from 'services/BeholderService';
import { TPlayerService } from 'services/PlayerService';
import { OUTPUT_PLAYER_POST_MESSAGE, PostMessageService } from 'services/PostMessageService';
import { SauronService } from 'services/SauronService';

export enum AnalyticsEvent {
  PLAY = 'PLAY',
  VIEW = 'VIEW',
  WATCH_POINT = 'WATCH_POINT',
}

type TWatchPointValue = number | '3min' | '1min';
type TMeasure = 'percents' | 'seconds';

export type TWatchPoints = Array<{ value: TWatchPointValue; num: number; measure: TMeasure }>;
export const DEFAULT_WATCH_POINTS: TWatchPoints = [
  {
    value: 0,
    num: 0,
    measure: 'percents',
  },
  {
    value: 25,
    num: 25,
    measure: 'percents',
  },
  {
    value: 50,
    num: 50,
    measure: 'percents',
  },
  {
    value: 75,
    num: 75,
    measure: 'percents',
  },
  {
    value: '1min',
    num: 60,
    measure: 'seconds',
  },
  {
    value: '3min',
    num: 180,
    measure: 'seconds',
  },
];

const DEFAULT_VIEW_POINT = 30;

export type TAnalyticsOptions = {
  watchPoints?: TWatchPoints;
  viewPoint?: number;
  trackId?: number | null;
  videosession_id: string | null;
  userId: number | null;
};

type TState = {
  watchPoints: TWatchPoints;
  viewPoint: number | null;
  trackId: number | null;
  videosession_id: string | null;
  userId: number | null;
  sid: string | null;
};

type TSendMap = {
  [AnalyticsEvent.PLAY]: () => void;
  [AnalyticsEvent.VIEW]: (params: { currentTime: number }) => void;
  [AnalyticsEvent.WATCH_POINT]: (params: { currentTime: number; value: TWatchPointValue }) => void;
};

const AnalyticsEventManagerService = () => {
  let player: TPlayerService;
  let state: TState = {
    watchPoints: [],
    viewPoint: null,
    trackId: null,
    videosession_id: null,
    userId: null,
    sid: null,
  };

  const viewedTimeContainer = ViewedTimeContainer();

  const createPayload = (currentTime: number) => ({
    track_id: state.trackId,
    videosession_id: state.videosession_id,
    user_id: state.userId,
    time_cursor: currentTime,
    duration: player.getState().duration,
    sid: state.sid,
  });

  const SEND_HANDLER_EVENT_MAP: TSendMap = {
    [AnalyticsEvent.PLAY]: () => {
      console.log('[AnalyticsEventManagerService] PLAY EVENT');
      PostMessageService.emit(OUTPUT_PLAYER_POST_MESSAGE.PLAY, { payload: createPayload(0) });
    },
    [AnalyticsEvent.VIEW]: ({ currentTime }) => {
      console.log('[AnalyticsEventManagerService] VIEW EVENT', state.viewPoint);
      PostMessageService.emit(OUTPUT_PLAYER_POST_MESSAGE.VIEW, {
        payload: { ...createPayload(currentTime), value: state.viewPoint },
      });
    },
    [AnalyticsEvent.WATCH_POINT]: ({ currentTime, value }) => {
      console.log('[AnalyticsEventManagerService] WATCH_POINT EVENT', value);
      PostMessageService.emit(OUTPUT_PLAYER_POST_MESSAGE.WATCH_POINT, {
        payload: { ...createPayload(currentTime), value },
      });
    },
  };

  const HANDLER_BY_EVENT_MAP: Record<AnalyticsEvent, () => void> = {
    [AnalyticsEvent.PLAY]: () => {
      player.one('play', SEND_HANDLER_EVENT_MAP[AnalyticsEvent.PLAY]);
    },
    [AnalyticsEvent.VIEW]: () => {
      const unsubscribe = player.on('timeupdate', () => {
        if (!state?.viewPoint) return;

        const { currentTime, seeking, videoType } = player.getState();
        if (videoType !== VIDEO_TYPE.PLAIN) return;

        viewedTimeContainer.onTimeUpdate(currentTime, seeking);
        const { viewTime } = viewedTimeContainer.getState();

        if (viewTime >= state.viewPoint) {
          unsubscribe();
          viewedTimeContainer.reset();
          SEND_HANDLER_EVENT_MAP[AnalyticsEvent.VIEW]({ currentTime });
        }
      });
    },
    [AnalyticsEvent.WATCH_POINT]: () => {
      const cache: Record<string, boolean> = {};

      player.on('timeupdate', () => {
        const { currentTime, duration, videoType } = player.getState();
        if (videoType !== VIDEO_TYPE.PLAIN) return;

        state.watchPoints.forEach(({ measure, value, num }) => {
          const current = {
            percents: () => Math.floor((currentTime / duration) * 100),
            seconds: () => Math.floor(currentTime),
          }[measure]?.();

          if (current === num) {
            if (!cache[num]) {
              SEND_HANDLER_EVENT_MAP[AnalyticsEvent.WATCH_POINT]({ currentTime, value });
              cache[num] = true;
            }

            return;
          }

          cache[num] = false;
        });
      });
    },
  };

  const init = (
    playerService: TPlayerService,
    { watchPoints = DEFAULT_WATCH_POINTS, viewPoint = DEFAULT_VIEW_POINT, ...rest }: TAnalyticsOptions
  ) => {
    state = { ...state, ...rest, watchPoints, viewPoint };
    player = playerService;

    SauronService.subscribe((sid) => {
      state.sid = sid;
    });

    Object.entries(HANDLER_BY_EVENT_MAP).forEach(([event, callback]) => callback());
  };

  return { init };
};

const instance = AnalyticsEventManagerService();
export { instance as AnalyticsEventManagerService };
