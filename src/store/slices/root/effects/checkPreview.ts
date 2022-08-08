import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store';
import { getPlaylistItem } from 'store/selectors';
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
  const { features } = getState().root;
  const item = getPlaylistItem(getState());

  const handlers: {
    [key in string]?: () => { previews: TStreamItem[] | undefined; duration: number };
  } = {
    HUB: () => {
      const { from, to } = item.preview_duration || { from: 0, to: 0 };
      const previewDuration = to > from ? Math.floor((to - from) / 1000) : item.duration;
      const duration = features.PREVIEW_TIMELINE === 'TRACK' ? item.duration : previewDuration;

      return {
        previews: item.preview_streams,
        duration,
      };
    },
    PAK: () => {
      const { previews_hls, previews_mp4 } = item;
      const streams: TStreamItem[] = [];
      if (previews_hls) streams.push(...createStream(previews_hls, StreamProtocol.HLS));
      if (previews_mp4) streams.push(...createStream(previews_mp4, StreamProtocol.MP4));

      return {
        previews: streams,
        duration: item.duration,
      };
    },
  };

  const data = handlers[`${features?.SUBSCRIPTION_PREVIEW}`]?.();

  if (!data?.previews?.length) {
    dispatch(sendEvent({ type: 'CHECK_PREVIEW_REJECT' }));
    return;
  }

  dispatch(
    sendEvent({ type: 'CHECK_PREVIEW_RESOLVE', payload: { previews: data.previews, previewDuration: data.duration } })
  );
};
