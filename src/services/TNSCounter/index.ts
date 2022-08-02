import { DeviceInfo, DeviceType } from 'store/slices/root/types';
import { HeartBeatTnsParams, Nullable, THeartBeatTnsCounterConfig, TnsCounter } from 'types';
import { logger } from 'utils/logger';
import { randomUnit32 } from 'utils/randomHash';

import { HeartBeatTnsEvent, TNSEvent, TNSEvents } from './types';

const PARAM = '[RANDOM]';

const DEFAULT_EVENTS: TNSEvents = {
  sub_click: `https://ads.adfox.ru/264443/getCode?p1=bzqje&p2=frfe&pfc=bsuii&pfb=fszym&pr=${PARAM}&ptrc=b`,
  load_ad_start: `https://www.tns-counter.ru/V13a****everest_ru/ru/UTF-8/tmsec=everest_network/${PARAM}`,
};

const TNSCounter = () => {
  let events: TNSEvents = {};
  let heartbeatConfig: THeartBeatTnsCounterConfig | undefined;
  let deviceType = 7;
  let paramsString = '';

  const init = (
    heartbeatCfg: THeartBeatTnsCounterConfig | undefined,
    data: TnsCounter | undefined,
    deviceInfo: DeviceInfo
  ) => {
    heartbeatConfig = heartbeatCfg;
    deviceType = getDeviceType(deviceInfo.deviceType);
    paramsString = getTnsHeartBeatParamString(heartbeatCfg?.params || []);
    events = data
      ? {
          ...DEFAULT_EVENTS,
          ...data,
        }
      : DEFAULT_EVENTS;
  };

  const getDeviceType = (deviceType: DeviceType | undefined) => {
    const TypeMap: Record<string, number> = {
      [DeviceType.MOBILE_UNKNOWN]: 0,
      [DeviceType.WEB_DESKTOP]: 1,
      [DeviceType.IOS]: 2,
      [DeviceType.ANDROID]: 3,
      [DeviceType.WIN_PHONE]: 4,
    };
    return TypeMap[`${deviceType}`] ?? 7;
  };

  const getTnsHeartBeatParamString = (params: HeartBeatTnsParams) => {
    const disabledParams = ['AndroidDeviceID', 'AdvertisingID', 'IDFA', 'DeviceID', 'MacAddress', 'ApplicationID'];
    const filteredParams = params.filter((param) => !disabledParams.includes(`${param.value}`));

    const data = filteredParams.reduce((acc: string[], param) => [...acc, `${param.key}:${param.value}`], []);
    return data.join(':');
  };

  const sendTnsHeartBeatStat = (param: HeartBeatTnsEvent, currentTime: number) => {
    if (!heartbeatConfig) return;

    logger.log('[TNSCounter]', 'sendTnsHeartBeatStat', { param });

    const frameTimeStamp = Math.max(0, Math.floor(currentTime));
    const visionTimeStamp = Math.floor(Date.now() / 1000);

    const tempString = paramsString
      .replace(/FTS/, `${frameTimeStamp}`)
      .replace(/VTS/, `${visionTimeStamp}`)
      .replace(/DeviceType/, `${deviceType}`);

    const url = heartbeatConfig.link.replace(/\${3}params\${3}/g, `${tempString}`);
    send(url);
  };

  const send = (url: string) => {
    let image: Nullable<HTMLImageElement> = new Image();
    image.src = url;
    image = null;
  };

  const sendEvent = (event: TNSEvent) => {
    const url = events[event];
    if (url) {
      send(url.replace(PARAM, `${randomUnit32()}`));
    }
  };

  return { init, sendEvent, sendTnsHeartBeatStat };
};

const instance = TNSCounter();
export { instance as TNSCounter };
