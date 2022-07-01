export type TYmService = {
  init: (params: Partial<YMQueryParams>) => void;
  reachGoal: (event: string) => void;
  sendUserParams: (payload: Partial<YMQueryParams>) => void;
  log: (payload?: Partial<YMQueryParams>) => void;
};

export type YMQueryParams = {
  sid: string | null;
  user_id: number;
  videosession_id: string;
};
