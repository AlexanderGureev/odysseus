import { PostMessageService } from '../PostMessageService';
import { LocationState } from './types';

const EmbeddedCheckService = () => {
  const TIMEOUT = 200;
  const state: LocationState = { location: null, hostname: null, isEmbedded: true };

  PostMessageService.on('setPageLocation', ({ location }) => {
    if (location) state.location = location;
  });

  const getEmbededStatus = async (sharingUrl?: string) => {
    if (!sharingUrl) return true;

    const { hostname: outerHost } = await getIframeLocation();
    if (!outerHost) return true;

    const sharingUrlHostname = new URL(sharingUrl).hostname;
    return outerHost !== sharingUrlHostname;
  };

  const getIframeLocation = (): Promise<LocationState> =>
    new Promise((resolve) => {
      const callback = ({ location }: { location?: string }) => {
        if (location) {
          state.location = location;
          state.hostname = new URL(location).hostname;
        }
        resolve({ ...state });
      };

      PostMessageService.one('setPageLocation', callback);
      PostMessageService.emit('getPageLocation');

      setTimeout(() => {
        callback({ location: document.referrer });
      }, TIMEOUT);
    });

  const getState = () => ({ ...state });

  return { getState, getIframeLocation, getEmbededStatus };
};

const instance = EmbeddedCheckService();
export { instance as EmbeddedCheckService };
