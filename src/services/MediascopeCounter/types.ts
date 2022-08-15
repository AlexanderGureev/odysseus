import { VIDEO_TYPE } from 'components/Player/types';
import { CounterWatchingOpts } from 'types/MediascopeCounter';

export type MediascopeInitOpts = {
  isEnabled: boolean;
  params: CounterWatchingOpts | null;
};

export type MediascopeEventParams = {
  currentTime: number;
  videoType: VIDEO_TYPE;
  trackId: number | null | undefined;
  userId: number | null;
};
