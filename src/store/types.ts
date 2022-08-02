import { RawPlayerError } from 'types/errors';

import * as adBlock from './slices/adBlock';
import * as adController from './slices/adController';
import * as adTimeNotify from './slices/adTimeNotify';
import * as autoSwitch from './slices/autoSwitch';
import * as buffering from './slices/buffering';
import * as changeTrack from './slices/changeTrack';
import * as error from './slices/error';
import * as network from './slices/network';
import * as playback from './slices/playback';
import * as playbackSpeed from './slices/playbackSpeed';
import * as quality from './slices/quality';
import * as resumeVideo from './slices/resumeVideo';
import * as rewind from './slices/rewind';
import * as root from './slices/root';
import * as switcher from './slices/switcher';
import * as updater from './slices/updater';
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
  | switcher.ActionPayload
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
  | volume.ActionPayload;

export type AppEvent =
  | root.Event
  | adController.Event
  | adBlock.Event
  | updater.Event
  | switcher.Event
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
  | volume.Event;
