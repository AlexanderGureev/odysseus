import { Nullable, TScrobbling } from 'types';

export type TBeholderParams = {
  userToken: string | null;
  userId: Nullable<number>;
  projectId: number;
  duration?: number;
  trackId?: number;
  seasonName?: string;
  scrobbling?: TScrobbling;
  serviceDisabled: boolean;
};

export type TBeholderState = {
  userToken: string | null;
  userId: number;
  projectId?: number;
  duration?: number;
  trackId: number | null;
  seasonNum?: number;
  scrobbling?: TScrobbling;
  disabled: boolean;
  token: Nullable<string>;
};

export type TBeholderTokenResponse = {
  data: {
    type: string;
    attributes: {
      player_token: string;
    };
  };
};

export type TBeholderPayload = {
  user_id: number;
  track_id: number;
  stop_time: number;
  total_time: number;
  project_id?: number;
  season?: number;
  datetime: string;
};
