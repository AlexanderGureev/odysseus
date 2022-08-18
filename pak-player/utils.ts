import { request } from 'utils/request';
import { VideoJsPlayer } from 'video.js';

import { TPAKPostmessagePayloadTypes } from './types';

const timeMeasurementPrecision = 1 / 30;

export const PLAYER_SEEK_STEP_LEGACY = 5; //seconds

export const PAK_POSTMESSAGES: Record<keyof TPAKPostmessagePayloadTypes, string> = {
  doScreenshot: 'doScreenshot',
  screenshotDone: 'screenshotDone',
  testAdvPoint: 'testAdvPoint',
  adTestShown: 'adTestShown',
  play: 'play',
  getCurrentTime: 'getCurrentTime',
  currentTime: 'currentTime',
  started: 'started',
};

export type TPAKPostmessagePayload<K extends keyof TPAKPostmessagePayloadTypes> = TPAKPostmessagePayloadTypes[K];

export const moduleState = {
  screenshotPending: false,
  advTestPending: false,
  bufferingDone: false,
  advPoint: 0,
};

export const communicateToParent = <K extends keyof TPAKPostmessagePayloadTypes>(
  method: K,
  payload?: TPAKPostmessagePayload<K>
): boolean => {
  try {
    parent.postMessage(
      {
        method,
        ...(payload || {}),
      },
      '*'
    );
  } catch (e) {
    console.error(e);
    return false;
  }

  return true;
};

const createScreenshotCanvas = (canvasId: string, width = 1280, height = 720) => {
  if (document.getElementById(canvasId)) return document.getElementById(canvasId) as HTMLCanvasElement;
  const canvas = document.createElement('canvas');
  canvas.id = canvasId;
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  document.body.appendChild(canvas);
  return canvas;
};

export const doScreenshot = (videoId: string, canvasId: string): Promise<string> => {
  const video = document.getElementById(videoId) as HTMLVideoElement;

  return new Promise((resolve, reject) => {
    const canvas = createScreenshotCanvas(canvasId, video?.videoWidth, video?.videoHeight);
    if (!canvas || !video) {
      reject(new Error(`Missing DOM Elements for screenshot: video#${videoId} or canvas#${videoId}`));
      return;
    }

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('canvas ctx is undefined');
      }

      ctx.drawImage(video, 0, 0);
      const imgData = canvas.toDataURL('image/jpeg', 0.75);
      canvas.remove();
      resolve(imgData);
    } catch (e) {
      reject(e);
    }
  });
};

export const postScreenshot = async (endpoint: string, image: string) => {
  const response = await request.post('/private/pak/uploadScreenshot', {
    headers: {
      'Content-Type': 'application/json',
    },
    json: {
      endpoint,
      image,
    },
  });

  if (!response.ok) throw new Error(`request failed: ${response.status}, ${response.statusText}`);

  const data = await response.json();
  return data;
};

export const screenshotMessageObserver =
  (videoId: string, canvasId: string) => async (payload: TPAKPostmessagePayload<'doScreenshot'>) => {
    if (!parent || moduleState.screenshotPending || !payload || !payload.url) return false;

    moduleState.screenshotPending = true;
    doScreenshot(videoId, canvasId)
      .then((imageData) => postScreenshot(payload.url, imageData))
      .then((response) => {
        if (response?.result !== 'ok') {
          throw new Error(`Screenshot upload to ${payload.url} failed: ${JSON.stringify(response)}`);
        } else {
          communicateToParent('screenshotDone', {
            success: true,
            result: response,
          });
        }
      })
      .catch((e) => {
        console.error(e);
        communicateToParent('screenshotDone', {
          success: false,
          error: e,
        });
      })
      .finally(() => {
        console.log('Screenshot processed');
        moduleState.screenshotPending = false;
      });
  };

export const advPointTestHandler = (video: VideoJsPlayer, payload: TPAKPostmessagePayload<'testAdvPoint'>) => {
  if (
    moduleState.advTestPending ||
    video.seeking() ||
    !Number.isFinite(payload?.playTime) ||
    payload?.playTime <= 0 ||
    !Number.isFinite(payload?.time) ||
    payload?.time <= payload?.playTime ||
    payload.time >= video.duration()
  ) {
    console.error(
      `Can't seek to ${payload?.time}. Currently ${
        video.seeking()
          ? 'seeking'
          : moduleState.advTestPending
          ? `testing advPoint at ${moduleState.advPoint}`
          : 'idle'
      }`
    );
    return false;
  }

  try {
    console.log(`Started Adv Point Test at ${payload.time} starting with ${payload.playTime} seconds ahead`);
    moduleState.advTestPending = true;
    moduleState.advPoint = payload.time;
    video.currentTime(Math.max(0, payload.time - payload.playTime));
    if (video.paused()) video.play();
  } catch (e) {
    console.error(e);
    moduleState.advPoint = 0;
    moduleState.advTestPending = false;
  }
};

export const advPointObserver = (video: VideoJsPlayer): void => {
  try {
    const curTime = video.currentTime();

    if (moduleState.advPoint && curTime - moduleState.advPoint > -timeMeasurementPrecision) {
      moduleState.advTestPending = false;
      video.pause();
      console.log(`Reached test Adv Point at ${curTime}`);
      communicateToParent('adTestShown');
      moduleState.advPoint = 0;
    }
  } catch (e) {
    console.error(e);
    moduleState.advPoint = 0;
    moduleState.advTestPending = false;
  }
};
