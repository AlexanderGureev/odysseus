import { PLAYER_ID } from 'components/Player/types';
import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';

import { VideoMeta } from '../types';

const getVideoResolution = (id: string) => {
  const video = document.getElementById(id) as HTMLVideoElement;
  return video ? `${video.videoWidth}x${video.videoHeight}` : null;
};

export const getVideoMeta = ({ getState, dispatch, services: { playerService } }: EffectOpts) => {
  const meta: VideoMeta = {
    video_resolution: null,
    video_format: null,
    dropped_frames: null,
    shown_frames: null,
    frame_rate: null,
    video_codec: null,
    audio_codec: null,
    bitrate: null,
  };

  let width = null;
  let height = null;

  const { videoMeta } = getState().quality;
  const vhs = playerService.getTech();
  const player = playerService.getPlayer();

  if (vhs) {
    const attributes = vhs.playlists?.media?.()?.attributes;
    if (attributes) {
      const rate = attributes['FRAME-RATE'];
      if (rate) meta.frame_rate = rate.split('.')[0];

      meta.bitrate = attributes['BANDWIDTH'] ?? null;
      width = attributes?.RESOLUTION?.width ?? null;
      height = attributes?.RESOLUTION?.height ?? null;
    }

    if (attributes?.CODECS) {
      const [video_codec = null, audio_codec = null] = attributes.CODECS.split(',');
      meta.video_codec = video_codec;
      meta.audio_codec = audio_codec;
    }
  }

  meta.video_resolution = width && height ? `${width}x${height}` : getVideoResolution(PLAYER_ID);
  const { video_resolution, frame_rate } = meta;

  meta.video_format =
    video_resolution && frame_rate
      ? `${video_resolution}@${frame_rate}`
      : video_resolution
      ? `${video_resolution}`
      : null;

  const { droppedVideoFrames = null, totalVideoFrames = null } = player.getVideoPlaybackQuality() || {};

  meta.dropped_frames = droppedVideoFrames;
  meta.shown_frames = totalVideoFrames;

  dispatch(
    sendEvent({
      type: 'GET_VIDEO_META_RESOLVE',
      payload: {
        previousBitrate: videoMeta.bitrate,
        videoMeta: meta,
      },
    })
  );
};
