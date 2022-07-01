import React from 'react';
import { isAndroid,isIOS } from 'react-device-detect';
import { Nullable, SkinClass } from 'types';
import { ERROR_CODES, ERROR_TYPE } from 'types/errors';

import app_store_black_icon from './icons/app_store_black_icon.svg';
import app_store_white_icon from './icons/app_store_white_icon.svg';
import che_logo_icon from './icons/che_logo_icon.svg';
import ctc_kids_icon from './icons/ctc_kids_logo_icon.svg';
import ctc_logo_icon from './icons/ctc_logo_icon.svg';
import ctc_love_icon from './icons/ctc_love_logo_icon.svg';
import dom_logo_icon from './icons/dom_logo_icon.svg';
import error_icon from './icons/error_icon.svg';
import error_invalid_streams_icon from './icons/error_invalid_streams_icon.svg';
import error_network_icon from './icons/error_network_icon.svg';
import error_restriction_icon from './icons/error_restriction_icon.svg';
import google_play_icon from './icons/google_play_icon.svg';
import more_logo_icon from './icons/more_logo_icon.svg';
import Styles from './index.module.css';

type TErrorConfigByType = {
  [key in ERROR_TYPE]: (
    theme: SkinClass,
    isEmbeded: boolean
  ) => {
    icon: string;
    text: (isMobile: boolean) => React.ReactNode;
    btn_text?: Nullable<() => React.ReactNode | null>;
    footer_icons?: () => {
      src: string;
      href: string;
    }[];
    onClick?: () => void;
  };
};

const HostMap = {
  [SkinClass.MORE_TV]: 'more.tv',
  [SkinClass.DEFAULT]: 'more.tv',
  [SkinClass.VIDEOMORE]: 'more.tv',
  [SkinClass.CHE]: 'chetv.ru',
  [SkinClass.CTC]: 'ctc.ru',
  [SkinClass.CTC_KIDS]: 'ctckids.ru',
  [SkinClass.CTC_LOVE]: 'ctclove.ru',
  [SkinClass.DOMASHNIY]: 'domashniy.ru',
};

const TextMap = (theme: SkinClass) => {
  switch (theme) {
    case SkinClass.CTC:
    case SkinClass.DOMASHNIY:
    case SkinClass.MORE_TV: {
      return 'или в мобильном приложении';
    }
    default: {
      return '';
    }
  }
};

const EmailMap = {
  [SkinClass.MORE_TV]: 'support@more.tv',
  [SkinClass.DEFAULT]: 'support@more.tv',
  [SkinClass.VIDEOMORE]: 'support@more.tv',
  [SkinClass.CHE]: 'info@chetv.ru',
  [SkinClass.CTC]: 'web@ctc.ru',
  [SkinClass.CTC_KIDS]: 'info@ctckids.ru',
  [SkinClass.CTC_LOVE]: 'info@ctclove.ru',
  [SkinClass.DOMASHNIY]: 'info@domashniy.ru',
};

const IconLogoMap = {
  [SkinClass.MORE_TV]: more_logo_icon,
  [SkinClass.DEFAULT]: more_logo_icon,
  [SkinClass.VIDEOMORE]: more_logo_icon,
  [SkinClass.CHE]: che_logo_icon,
  [SkinClass.CTC]: ctc_logo_icon,
  [SkinClass.CTC_KIDS]: ctc_kids_icon,
  [SkinClass.CTC_LOVE]: ctc_love_icon,
  [SkinClass.DOMASHNIY]: dom_logo_icon,
};

const StoreIconMap: Record<string, any> = {
  IOS_WHITE: {
    [SkinClass.MORE_TV]: {
      src: app_store_white_icon,
      href: 'https://apps.apple.com/ru/app/more-tv-сериалы-фильмы-ufc/id609430840?l=en',
    },
    [SkinClass.CTC]: {
      src: app_store_white_icon,
      href: 'https://apps.apple.com/ru/app/стс-телеканал-сериалы-онлайн/id784379020',
    },
    [SkinClass.DOMASHNIY]: {
      src: app_store_white_icon,
      href: 'https://apps.apple.com/ru/app/телеканал-домашний/id978081322',
    },
  },
  IOS_BLACK: {
    [SkinClass.MORE_TV]: {
      src: app_store_black_icon,
      href: 'https://apps.apple.com/ru/app/more-tv-сериалы-фильмы-ufc/id609430840?l=en',
    },
    [SkinClass.CTC]: {
      src: app_store_black_icon,
      href: 'https://apps.apple.com/ru/app/стс-телеканал-сериалы-онлайн/id784379020',
    },
    [SkinClass.DOMASHNIY]: {
      src: app_store_black_icon,
      href: 'https://apps.apple.com/ru/app/телеканал-домашний/id978081322',
    },
  },
  ANDROID: {
    [SkinClass.MORE_TV]: {
      src: google_play_icon,
      href: 'https://play.google.com/store/apps/details?hl=ru&id=com.ctcmediagroup.videomore',
    },
    [SkinClass.CTC]: {
      src: google_play_icon,
      href: 'https://play.google.com/store/apps/details?id=com.ctcmediagroup.ctc&hl=ru',
    },
    [SkinClass.DOMASHNIY]: {
      src: google_play_icon,
      href: 'https://play.google.com/store/apps/details?id=com.maximumsoft.domashniy&hl=ru',
    },
  },
};

