import { VIDEO_TYPE } from 'components/Player/types';
import { isNil } from 'lodash';
import md5 from 'md5';
import { SkinClass } from 'types';
import { getCurrentTime } from 'utils';

const MEDIASCOPE_EVENT = {
  VIDEO_END: 0,
  VIDEO_START: 1,
  HEARTBEAT: 2,
  VIDEO_PAUSE: 3,
};

const MEDIASCOPE_EVENT_NAME = Object.keys(MEDIASCOPE_EVENT);

const HEARTBEAT_PERIOD_SEC = 30;
const AD_CONTENT_ID = 'advContentId';
const PARAMS_PLACEHOLDER = '**$$$params$$$**';

const MediascopeCounter = () => {
  const mediator = null;
  const isInitialized = false;

  const previousTime: Record<string, number> = {
    ad: 0,
    video: 0,
  };

  const heartBeatTime: Record<string, number> = {
    ad: 0,
    video: 0,
  };

  const heartbeatHandler = ({ videoType, currentTime }: any) => {
    const diff = currentTime - previousTime[videoType];

    // игнорируем перемотку
    if (diff > 1) {
      previousTime[videoType] = currentTime;
      return;
    }

    heartBeatTime[videoType] += currentTime - previousTime[videoType];
    previousTime[videoType] = currentTime;

    if (heartBeatTime[videoType] >= HEARTBEAT_PERIOD_SEC) {
      heartBeatTime[videoType] = 0;
      // send(createLink({ eventId: MEDIASCOPE_EVENT.HEARTBEAT, videoType, currentTime }));
    }
  };

  // const videoEndHandler = () => {
  //   send(createLink({ eventId: MEDIASCOPE_EVENT.VIDEO_END }));
  // };

  const handlePause = () => {
    // const { video_position } = store.getState().player;
    // send(createLink({ eventId: MEDIASCOPE_EVENT.VIDEO_PAUSE, currentTime: video_position }));
  };

  const init = () => {
    // const MEDIASCOPE_WATCHING_COUNTER = store.getState()?.config?.featuring?.MEDIASCOPE_WATCHING_COUNTER;
    // const {
    //   player: { player_embedded },
    //   mediascopeCounter,
    // } = store.getState();
    // if (!MEDIASCOPE_WATCHING_COUNTER || !mediascopeCounter) {
    //   Logger.log(`[MediascopeCounter] service disabled`, {
    //     is_active_feature: MEDIASCOPE_WATCHING_COUNTER,
    //     player_embedded,
    //     mediascopeCounter,
    //   });
    //   return;
    // }
    // if (isInitialized) return;
    // mediator = patchWithModuleInfo(new Mediator(), {
    //   id: uniqueId(),
    //   name: 'MediascopeCounter',
    // });
    // [
    //   HORUS_EVENT.HORUS_GOTO,
    //   HORUS_EVENT.HORUS_SESSION_STARTED, // используем для очистки состояния heartBeatTime
    //   M_EVENTS.PLAYER_ENDED,
    //   M_EVENTS.AUTO_SWITCH_GO_TO_NEXT_EPISODE, // автопереключение в конце трека/автопереключение в начале титров
    //   M_EVENTS.CONTROL_NEW_NEXT_EPISODE_CLICK, // переключений серий через контроллы
    //   M_EVENTS.CONTROL_NEW_PREV_EPISODE_CLICK,
    //   M_EVENTS.PLAYER_REWINDED_WITH_KEYBOARD,
    //   M_EVENTS.PLAYER_REWOUND,
    //   M_EVENTS.PLAYER_STARTED,
    //   M_EVENTS.CONTROL_PAUSE_CLICK,
    //   M_EVENTS.CONTROLS_TOGGLE,
    //   M_EVENTS.PLAYER_SET_PAUSE,
    //   M_EVENTS.AD_START,
    //   M_EVENTS.AD_RESUME,
    //   M_EVENTS.AD_PAUSE,
    //   M_EVENTS.AD_STOP,
    //   M_EVENTS.AD_BREAK_STOP,
    //   M_EVENTS.PLAYER_TIME_UPDATE,
    // ].forEach((type) => {
    //   mediator.subscribe(type, ({ payload = {} }) => {
    //     routeEvent(type, payload);
    //   });
    // });
    // isInitialized = true;
  };

  // const routeEvent = <T>(type: M_EVENTS | HORUS_EVENT, payload: T) => {
  //   ({
  //     [HORUS_EVENT.HORUS_SESSION_STARTED]: () => {
  //       heartBeatTime.ad = 0;
  //       previousTime.ad = 0;
  //       heartBeatTime.video = 0;
  //       previousTime.video = 0;
  //     },
  //     [HORUS_EVENT.HORUS_GOTO]: () => {
  //       send(createLink({ eventId: MEDIASCOPE_EVENT.VIDEO_END }));
  //     },
  //     [M_EVENTS.PLAYER_STARTED]: ({ videoType, currentTime }: TPlayerStartedPayload) => {
  //       if (videoType === VIDEO_TYPE.ADVERTISEMENT) return;
  //       send(createLink({ eventId: MEDIASCOPE_EVENT.VIDEO_START, currentTime }));
  //     },
  //     [M_EVENTS.CONTROL_PAUSE_CLICK]: handlePause,
  //     [M_EVENTS.PLAYER_SET_PAUSE]: ({ manual }: { manual?: boolean }) => {
  //       if (!manual) handlePause();
  //     },
  //     [M_EVENTS.CONTROLS_TOGGLE]: () => {
  //       const { playback, video_position } = store.getState().player;
  //       if (playback === PLAYBACK.PLAYING) {
  //         send(createLink({ eventId: MEDIASCOPE_EVENT.VIDEO_PAUSE, currentTime: video_position }));
  //       }
  //     },
  //     [M_EVENTS.PLAYER_REWINDED_WITH_KEYBOARD]: () => {
  //       send(createLink({ eventId: MEDIASCOPE_EVENT.VIDEO_END }));
  //     },
  //     [M_EVENTS.PLAYER_REWOUND]: ({ currentTime }: TPlayerRewoundPayload) => {
  //       send(createLink({ eventId: MEDIASCOPE_EVENT.VIDEO_START, currentTime }));
  //     },
  //     [M_EVENTS.PLAYER_ENDED]: () => {
  //       const {
  //         config: {
  //           featuring: { NEXT_EPISODE_AUTOPLAY },
  //           video_data: { linkedTracks: { next } = {} },
  //         },
  //       } = store.getState();

  //       if (NEXT_EPISODE_AUTOPLAY && next) return;

  //       videoEndHandler();
  //     },
  //     [M_EVENTS.AUTO_SWITCH_GO_TO_NEXT_EPISODE]: videoEndHandler,
  //     [M_EVENTS.CONTROL_NEW_NEXT_EPISODE_CLICK]: videoEndHandler,
  //     [M_EVENTS.CONTROL_NEW_PREV_EPISODE_CLICK]: videoEndHandler,
  //     [M_EVENTS.AD_START]: () => {
  //       send(createLink({ eventId: MEDIASCOPE_EVENT.VIDEO_START, videoType: VIDEO_TYPE.AD }));
  //     },
  //     [M_EVENTS.AD_RESUME]: () => {
  //       send(createLink({ eventId: MEDIASCOPE_EVENT.VIDEO_START, videoType: VIDEO_TYPE.AD }));
  //     },
  //     [M_EVENTS.AD_PAUSE]: () => {
  //       send(createLink({ eventId: MEDIASCOPE_EVENT.VIDEO_PAUSE, videoType: VIDEO_TYPE.AD }));
  //     },
  //     [M_EVENTS.AD_STOP]: () => {
  //       heartBeatTime.ad = 0;
  //       previousTime.ad = 0;
  //       send(createLink({ eventId: MEDIASCOPE_EVENT.VIDEO_END, videoType: VIDEO_TYPE.AD }));
  //     },
  //     [M_EVENTS.PLAYER_TIME_UPDATE]: heartbeatHandler,
  //   }[type]?.(payload));
  // };

  const createLink = ({
    eventId,
    currentTime,
    videoType = VIDEO_TYPE.PLAIN,
  }: {
    eventId: number;
    currentTime?: number;
    videoType?: VIDEO_TYPE;
  }) => {
    // const { mediascopeCounter } = store.getState();
    // if (!mediascopeCounter) return null;
    // const {
    //   config: {
    //     video_data: { authorizedUserId, videoId },
    //     track_info,
    //     featuring: { THEME_CLASS },
    //   },
    //   player: { video_position = 0, ad_position = 0 },
    // } = store.getState();
    // const trackId = THEME_CLASS === SkinClass.MORE_TV ? track_info?.track?.morpheusId : videoId;
    // const params = {
    //   hid: () => (authorizedUserId ? md5(`${authorizedUserId}`) : null),
    //   idlc: () => (videoType === VIDEO_TYPE.PLAIN ? trackId : AD_CONTENT_ID),
    //   view: () => eventId,
    //   fts: () => {
    //     const ts = currentTime ?? (videoType === VIDEO_TYPE.PLAIN ? video_position : ad_position);
    //     return Math.floor(ts);
    //   },
    // };
    // const payload = Object.entries(mediascopeCounter.params).reduce((acc, [key, val]) => {
    //   const value = params[key] ? params[key]() : val;
    //   return isNil(value) ? acc : { ...acc, [key]: value };
    // }, {});
    // const query = new URLSearchParams(payload);
    // const link = mediascopeCounter.link.replace(PARAMS_PLACEHOLDER, query.toString());
    // console.log(`[MediascopeCounter]:[${MEDIASCOPE_EVENT_NAME[eventId]}]:${getCurrentTime()}`, { payload, link });
    // return link;
  };

  const send = async (link: string | null) => {
    try {
      if (!link) throw new Error('link is null');

      const response = await fetch(link, { method: 'GET', credentials: 'include' });
      if (!response.ok)
        throw new Error(`failed to send, status - ${response.status}, statusText: ${response.statusText}`);
    } catch (err) {
      console.error('[MediascopeCounter]', err?.message);
    }
  };

  return {
    init,
  };
};

const instance = MediascopeCounter();
export { instance as MediascopeCounter };
