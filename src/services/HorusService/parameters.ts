// https://confluence.more.tv/display/ARCH/TABLE.EVENTS.PARAMETERS

export enum CONNECTIONS_TYPES {
  WIFI = 'wifi',
  CELLULAR = 'cellular',
  ETHERNET = 'ethernet',
  BLUETHOTH = 'bluetooth',
  NONE = 'none',
  WIMAX = 'wimax',
  OTHER = 'other',
  MOBILE = 'mobile',
  LAN = 'lan',
  UNKNOWN = 'unknown',
}

export enum STREAM_LOWER_CASE {
  HLS = 'hls',
  DASH = 'dash',
  MSS = 'mss',
  MP4 = 'mp4',
  NO_VIDEO = 'no_video',
}

export enum VIDEO_BUSSINESS_MODEL_TYPES {
  SVOD = 'svod',
  AVOD = 'avod',
  PREVIEW = 'preview',
  UNKNOWN = 'unknown',
}

export type TFullscreen = 'yes' | 'no' | 'floating';

export type TParameters = {
  module?: 'player' | 'ad' | 'analytics' | 'network'; // Модуль, в котором произошло событие/ошибка
  streaming_session_id: string; // Идентификатор сессии стриминга (уникальный для трека)
  nessie_id: number; // Nessie id пользователя
  track_id: number; // Идентификатор трека
  video_position: number; // Время от начала видео в момент события.
  viewport_width: number; // Ширина viewport для видео в физических пикселях
  viewport_height: number; // Высота viewport для видео в физических пикселях
  fullscreen: TFullscreen; // Включен ли полноэкранный режим
  video_type: 'video' | 'ad'; // Тип воспроизводимого видео
  drm: 'no_drm' | 'fairplay' | 'widevine' | 'playready'; // Используемый для воспроизведения метод DRM.
  drm_supported: Array<'fairplay' | 'widevine' | 'playready'>; // Технологии DRM, поддерживаемые клиентом
  bitrate: number; // Битрейт видео (из манифеста)
  bandwidth: number; // Скорость передачи данных видеопотока
  readahead: number; // Продолжительность загруженного видео от текущей точки
  dropped_frames: number; // Суммарное число дропнутых кадров в момент события
  shown_frames: number; // Суммарное число показанных кадров в момент события
  video_format: string; // Информация о формате воспроизводимого видео
  audio_format: string; // Информация о формате воспроизводимого аудио
  stream_hostname: string; // Название хоста, с которого клиент получает видеопоток на момент события
  app_name: string; // Название продукта компании
  player_embedded: boolean; // Признак того, что плеер встроен на стороннем ресурсе
  player_id: string; // Скин плеера
  player_version: string; // Версия плеера
  volume: number; // Громкость, установленная для видео в плеере в момент события
  stream_chosen: STREAM_LOWER_CASE; // Используемый для воспроизведения протокол стриминга
  device_type: string; // Информация о типе витрины.
  device_os: string; // Информация об операционной системе
  device_model: string; // Информация о модели устройства
  device_timezone: string; // Таймзона на пользовательском устройстве
  device_timestamp: number; // Дата и время на пользовательском устройстве в момент события
  hacks_detected: 'adblock' | 'root' | 'jailbreak';
  sauron_id: string; // Sauron ID, GUID
  network_type: CONNECTIONS_TYPES; // Тип подключения клиентского устройства к сети
  event_num: number; // Порядковый номер события, совершенного клиентом в рамках сессии (videosession_id). Нумерация начинается с 1.
  ym_client_id: number; // client_id из Я.Метрики
  videosession_id: string; // ID видеосессии
  debug_info: string; // отладочная информация
  ad_roll_type_puid3: number; // Значение в параметре puid3 вызываемого рекламного url.
  video_business_model: VIDEO_BUSSINESS_MODEL_TYPES; // Тип монетизации воспроизводимого видео
  user_subscription: 'none' | 'trial' | 'introductory_price' | 'full_price' | 'promocode'; // Способ приобретения подписки пользователем
  partner_id: number; // id партнера
};
