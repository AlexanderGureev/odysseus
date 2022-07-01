/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-ignore
import 'youbora-adapter-videojs';

import { fakeVideoSrc } from 'components/Player/fakeVideo';
import { ManifestParser } from 'services/ManifestParser';
import { TMediatorHandlers } from 'services/MediatorService';
import { getPlaybackOptions } from 'services/YouboraService/selectors';
import { YEvent } from 'services/YouboraService/types';
import { filterOptions } from 'services/YouboraService/utils';
import { store } from 'store';
import { Nullable } from 'types';
import { ERROR_TYPE } from 'types/errors';
import { VideoJsPlayer } from 'video.js';
//@ts-ignore
import youbora from 'youboralib';

import { TVideoAdapter, VideoAdapterEvent } from './types';

const CustomAdapter = youbora.adapters.Videojs.extend({
  getFramesPerSecond: function () {
    return null;

    // return store.getState()?.player?.frame_rate || null;
  },
  getDroppedFrames: function () {
    return null;
    // return store.getState()?.player?.dropped_frames || null;
  },
  getThroughput: function () {
    return this._getTech()?.throughput?.toFixed(0) || null;
  },
  getPlayerVersion: function () {
    return window?.ENV?.APP_VERSION || 'unknown';
  },
  getPlayerName: function () {
    return 'odysseus';
  },
  getMetrics: function () {
    return;
    // return filterOptions(getPlaybackOptions(store.getState()), false); // TODO FIX
  },
  getURLToParse: function () {
    return null;
  },

  _getTech: function () {
    return this.player?.tech?.({ IWillNotUseThisInPlugins: true })?.vhs;
  },
  _log: function () {
    return {
      videoType: this._videoType,
      fakeVideo: this._fakeVideo,
      isStarted: this.flags.isStarted,
      isStopSession: this.isStopSession,
    };
  },

  registerListeners: function () {
    // Enable playhead monitor
    this.monitorPlayhead(true, false);
    this.acumBytes = 0;
    this.ignoreList = [];
    this.fatalList = [];
    this.nonFatalList = [];

    // Register listeners
    this.references = {
      loadstart: this.loadstartListener.bind(this),
      play: this.playListener.bind(this),
      timeupdate: this.timeupdateListenerCustom.bind(this),
      pause: this.pauseListener.bind(this),
      playing: this.playingListener.bind(this),
      ended: this.conditionalStop.bind(this),
      dispose: this.disposeListener.bind(this),
      seeking: this.seekingListener.bind(this),
      seeked: this.seekedListener.bind(this),
      texttrackchange: this.textListener.bind(this),
    };

    if (this.player) {
      for (const key in this.references) {
        this.player.on(key, this.references[key]);
      }
    }
  },
  timeupdateListenerCustom: function () {
    if (!this._fakeVideo) {
      this.timeupdateListener();
    }
  },
  getSource: function () {
    const tech = this.getUsedTech();
    return tech?.getResource ? tech.getResource(this) : this.player.currentSrc();
  },
  getResource: function () {
    return;

    // return this._fakeVideo
    //   ? store.getState().stream.currentStream?.url
    //   : ManifestParser.getManifest()?.responseUrl || this.getSource(); // TODO FIX
  },
  getDuration: function () {
    let ret = this.player.duration();
    if (this.player.mediainfo && typeof this.player.mediainfo.duration !== 'undefined') {
      ret = this.player.mediainfo.duration;
    }

    return this.getSource() === fakeVideoSrc ? 1 : ret;
  },
  fireStart: function (params: any) {
    if (this.videoType === 'video' && (this._fakeVideo || this.isStopSession)) return;

    if (this.plugin && this.plugin.backgroundDetector && this.plugin.backgroundDetector.canBlockStartCalls()) {
      return null;
    }

    if (!this.flags.isStarted) {
      this.flags.isStarted = true;
      this.chronos.total.start();
      this.chronos.join.start();
      this.emit('start', { params: params });
    }
  },
  fireStop: function (params: any) {
    this.isStopSession = true;

    if (this._fakeVideo) return;

    if (this._isAds() || (this.plugin && this.plugin._isStopReady())) {
      if (
        (this._isAds() && this.flags.isStarted) ||
        (!this._isAds() && (this.flags.isStarted || (this.plugin && this.plugin.isInitiated)))
      ) {
        if (this.monitor) this.monitor.stop();

        this.flags.reset();
        this.chronos.total.stop();
        this.chronos.join.reset();
        this.chronos.pause.stop();
        this.chronos.buffer.stop();
        this.chronos.seek.stop();

        this.emit('stop', { params: params });

        this.chronos.pause.reset();
        this.chronos.buffer.reset();
        this.chronos.seek.reset();
        this.chronos.viewedMax.splice(0, this.chronos.viewedMax.length);
      }
    }
  },
  playListener: function () {
    if (this._fakeVideo) return;

    this.isStopSession = false;
    this.setVideoType('video');

    if (!this.flags.isStarted) {
      this.lastSrc = this.getResource();
      this._startEvent();
    }
  },
  pauseListener: function () {
    if (!this._fakeVideo) this.firePause();
  },
  playingListener: function () {
    if (this._fakeVideo) return;

    this._startEvent();
    this.fireResume();
    if (this.getPlayhead() < 1) this.fireSeekEnd();
  },
  loadstartListener: function () {
    this._fakeVideo = this.getSource() === fakeVideoSrc;

    if (!this._fakeVideo) {
      this.setVideoType('video');
    }
  },
  setVideoType: function (type: 'video' | 'adv' = 'video') {
    this.videoType = type;
  },
});

const VideoAdapter = (): TVideoAdapter => {
  let adapter: any = null;
  let mediator: Nullable<TMediatorHandlers> = null;

  const init = (serviceMediator: any, player: VideoJsPlayer) => {
    adapter = new CustomAdapter(player);
    mediator = serviceMediator;

    registerListeners();
    return adapter;
  };

  const registerListeners = () => {
    if (!mediator) return;

    // mediator
    //   .on(
    //     VideoAdapterEvent.CUSTOM_EVENT,
    //     (event: YEvent, dimensions?: Record<string, any>, values?: Record<string, any>) => {
    //       adapter.fireEvent(event, dimensions, values);
    //     }
    //   )
    //   .on(VideoAdapterEvent.ERROR, (code: number, title: ERROR_TYPE, debugInfo: Record<string, any> = {}) => {
    //     adapter.fireFatalError(code, title, JSON.stringify(debugInfo), 'error');
    //   })
    //   .on(VideoAdapterEvent.STOP_SESSION, () => {
    //     adapter.fireStop();
    //   });
  };

  return {
    init,
  };
};

const instance = VideoAdapter();
export { instance as VideoAdapter };
