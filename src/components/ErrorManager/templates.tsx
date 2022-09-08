import che_logo_icon from 'assets/logo/che_logo_icon.svg';
import ctc_kids_icon from 'assets/logo/ctc_kids_logo_icon.svg';
import ctc_logo_icon from 'assets/logo/ctc_logo_icon.svg';
import ctc_love_icon from 'assets/logo/ctc_love_logo_icon.svg';
import dom_logo_icon from 'assets/logo/dom_logo_icon.svg';
import more_logo_icon from 'assets/logo/more_logo_icon.svg';
import error_icon from 'assets/sprite/error_icon.svg';
import error_invalid_streams_icon from 'assets/sprite/error_invalid_streams_icon.svg';
import error_network_icon from 'assets/sprite/error_network_icon.svg';
import error_restriction_icon from 'assets/sprite/error_restriction_icon.svg';
import React from 'react';
import { isAndroid, isIOS } from 'react-device-detect';
import { sendEvent } from 'store';
import { SkinClass } from 'types';
import { ERROR_CODES, ERROR_TYPE } from 'types/errors';

import app_store_black_icon from './icons/app_store_black_icon.svg';
import app_store_white_icon from './icons/app_store_white_icon.svg';
import google_play_icon from './icons/google_play_icon.svg';
import Styles from './index.module.css';
import { ErrorConfigByType, MailData, MailOpts } from './types';

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

