import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store';
import { StreamProtocol, TStreamItem } from 'types';

const createStream = (urls: string[], protocol: StreamProtocol): TStreamItem[] =>
  urls.map((url) => ({
    drm_type: null,
    ls_url: null,
    manifest_expires_at: null,
    protocol,
    url,
  }));

export const checkPreview = async ({ dispatch, getState }: EffectOpts) => {
  const { config, features } = getState().root;

  const handlers: Record<string, () => TStreamItem[] | undefined> = {
    HUB: () => config?.playlist?.items?.[0]?.preview_streams,
    PAK: () => {
      const { previews_hls, previews_mp4 } = config?.playlist?.items?.[0] || {};

      const streams: TStreamItem[] = [];
      if (previews_hls) streams.push(...createStream(previews_hls, StreamProtocol.HLS));
      if (previews_mp4) streams.push(...createStream(previews_mp4, StreamProtocol.MP4));

      return streams;
    },
  };

  const previews = handlers[`${features?.SUBSCRIPTION_PREVIEW}`]?.();

  if (!previews?.length) {
    dispatch(sendEvent({ type: 'CHECK_PREVIEW_REJECT' }));
    return;
  }

  dispatch(sendEvent({ type: 'CHECK_PREVIEW_RESOLVE', payload: { previews } }));
};