const createMailLink = (subject: string, code: number, theme: SkinClass) => {
  const mailOptions = collectMailOptions({
    subject,
    code,
  });

  const TEXT = {
    EMAIL: EmailMap[theme],
    MAIL_OPTIONS: `mailto:${EmailMap[theme]}${mailOptions ? `?${mailOptions}` : ''}`,
  };

  return (
    <a className={Styles.mail_link} href={TEXT.MAIL_OPTIONS}>
      {TEXT.EMAIL}
    </a>
  );
};

export const collectMailOptions = ({ subject, code }: { subject: string; code: number }) => {
  //   const partnerId = get(store.getState(), ['config', 'video_data', 'partnerId'], '');
  //   const userId = get(store.getState(), ['config', 'video_data', 'userId'], '');
  //   const videoId = get(store.getState(), ['config', 'video_data', 'videoId'], '');
  //   const trackTitle = get(store.getState(), ['config', 'video_data', 'trackTitle'], '');
  //   const params = {
  //     code,
  //     partnerId,
  //     userId: userId || sid,
  //     ssid: store.getState()?.config?.video_data?.sessionId,
  //     videoId,
  //     'User-Agent': navigator ? navigator.userAgent : '',
  //     Resolution: window ? `${window.screen.availWidth}x${window.screen.availHeight}` : '',
  //     webVersion: store.getState()?.config?.video_data?.webVersion ?? '',
  //   };
  //   const body = Object.keys(params)
  //     .reduce((acc, key) => acc.concat(`${key}: ${params[key]}`), [])
  //     .join('%0A');
  //   return `subject=${encodeURIComponent(
  //     `${subject}. Код: ${code}. ${trackTitle}`
  //   )}&body=Оставьте дополнительную информацию, если необходимо.%0A%0A%0A%0A%0AТехническая информация для поддержки:%0A${body}`;

  return null;
};

const br = (isM: boolean) =>
  ({
    true: <br />,
    false: ' ',
  }[`${isM}`]);

