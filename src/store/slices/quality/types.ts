import { TQualityList, TQualityRecord } from 'services/StreamQualityManager/types';
import { QUALITY_MARKS } from 'services/VigoService';
import { DefaultPayload, ErrorPayload, WithoutPayload } from 'store/types';

export type State = 'IDLE' | 'QUALITY_INITIALIZATION' | 'QUALITY_CHANGE_PENDING' | 'READY' | 'ERROR';

export type EventsWithPayload =
  | WithoutPayload<'QUALITY_CHANGE_REJECT'>
  | ErrorPayload<'QUALITY_INITIALIZATION_REJECT'>
  | {
      type: 'QUALITY_INITIALIZATION_RESOLVE';
      payload: {
        qualityRecord: TQualityRecord;
        qualityList: TQualityList;
        currentQualityMark: QUALITY_MARKS;
        currentURL: string;
      };
    }
  | {
      type: 'CHANGE_CURRENT_QUALITY';
      payload: { value: QUALITY_MARKS };
    }
  | {
      type: 'QUALITY_CHANGE_RESOLVE';
    };

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;

  qualityRecord: TQualityRecord;
  qualityList: TQualityList;
  currentQualityMark: QUALITY_MARKS;
  currentURL: string | null;

  previousTime: number;
  qualityStats: {
    [key in QUALITY_MARKS]: number;
  };
};
