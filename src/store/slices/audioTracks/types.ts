import { DefaultPayload, ErrorPayload, WithoutPayload } from 'store/types';

export type Lang = 'rus' | 'eng';

export type LinkedAudioTrackItem = { currentLang: Lang; linkedVideoId: string; canonicalUrl: string };
export type LinkedAudioTracksConfig = {
  [key in string]?: LinkedAudioTrackItem;
};

export type State =
  | 'IDLE'
  | 'FETCHING_AUDIO_TRACKS_CONFIG'
  | 'SELECTING_AUDIO_TRACK_CONFIG'
  | 'READY'
  | 'CHANGE_AUDIO_TRACK_PENDING'
  | 'DISABLED';

export type EventsWithPayload =
  | {
      type: 'FETCHING_AUDIO_TRACKS_CONFIG_RESOLVE';
      payload: {
        audioTracksConfig: LinkedAudioTracksConfig;
      };
    }
  | {
      type: 'CHANGE_AUDIO_TRACK' | 'FETCHING_AUDIO_TRACKS_CONFIG_REJECT';
    }
  | {
      type: 'SELECTING_AUDIO_TRACK_CONFIG_RESOLVE';
      payload: {
        currentConfig: LinkedAudioTrackItem | null;
      };
    }
  | ErrorPayload<'CHANGE_AUDIO_TRACK_REJECT'>;

export type Event = EventsWithPayload['type'];

export type ActionPayload = DefaultPayload<Event> & EventsWithPayload;

export type FSMState = {
  step: State;
  audioTracksConfig: LinkedAudioTracksConfig;
  currentConfig: LinkedAudioTrackItem | null;
};
