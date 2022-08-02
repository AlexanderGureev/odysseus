export type TYmService = {
  init: (params: Partial<YMQueryParams>) => Promise<void>;
  reachGoal: (event: string) => void;
  sendUserParams: (payload: Partial<YMQueryParams>) => void;
  log: (payload?: Partial<YMQueryParams>) => void;
};

export type YMQueryParams = {
  sid: string | null;
  user_id: number | null;
  videosession_id: string;
};

export type YMInstance = (counterId: number, ...rest: any[]) => void;
