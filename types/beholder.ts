export type BeholderTokenResponse = {
  data: {
    attributes: {
      player_token: string;
    };
    type: string;
  };
};

export type BeholderPayload = {
  user_id: number | null;
  track_id: number | null;
  stop_time: number;
  total_time: number;
  project_id?: number;
  season?: number;
  datetime: string;
};
