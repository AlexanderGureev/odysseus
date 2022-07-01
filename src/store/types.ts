import * as ad from './slices/ad';
import * as player from './slices/player';

export type FSMConfig<S extends string, E extends string> = {
  [state in S]?: {
    [event in E]?: S | undefined;
  };
};

export type EventPayload = player.EventPayload | ad.EventPayload;

export type AppEvent = player.Event | ad.Event;
