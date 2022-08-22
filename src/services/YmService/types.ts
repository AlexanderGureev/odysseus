export type TYmService = {
  init: (params: Partial<YMQueryParams>) => Promise<void>;
  reachGoal: (event: string) => void;
  sendUserParams: (payload: Partial<YMQueryParams>) => void;
  log: (payload?: Partial<YMQueryParams>) => void;
};

export type YMQueryParams =
  | {
      sid: string | null;
      user_id: number | null;
      videosession_id: string;
    }
  | Record<string, any>;

export type YMInstance = (counterId: number, ...rest: any[]) => void;

export type YandexGoal =
  | 'disable_adv'
  | 'disable_adv_splash'
  | 'pay_and_watch'
  | 'next_episode'
  | 'previous_episode'
  | 'project'
  | 'season'
  | 'fullscreen'
  | 'next_episode_auto'
  | 'next_episode_click'
  | 'nextepisode_show_block'
  | 'menu'
  | 'hotkeys'
  | 'insert'
  | 'shering_button'
  | 'quality';
