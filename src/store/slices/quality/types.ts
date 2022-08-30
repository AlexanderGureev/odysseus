import { TQualityList, TQualityRecord } from 'services/StreamQualityManager/types';
import { QUALITY_MARKS } from 'services/VigoService';
import { DefaultPayload, ErrorPayload, WithoutPayload } from 'store/types';

export type State =
  | 'IDLE'
  | 'QUALITY_INITIALIZATION'
  | 'QUALITY_CHANGE_PENDING'
  | 'READY'
  | 'AUTO_SELECT_QUALITY'
  | 'GET_VIDEO_META'
  | 'ERROR';

export type EventsWithPayload =
  | WithoutPayload<'QUALITY_CHANGE_REJECT' | 'AUTO_SELECT_QUALITY_RESOLVE'>
  | ErrorPayload<'QUALITY_INITIALIZATION_REJECT'>
  | {
      type: 'QUALITY_INITIALIZATION_RESOLVE';
      payload: {
        qualityRecord: TQualityRecord;
        qualityList: TQualityList;
        currentQualityMark: QUALITY_MARKS;
        currentURL: string;
        isAutoQualityMode: boolean;
      };
    }
  | {
      type: 'CHANGE_CURRENT_QUALITY' | 'AUTO_CHANGE_CURRENT_QUALITY';
      payload: { value: QUALITY_MARKS };
    }
  | {
      type: 'QUALITY_CHANGE_RESOLVE';
    }
  | {
      type: 'GET_VIDEO_META_RESOLVE';
      payload: { previousBitrate: number | null; videoMeta: VideoMeta };
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type VideoMeta = {
  video_resolution: string | null;
  video_format: string | null;
  dropped_frames: number | null;
  shown_frames: number | null;
  frame_rate: string | null;
  video_codec: string | null;
  audio_codec: string | null;
  bitrate: number | null;
};

export type FSMState = {
  step: State;

  qualityRecord: TQualityRecord;
  qualityList: TQualityList;
  currentQualityMark: QUALITY_MARKS;
  currentURL: string | null;

  previousTime: number;
  previousBitrate: number | null;
  qualityStats: {
    [key in QUALITY_MARKS]: number;
  };

  videoMeta: VideoMeta;
  isAutoQualityMode: boolean;
};
