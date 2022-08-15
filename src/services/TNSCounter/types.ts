export type TNSEvent = 'sub_click' | 'load_ad_start' | 'video_load' | 'video_start' | 'video_end';

export type TNSEvents = { [key in TNSEvent]?: string };

export type HeartBeatTnsEvent = 'stop' | 'play' | 'pause' | 'time-update' | 'jump';
