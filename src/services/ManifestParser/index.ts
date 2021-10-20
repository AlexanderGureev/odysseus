import * as MPDParser from 'mpd-parser';
import { Parser } from 'm3u8-parser';
import { hls, dash } from './mock';
import { PlayerService } from 'services/PlayerService';

const HLSParser = new Parser();

const ParserByProtocol = {
  DASH: {
    parse: (txt) => {
      return MPDParser.parse(txt);
    },
  },
  HLS: {
    parse: (txt) => {
      HLSParser.push(txt);
      HLSParser.end();

      return HLSParser.manifest;
    },
  },
};

const MockByType = {
  DASH: dash,
  HLS: hls,
};

const ManifestParser = () => {
  const fetchManifest = (source) =>
    new Promise((res, rej) => {
      if (!source) throw new Error('source is undefined');

      const xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = async () => {
        const url = URL.createObjectURL(xhr.response);
        const manifest = await xhr.response.text();

        res({
          url,
          responseUrl: xhr.responseURL,
          manifest: MockByType[source.protocol],
        });
      };

      xhr.onerror = rej;
      xhr.open('GET', source.url);
      xhr.send();
    });

  const parse = (source, text) => {
    if (!source) throw new Error('source is undefined');

    const parser = ParserByProtocol[source.protocol];
    if (!parser) throw new Error(`no parser found for protocol: ${source.protocol}`);

    return parser.parse(text);
  };

  return { parse, fetchManifest };
};

const RESOLUTIONS_LIST = [240, 360, 480, 720, 1080];

const StreamQualityManager = () => {
  let meta = null;

  const init = ({ protocol, playlist, manifestUrl }) => {
    meta = { protocol, playlist, manifestUrl };
  };

  const parse = (list) => {
    const comparator = (a, b) => a.height - b.height;

    return list.sort(comparator).reduce((acc, item) => {
      const idx = RESOLUTIONS_LIST.findIndex((r) => r >= item.height);
      return idx !== -1 ? { ...acc, [idx]: { ...item, qualityMark: RESOLUTIONS_LIST[idx] } } : acc;
    }, {});
  };

  const buildPlaylistUrl = (playlistObj, { protocol, manifestUrl }) => {
    const playlistUrlByProtocol = {
      HLS: playlistObj.uri,
      DASH: playlistObj.uri || playlistObj.attributes?.NAME ? `init-${playlistObj.attributes.NAME}.mp4` : null,
    };

    const playlistUrl = playlistUrlByProtocol[protocol];

    if (playlistUrl.includes('://')) return playlistUrl;

    const urlData = new URL(manifestUrl);
    const manifestNameByProtocol = {
      HLS: 'master.m3u8',
      DASH: 'manifest.mpd',
    };

    return urlData.origin + urlData.pathname.replace(manifestNameByProtocol[protocol], playlistUrl);
  };

  const buildQualityList = () => {
    console.log('[playlist]', meta);

    const list = meta.playlist.reduce((acc, playlistObj) => {
      const height = playlistObj.attributes?.RESOLUTION?.height;
      const uri = buildPlaylistUrl(playlistObj, meta);

      return height && uri ? [...acc, { height, uri }] : acc;
    }, []);

    return parse(list);
  };

  const setQuality = async (qualityObj: any) => {
    const tech = PlayerService.getVhs();
    const player = PlayerService.getPlayer();

    // if (true) {
    //   const source = PlayerManager.getCurrentSource();
    //   if (source) {
    //     const { currentTime } = PlayerManager.getState();
    //     await PlayerManager.setSource({ ...source, src: qualityObj.uri });

    //     player.one("timeupdate", () => {
    //       player.currentTime(currentTime);
    //     });

    //     await PlayerManager.play();
    //   }

    //   return;
    // }

    tech.representations().forEach((r) => {
      r.enabled(qualityObj ? r.height === qualityObj.height : true);
    });

    tech.representations().forEach((r) => {
      console.log(r.height, r.enabled());
    });

    console.log('[CHANGE QUALITY]', qualityObj, tech.representations());
  };

  return { buildQualityList, setQuality, init };
};

const instance = ManifestParser();
export { instance as ManifestParser };

const instance2 = StreamQualityManager();
export { instance2 as StreamQualityManager };
