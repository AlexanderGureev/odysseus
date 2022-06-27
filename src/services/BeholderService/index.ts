/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from 'axios';
import { TScrobbling } from 'server/types';
import { Nullable } from 'types';

type TBeholderParams = {
  userToken?: string;
  userId: Nullable<number>;
  projectId: number;
  duration?: number;
  trackId?: number;
  seasonName?: string;
  scrobbling: TScrobbling;
  serviceDisabled: boolean;
};

type TBeholderState = {
  userToken: string;
  userId: number;
  projectId?: number;
  duration?: number;
  trackId: number | null;
  seasonNum?: number;
  scrobbling?: TScrobbling;
  disabled: boolean;
  token: Nullable<string>;
};

type TBeholderTokenResponse = {
  data: {
    type: string;
    attributes: {
      player_token: string;
    };
  };
};

type TBeholderPayload = {
  user_id: number;
  track_id: number;
  stop_time: number;
  total_time: number;
  project_id?: number;
  season?: number;
  datetime: string;
};

const CONTAIN_NUMBER_REGEX = /\d+/gi;

const initalState: TBeholderState = {
  userId: -1,
  userToken: '',
  token: null,
  disabled: true,
  trackId: null,
};

export const ViewedTimeContainer = () => {
  let state: { prevTime: Nullable<number>; viewTime: number } = { prevTime: null, viewTime: 0 };

  const onTimeUpdate = (currentTime: number, seeking: boolean) => {
    if (seeking) {
      state.prevTime = currentTime;
      return;
    }

    const tick = state.prevTime ? currentTime - state.prevTime : 0;
    state.prevTime = currentTime;
    state.viewTime += tick;
  };

  const reset = () => {
    state = { prevTime: null, viewTime: 0 };
  };

  const getState = () => ({ ...state });

  return { reset, getState, onTimeUpdate };
};

const BeholderService = () => {
  let state: TBeholderState = initalState;
  let points: Record<string, boolean> = {};
  const viewedTimeContainer = ViewedTimeContainer();

  const init = async ({ serviceDisabled, seasonName, userId, ...params }: TBeholderParams) => {
    if (!params.userToken || serviceDisabled) {
      state = initalState;
      return;
    }

    state = {
      ...state,
      ...params,
      userId: userId || -1,
      disabled: false,
    };

    const num = seasonName?.match(CONTAIN_NUMBER_REGEX)?.[0];
    if (num) state.seasonNum = Number(num);

    if (params.scrobbling?.mandatory_points?.length) {
      points = params.scrobbling.mandatory_points.reduce((acc, key) => ({ ...acc, [key]: false }), {});
    }

    state.token = await fetchToken();
  };

  const isPointReached = (currentTime: number) => {
    if (!state.duration) return;

    const progress = Math.round((currentTime / state.duration) * 100);

    console.log('[beholder] progress: ', progress);
    console.log('[beholder] points: ', points);

    if (points[progress] === false) {
      points[progress] = true;
      return true;
    }

    return false;
  };

  const fetchToken = async () => {
    try {
      const host = state.scrobbling?.hostname;
      if (!host) return null;

      console.log(`[beholder] fetchToken`);

      const { data } = await axios.get<TBeholderTokenResponse>(`${host}/token`, {
        params: { service_id: state?.scrobbling?.serviceId || 1 },
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${state.userToken}`,
        },
      });

      const token = data?.data?.attributes?.player_token;
      return token || null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const getDateTime = () => new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

  const saveTime = async (currentTime: number) => {
    if (!state.trackId || !state.duration || state.disabled) return;

    const data: TBeholderPayload = {
      user_id: state.userId,
      track_id: state.trackId,
      stop_time: currentTime,
      total_time: state.duration,
      project_id: state.projectId,
      datetime: getDateTime(),
    };

    if (state.seasonNum) data.season = state.seasonNum;

    const payload = {
      user_id: state.userId,
      views: [data],
    };

    console.log(`[beholder] save time: ${currentTime}`, payload);

    try {
      const host = state.scrobbling?.hostname;
      if (!host) return;

      await axios({
        method: 'POST',
        url: `${host}/views`,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${state.token}`,
        },
        data: payload,
      });
    } catch (e: unknown) {
      const error = e as { response: { status: number } };
      console.error(error);

      if (error?.response?.status === 401 && !state.disabled) {
        const token = await fetchToken();
        if (token) {
          state.token = token;
          saveTime(currentTime);
        }
      }
    }
  };

  const checkPeriodUpdate = (currentTime: number) => {
    if (!state.scrobbling?.period) return;

    const { viewTime } = viewedTimeContainer.getState();

    console.log('[beholder] tick', viewTime, state.scrobbling.period);
    if (viewTime > state.scrobbling.period) {
      saveTime(currentTime);
      viewedTimeContainer.reset();
    }
  };

  const onTimeUpdate = (currentTime: number, seeking: boolean) => {
    if (isPointReached(currentTime)) saveTime(currentTime);

    viewedTimeContainer.onTimeUpdate(currentTime, seeking);
    checkPeriodUpdate(currentTime);
  };

  return { init, saveTime, onTimeUpdate };
};

const instance = BeholderService();
export { instance as BeholderService };