export const ERROR_TEXT_BY_TYPE: TErrorConfigByType = {
  [ERROR_TYPE.CUSTOM]: (theme) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink('Внутренняя ошибка', ERROR_CODES[ERROR_TYPE.CUSTOM], theme)}
      </>
    ),
    btn_text: () => <>Попробовать снова</>,
  }),
  [ERROR_TYPE.PARTNER_ERROR]: (theme, isEmbeded) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        К сожалению, данное видео недоступно{br(isM)}для{br(!isM)}просмотра на этом ресурсе
      </>
    ),
    btn_text: () => (isEmbeded ? `Смотреть на ${HostMap[theme]}` : null),
    onClick: () => {
      //   window.open(store.getState()?.config?.video_data?.sharingUrl ?? `https://${HostMap[theme]}`, '_blank');
    },
  }),
  [ERROR_TYPE.GEOBLOCK_ERROR]: () => ({
    icon: error_restriction_icon,
    text: () => (
      <>
        Это видео нельзя посмотреть в твоей стране. <br />А еще не забудь отключить VPN!
      </>
    ),
  }),
  [ERROR_TYPE.EMBED_ERROR]: (theme, isEmbeded) => ({
    icon: IconLogoMap[theme],
    text: () => (
      <>
        Это видео можно смотреть
        <br />
        только на сайте {HostMap[theme]}
      </>
    ),
    btn_text: () => (isEmbeded ? 'Перейти и смотреть' : null),
    onClick: () => {
      //   window.open(store.getState()?.config?.video_data?.sharingUrl ?? `https://${HostMap[theme]}`, '_blank');
    },
  }),
  [ERROR_TYPE.NOT_ALLOWED_ERROR]: (theme) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink('Ошибка загрузки видео', ERROR_CODES[ERROR_TYPE.NOT_ALLOWED_ERROR], theme)}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.TECHNICAL_ERROR]: (theme) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink('Ошибка загрузки видео', ERROR_CODES[ERROR_TYPE.TECHNICAL_ERROR], theme)}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.PROXY_ERROR]: (theme) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink('Ошибка загрузки видео', ERROR_CODES[ERROR_TYPE.PROXY_ERROR], theme)}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.TRACK_MISSING]: (theme) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink('Ошибка загрузки видео', ERROR_CODES[ERROR_TYPE.TRACK_MISSING], theme)}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.ANONYMOUS_ERROR]: () => ({
    icon: error_icon,
    text: () => (
      <>
        Данное видео недоступно
        <br />
        для анонимных ip адресов
      </>
    ),
  }),
  [ERROR_TYPE.NETWORK]: () => ({
    icon: error_network_icon,
    text: () => 'Отсутствует подключение к интернету',
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.DATA_LOADING]: (theme) => ({
    icon: error_network_icon,
    text: (isM) => (
      <>
        Проблемы с соединением: попробуй{br(isM)}очистить кэш{br(!isM)}браузера и обновить{br(isM)}страницу. Если это не
        помогает{br(!isM)}свяжись{br(isM)}с нами:
        {createMailLink('Ошибка сети', ERROR_CODES[ERROR_TYPE.DATA_LOADING], theme)}
      </>
    ),
    btn_text: () => 'Перезагрузить страницу',
  }),
  [ERROR_TYPE.SRC_NOT_SUPPORTED]: (theme) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Твой браузер не поддерживается.
        <br />
        Попробуй запустить видео в другом{br(isM)}браузере{br(!isM)}
        {TextMap(theme)}
      </>
    ),
    btn_text: null,
    footer_icons: () =>
      isIOS
        ? [StoreIconMap.IOS_WHITE[theme]]
        : isAndroid
        ? [StoreIconMap.ANDROID[theme]]
        : [StoreIconMap.IOS_BLACK[theme], StoreIconMap.ANDROID[theme]],
  }),
  [ERROR_TYPE.INVALID_STREAMS]: () => ({
    icon: error_invalid_streams_icon,
    text: (isM) => (
      <>
        Что-то пошло не так: мы уже работаем
        <br />
        над устранением ошибки. Повтори{br(isM)}запрос{br(!isM)}или попробуй позже
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.BALANCER_REQUEST_FAILED]: () => ({
    icon: error_invalid_streams_icon,
    text: (isM) => (
      <>
        Что-то пошло не так: мы уже работаем
        <br />
        над устранением ошибки. Повтори{br(isM)}запрос{br(!isM)}или попробуй позже
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.CDN_INVALID_DATA]: () => ({
    icon: error_invalid_streams_icon,
    text: (isM) => (
      <>
        Что-то пошло не так: мы уже работаем
        <br />
        над устранением ошибки. Повтори{br(isM)}запрос{br(!isM)}или попробуй позже
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.BALANCER_NO_DATA]: () => ({
    icon: error_invalid_streams_icon,
    text: (isM) => (
      <>
        Что-то пошло не так: мы уже работаем
        <br />
        над устранением ошибки. Повтори{br(isM)}запрос{br(!isM)}или попробуй позже
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.BALANCER_UNAVAILABLE]: () => ({
    icon: error_invalid_streams_icon,
    text: (isM) => (
      <>
        Что-то пошло не так: мы уже работаем
        <br />
        над устранением ошибки. Повтори{br(isM)}запрос{br(!isM)}или попробуй позже
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.NO_RIGHTS]: (theme, isEmbeded) => ({
    icon: error_icon,
    text: () => (
      <>
        Нет прав на воспроизведение
        <br />
        зашифрованного видео
      </>
    ),
    btn_text: () => (isEmbeded ? `Смотреть на ${HostMap[theme]}` : null),
  }),
  [ERROR_TYPE.FETCH_LICENSE_ERROR]: (theme) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink('Ошибка загрузки видео', ERROR_CODES[ERROR_TYPE.FETCH_LICENSE_ERROR], theme)}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.HYDRA_UNAVAILABLE]: (theme) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink('Ошибка загрузки видео', ERROR_CODES[ERROR_TYPE.NOT_AVAILABLE], theme)}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.NOT_AVAILABLE]: (theme) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink('Ошибка загрузки видео', ERROR_CODES[ERROR_TYPE.NOT_AVAILABLE], theme)}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.CDN_UNAVAILABLE]: (theme) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink('Ошибка расшифровки', ERROR_CODES[ERROR_TYPE.DECODE], theme)}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.CDN_REQUEST_FAILED]: (theme) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink('Ошибка расшифровки', ERROR_CODES[ERROR_TYPE.DECODE], theme)}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.DECODE]: (theme) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink('Ошибка расшифровки', ERROR_CODES[ERROR_TYPE.DECODE], theme)}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.ENCRYPTED]: (theme) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink('Ошибка расшифровки', ERROR_CODES[ERROR_TYPE.ENCRYPTED], theme)}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.ABORTED]: (theme) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink('Ошибка расшифровки', ERROR_CODES[ERROR_TYPE.ABORTED], theme)}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.UNKNOWN]: () => ({
    icon: error_icon,
    text: () => (
      <>
        Что-то пошло не так.
        <br />
        Повтори запрос или попробуй позже
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
};