export const IconLogoMap = {
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

const createMailLink = (data: { subject: string; code: number; theme: SkinClass; mailOpts: MailOpts }) => {
  const mailOptions = collectMailOptions(
    {
      subject: data.subject,
      code: data.code,
    },
    data.mailOpts
  );

  const TEXT = {
    EMAIL: EmailMap[data.theme],
    MAIL_OPTIONS: `mailto:${EmailMap[data.theme]}${mailOptions ? `?${mailOptions}` : ''}`,
  };

  return (
    <a className={Styles.mail_link} href={TEXT.MAIL_OPTIONS}>
      {TEXT.EMAIL}
    </a>
  );
};

export const collectMailOptions = ({ subject, code }: MailData, opts: MailOpts) => {
  const params: Record<string, any> = {
    code,
    partnerId: opts.partnerId,
    userId: opts.userId || opts.sid,
    ssid: opts.ssid,
    videoId: opts.trackId,
    'User-Agent': navigator ? navigator.userAgent : '',
    Resolution: window ? `${window.screen.availWidth}x${window.screen.availHeight}` : '',
    webVersion: opts.webVersion ?? '',
  };

  const title = [opts.projectName, opts.seasonName, opts.episodeName].filter(Boolean).join('/');

  const body = Object.keys(params)
    .reduce((acc: string[], key) => acc.concat(`${key}: ${params[key]}`), [])
    .join('%0A');
  return `subject=${encodeURIComponent(
    `${subject}. Код: ${code}. ${title}`
  )}&body=Оставьте дополнительную информацию, если необходимо.%0A%0A%0A%0A%0AТехническая информация для поддержки:%0A${body}`;
};

const br = (isM: boolean) =>
  ({
    true: <br />,
    false: ' ',
  }[`${isM}`]);

export const ERROR_TEXT_BY_TYPE: ErrorConfigByType = {
  [ERROR_TYPE.CUSTOM]: ({ theme, mailOpts }) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink({
          subject: 'Внутренняя ошибка',
          code: ERROR_CODES.ERROR_CUSTOM,
          theme,
          mailOpts,
        })}
      </>
    ),
    btn_text: () => <>Попробовать снова</>,
  }),
  [ERROR_TYPE.PARTNER_ERROR]: ({ theme, isEmbedded, sharingUrl }) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        К сожалению, данное видео недоступно{br(isM)}для{br(!isM)}просмотра на этом ресурсе
      </>
    ),
    btn_text: () => (isEmbedded ? `Смотреть на ${HostMap[theme]}` : null),
    onClick: (dispatch) => {
      dispatch(
        sendEvent({ type: 'OPEN_URL', meta: { url: sharingUrl ?? `https://${HostMap[theme]}`, target: '_blank' } })
      );
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
  [ERROR_TYPE.EMBED_ERROR]: ({ theme, isEmbedded, sharingUrl }) => ({
    icon: IconLogoMap[theme],
    text: () => (
      <>
        Это видео можно смотреть
        <br />
        только на сайте {HostMap[theme]}
      </>
    ),
    btn_text: () => (isEmbedded ? 'Перейти и смотреть' : null),
    onClick: (dispatch) => {
      dispatch(
        sendEvent({ type: 'OPEN_URL', meta: { url: sharingUrl ?? `https://${HostMap[theme]}`, target: '_blank' } })
      );
    },
  }),
  [ERROR_TYPE.NOT_ALLOWED_ERROR]: ({ theme, mailOpts }) => ({
    icon: error_icon,
    text: (isM) => {
      return (
        <>
          Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
          <br />
          {createMailLink({
            subject: 'Ошибка загрузки видео',
            code: ERROR_CODES.NOT_ALLOWED_ERROR,
            theme,
            mailOpts,
          })}
        </>
      );
    },
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.TECHNICAL_ERROR]: ({ theme, mailOpts }) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink({
          subject: 'Ошибка загрузки видео',
          code: ERROR_CODES.TECHNICAL_ERROR,
          theme,
          mailOpts,
        })}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.PROXY_ERROR]: ({ theme, mailOpts }) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink({
          subject: 'Ошибка загрузки видео',
          code: ERROR_CODES.PROXY_ERROR,
          theme,
          mailOpts,
        })}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.TRACK_MISSING]: ({ theme, mailOpts }) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink({
          subject: 'Ошибка загрузки видео',
          code: ERROR_CODES.TRACK_MISSING,
          theme,
          mailOpts,
        })}
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
  [ERROR_TYPE.DATA_LOADING]: ({ theme, mailOpts }) => ({
    icon: error_network_icon,
    text: (isM) => (
      <>
        Проблемы с соединением: попробуй{br(isM)}очистить кэш{br(!isM)}браузера и обновить{br(isM)}страницу. Если это не
        помогает{br(!isM)}свяжись{br(isM)}с нами:
        {createMailLink({
          subject: 'Ошибка сети',
          code: ERROR_CODES.ERROR_DATA_LOADING,
          theme,
          mailOpts,
        })}
      </>
    ),
    btn_text: () => 'Перезагрузить страницу',
  }),
  [ERROR_TYPE.SRC_NOT_SUPPORTED]: ({ theme }) => ({
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
  [ERROR_TYPE.NO_RIGHTS]: ({ theme, isEmbedded }) => ({
    icon: error_icon,
    text: () => (
      <>
        Нет прав на воспроизведение
        <br />
        зашифрованного видео
      </>
    ),
    btn_text: () => (isEmbedded ? `Смотреть на ${HostMap[theme]}` : null),
  }),
  [ERROR_TYPE.FETCH_LICENSE_ERROR]: ({ theme, mailOpts }) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink({
          subject: 'Ошибка загрузки видео',
          code: ERROR_CODES.FETCH_LICENSE_ERROR,
          theme,
          mailOpts,
        })}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.HYDRA_UNAVAILABLE]: ({ theme, mailOpts }) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink({
          subject: 'Ошибка загрузки видео',
          code: ERROR_CODES.ERROR_NOT_AVAILABLE,
          theme,
          mailOpts,
        })}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.NOT_AVAILABLE]: ({ theme, mailOpts }) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink({
          subject: 'Ошибка загрузки видео',
          code: ERROR_CODES.ERROR_NOT_AVAILABLE,
          theme,
          mailOpts,
        })}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.CDN_UNAVAILABLE]: ({ theme, mailOpts }) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink({
          subject: 'Ошибка расшифровки',
          code: ERROR_CODES.ERROR_DECODE,
          theme,
          mailOpts,
        })}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.CDN_REQUEST_FAILED]: ({ theme, mailOpts }) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink({
          subject: 'Ошибка расшифровки',
          code: ERROR_CODES.ERROR_DECODE,
          theme,
          mailOpts,
        })}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.DECODE]: ({ theme, mailOpts }) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink({
          subject: 'Ошибка расшифровки',
          code: ERROR_CODES.ERROR_DECODE,
          theme,
          mailOpts,
        })}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.ENCRYPTED]: ({ theme, mailOpts }) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink({
          subject: 'Ошибка расшифровки',
          code: ERROR_CODES.ERROR_ENCRYPTED,
          theme,
          mailOpts,
        })}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.ABORTED]: ({ theme, mailOpts }) => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Невозможно загрузить видео:{br(isM)}рекомендуем{br(!isM)}попробовать позже{br(isM)}или связаться с нами:
        <br />
        {createMailLink({
          subject: 'Ошибка расшифровки',
          code: ERROR_CODES.ERROR_ABORTED,
          theme,
          mailOpts,
        })}
      </>
    ),
    btn_text: () => 'Попробовать снова',
  }),
  [ERROR_TYPE.WAF_ERROR]: () => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Мы обнаружили проблему соединения:
        <br />
        попробуй подключиться к другой сети,{br(isM)}перезапусти
        {br(!isM)}
        приложение{br(isM)}или попробуй повторить позже
      </>
    ),
    btn_text: () => 'Повторить',
  }),
  [ERROR_TYPE.NETWORK_TIMEOUT_ERROR]: () => ({
    icon: error_icon,
    text: (isM) => (
      <>
        Мы обнаружили проблему соединения:
        <br />
        попробуй подключиться к другой сети,{br(isM)}перезапусти
        {br(!isM)}
        приложение{br(isM)}или попробуй повторить позже
      </>
    ),
    btn_text: () => 'Повторить',
  }),
  [ERROR_TYPE.STORMWALL_GEOBLOCK_ERROR]: ({ theme }) => ({
    icon: error_restriction_icon,
    text: (isM) => (
      <>
        Региональные ограничения: в твоей{br(isM)}стране нет
        {br(!isM)}
        доступа к {HostMap[theme]}. А еще не{br(isM)}забудь отключить VPN.
      </>
    ),
    btn_text: () => 'Повторить',
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
