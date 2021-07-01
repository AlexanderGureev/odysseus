import { Nullable } from 'types';
import { INPUT_PLAYER_POST_MESSAGE, OUTPUT_PLAYER_POST_MESSAGE, PostMessageService } from '../PostMessageService';

const getHighLevelDomain = (url: string) => url.split('.').slice(-2).join('.');

type TState = {
  location: Nullable<string>;
  isEmbedded: boolean;
};

const EmbeddedCheckService = () => {
  const TIMEOUT = 200;
  const state: TState = { location: null, isEmbedded: true };

  PostMessageService.on(INPUT_PLAYER_POST_MESSAGE.SET_PAGE_LOCATION, ({ location }) => {
    if (location) state.location = location;
  });

  const getEmbededStatus = async (sharingUrl?: string) => {
    if (!sharingUrl) return true;

    const outerHost = await getIframeLocation();
    if (!outerHost) return true;

    const iframeHostname = new URL(outerHost).hostname;
    const sharingUrlHostname = new URL(sharingUrl).hostname;
    const hostname = new URL(location.href).hostname;

    // перезагрузка фрейма обновляет referrer
    if (hostname === iframeHostname) return true;

    return getHighLevelDomain(iframeHostname) !== getHighLevelDomain(sharingUrlHostname);
  };

  const getIframeLocation = (): Promise<string> =>
    new Promise((resolve) => {
      const callback = ({ location }: { location?: string }) => {
        if (location) resolve(location);
      };

      PostMessageService.one(INPUT_PLAYER_POST_MESSAGE.SET_PAGE_LOCATION, callback);
      PostMessageService.emit(OUTPUT_PLAYER_POST_MESSAGE.GET_PAGE_LOCATION);

      setTimeout(() => {
        resolve(document.referrer);
      }, TIMEOUT);
    });

  const getState = () => ({ ...state });

  return { getState, getIframeLocation, getEmbededStatus };
};

const instance = EmbeddedCheckService();
export { instance as EmbeddedCheckService };
