import { RawPlayerError } from 'types/errors';

import * as adBanner from './slices/adBanner';
import * as adBlock from './slices/adBlock';
import * as adBlockVolume from './slices/adBlockVolume';
import * as adController from './slices/adController';
import * as adTimeNotify from './slices/adTimeNotify';
import * as adultNotify from './slices/adultNotify';
import * as analytics from './slices/analytics';
import * as audioTracks from './slices/audioTracks';
import * as autoSwitch from './slices/autoSwitch';
import * as beholder from './slices/beholder';
import * as buffering from './slices/buffering';
import * as changeTrack from './slices/changeTrack';
import * as error from './slices/error';
import * as experiments from './slices/experiments';
import * as favourites from './slices/favourites';
import * as favouritesController from './slices/favouritesController';
import * as fullscreen from './slices/fullscreen';
import * as heartbeat from './slices/heartbeat';
import * as hotkeys from './slices/hotkeys';
import * as mediaSession from './slices/mediaSession';
import * as network from './slices/network';
import * as networkRecovery from './slices/networkRecovery';
import * as offlineMode from './slices/offlineMode';
import * as p2p from './slices/p2p';
import * as payButton from './slices/payButton';
import * as payNotify from './slices/payNotify';
import * as paywall from './slices/paywall';
import * as playback from './slices/playback';
import * as playbackSpeed from './slices/playbackSpeed';
import * as postMessages from './slices/postMessages';
import * as quality from './slices/quality';
import * as resumeVideo from './slices/resumeVideo';
import * as resumeVideoNotify from './slices/resumeVideoNotify';
import * as rewind from './slices/rewind';
import * as rewindAcc from './slices/rewindAcc';
import * as root from './slices/root';
import * as splashscreen from './slices/splashscreen';
import * as trialSuggestion from './slices/trialSuggestion';
import * as updater from './slices/updater';
import * as visibility from './slices/visibility';
import * as volume from './slices/volume';
import * as watchpoint from './slices/watchpoint';

export type FSMConfig<S extends string, E extends string> = {
  [state in S]?: {
    [event in E]?: S | null;
  };
};

export type DefaultPayload<E> = {
  type: E;
  payload?: Record<string, unknown>; // payload попадает в текущий state
  meta?: Record<string, unknown>; // meta используется для передачи данных в effect

  isKeyboardEvent?: boolean; // событие вызвано через горячую клавишу
  isPostMessageEvent?: boolean; // событие вызвано через postmessage
  isMediaEvent?: boolean; // событие вызвано через мультимедийные клавиши
};

export type WithoutPayload<T> = {
  type: T;
};

export type ErrorPayload<T> = {
  type: T;
  meta: { error: RawPlayerError };
};

export type EventPayload =
  | root.ActionPayload
  | adController.ActionPayload
  | adBlock.ActionPayload
  | updater.ActionPayload
  | playback.ActionPayload
  | rewind.ActionPayload
  | adTimeNotify.ActionPayload
  | error.ActionPayload
  | resumeVideo.ActionPayload
  | buffering.ActionPayload
  | quality.ActionPayload
  | watchpoint.ActionPayload
  | network.ActionPayload
  | changeTrack.ActionPayload
  | autoSwitch.ActionPayload
  | playbackSpeed.ActionPayload
  | volume.ActionPayload
  | visibility.ActionPayload
  | fullscreen.ActionPayload
  | adultNotify.ActionPayload
  | resumeVideoNotify.ActionPayload
  | hotkeys.ActionPayload
  | rewindAcc.ActionPayload
  | splashscreen.ActionPayload
  | beholder.ActionPayload
  | heartbeat.ActionPayload
  | networkRecovery.ActionPayload
  | offlineMode.ActionPayload
  | favourites.ActionPayload
  | favouritesController.ActionPayload
  | analytics.ActionPayload
  | p2p.ActionPayload
  | postMessages.ActionPayload
  | adBlockVolume.ActionPayload
  | mediaSession.ActionPayload
  | experiments.ActionPayload
  | payButton.ActionPayload
  | paywall.ActionPayload
  | payNotify.ActionPayload
  | adBanner.ActionPayload
  | audioTracks.ActionPayload
  | trialSuggestion.ActionPayload;

export type AppEvent =
  | root.Event
  | adController.Event
  | adBlock.Event
  | updater.Event
  | playback.Event
  | rewind.Event
  | adTimeNotify.Event
  | error.Event
  | resumeVideo.Event
  | buffering.Event
  | quality.Event
  | watchpoint.Event
  | network.Event
  | changeTrack.Event
  | autoSwitch.Event
  | playbackSpeed.Event
  | volume.Event
  | visibility.Event
  | fullscreen.Event
  | adultNotify.Event
  | resumeVideoNotify.Event
  | hotkeys.Event
  | rewindAcc.Event
  | splashscreen.Event
  | beholder.Event
  | heartbeat.Event
  | networkRecovery.Event
  | offlineMode.Event
  | favourites.Event
  | favouritesController.Event
  | analytics.Event
  | p2p.Event
  | postMessages.Event
  | adBlockVolume.Event
  | mediaSession.Event
  | experiments.Event
  | payButton.Event
  | paywall.Event
  | payNotify.Event
  | adBanner.Event
  | audioTracks.Event
  | trialSuggestion.Event;
