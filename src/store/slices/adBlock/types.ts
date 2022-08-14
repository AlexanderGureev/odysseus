import { AdLinksByType } from 'services/AdService/types';
import { DefaultPayload, WithoutPayload } from 'store/types';
import { TAdPointConfig } from 'types/ad';

export type State =
  | 'IDLE'
  | 'NEXT_BLOCK_PENDING'
  | 'START_BLOCK_PENDING'
  | 'PLAY_AD_BLOCK_PENDING'
  | 'PAUSE_AD_BLOCK_PENDING'
  | 'SKIP_AD_BLOCK_PENDING'
  | 'PLAYING'
  | 'PAUSED'
  | 'END';

export type EventsWithPayload =
  | WithoutPayload<
      | 'DO_PLAY_AD_BLOCK'
      | 'DO_SKIP_AD_BLOCK'
      | 'DO_PAUSE_AD_BLOCK'
      | 'PLAY_AD_BLOCK_RESOLVE'
      | 'PAUSE_AD_BLOCK_RESOLVE'
      | 'RESET'
      | 'AD_BLOCK_IMPRESSION'
    >
  | {
      type: 'AD_BLOCK_TIME_UPDATE';
      payload: { currentTime: number; duration: number; remainingTime: number };
    }
  | {
      type: 'AD_BLOCK_VOLUME_CHANGE';
      meta: { value: number };
    }
  | {
      type: 'PLAY_NEXT_BLOCK';
      payload: {
        index: number;
        links: AdLinksByType;
        skippable: boolean;
        isVolumeAvailable: boolean;
      };
    }
  | {
      type: 'START_AD_BREAK';
      payload: {
        links: AdLinksByType;
        point: TAdPointConfig;
        limit: number;
      };
    }
  | {
      type: 'AD_BLOCK_END';
      payload: {
        links: AdLinksByType;
        isExclusive: boolean;
        isPromo: boolean;
      };
      meta: {
        error: string | null;
      };
    }
  | {
      type: 'AD_STATE_CHANGE';
      payload: {
        skippable?: boolean;
        isVolumeAvailable?: boolean;
      };
    }
  | {
      type: 'AD_BLOCK_VIDEO_QUARTILE';
      payload: {
        value: number;
      };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  links: AdLinksByType;
  point: TAdPointConfig;
  limit: number;
  index: number;
  isExclusive: boolean;
  isPromo: boolean;
  skippable: boolean;
  isVolumeAvailable: boolean;

  currentTime: number | null;
  duration: number | null;
  remainingTime: number | null;
};
