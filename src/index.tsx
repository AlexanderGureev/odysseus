/* eslint-disable @typescript-eslint/ban-ts-comment */
// import './publicPath';
import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/fonts.css';
import './styles/index.css';

import { App } from './App';
import { EmbeddedCheckService } from 'services/EmbeddedCheckService';
import { ErrorManager } from 'components/ErrorManager';
import { PlayerConfigProvider } from 'providers/PlayerConfigProvider';
import { AdConfigProvider } from 'providers/AdConfigProvider';
import { StreamProvider } from 'providers/StreamProvider';
import { FeaturesProvider } from 'providers/FeaturesProvider';
import { useAdConfig } from 'hooks';
import { AdCategory } from 'server/types';
import { AdBlock, AD_BLOCK_STATUS, TAdBlock, TAdConfig } from 'components/Advertisement';
import { Nullable } from 'types';
import { loadYaSdk } from 'components/Advertisement/yaSdkLoader';

import { IDBService } from 'services/IDBService';
import { APP_DB_NAME, CollectionName, Indexes } from 'services/IDBService/types';
import { WindowController } from 'services/WindowController';

const sharingUrl = window?.ODYSSEUS_PLAYER_CONFIG?.playlist?.items[0]?.sharing_url;

const updateState = (adBlock: TAdBlock, { links, ...rest }: TAdConfig) => {
  return {
    links: links.filter(
      (link, i) => ![AD_BLOCK_STATUS.ERROR, AD_BLOCK_STATUS.FINISHED_SUCCESS].includes(adBlock.state[i].status)
    ),
    ...rest,
  };
};

const TestApp = () => {
  const slotRef = useRef<Nullable<HTMLDivElement>>(null);
  const videoRef = useRef<Nullable<HTMLVideoElement>>(null);
  // const player = useRef<Nullable<VideoJsPlayer>>(null);
  const { adConfig } = useAdConfig();

  useEffect(() => {
    // player.current = videojs(videoRef.current, {
    //   // @ts-ignore
    //   preload: 'metadata',
    //   html5: {
    //     vhs: {
    //       overrideNative: isAndroid,
    //     },
    //     nativeAudioTracks: false,
    //     nativeVideoTracks: false,
    //     enableLowInitialPlaylist: true,
    //   },
    // });

    const startAd = (adBlock: TAdBlock) =>
      new Promise<void>((res, rej) => {
        if (!videoRef.current || !slotRef.current) return;

        adBlock
          .play()
          .then(() => {
            console.log('success');
            res();
          })
          .catch((e) => {
            console.error('error', e);
            res();
          });
      });

    // player.current.on('ready', () => {
    //   loadYaSdk().then(async () => {
    //     if (!videoRef.current || !slotRef.current) return;

    //     let limiter = 4;
    //     let state = adConfig[AdCategory.PRE_ROLL] as TAdConfig;

    //     while (--limiter > 0) {
    //       const adBlock = AdBlock(state, videoRef.current, slotRef.current);

    //       await startAd(adBlock);
    //       state = updateState(adBlock, state);
    //     }
    //   });
    // });

    loadYaSdk().then(async () => {
      if (!videoRef.current || !slotRef.current) return;

      let limiter = 4;
      let state = adConfig[AdCategory.PRE_ROLL] as TAdConfig;

      while (--limiter > 0) {
        const adBlock = AdBlock(state, videoRef.current, slotRef.current);

        await startAd(adBlock);
        state = updateState(adBlock, state);
      }
    });
  }, [adConfig]);

  return (
    <>
      <div ref={slotRef}></div>
      <video
        ref={videoRef}
        style={{ width: 400, height: 200 }}
        id={'video_tag'}
        muted
        playsInline
        onError={(e) => console.log(e)}
      />
    </>
  );
};

// WindowManagerService.init();
// HorusService.init();

IDBService.connect(APP_DB_NAME, [
  {
    name: CollectionName.MASTER_WINDOW,
    keyPath: 'key',
  },
  {
    name: CollectionName.EVENTS,
    keyPath: 'timestamp',
    indexes: [
      {
        name: Indexes.BY_STATUS,
        field: 'status',
      },
    ],
  },
])
  .then(() => {
    WindowController.init();
  })
  .catch((e) => {
    console.error('[IDBService] connect failed', e?.message);
  });

const node = document.getElementById('root');
const root = createRoot(node as HTMLElement);

EmbeddedCheckService.getEmbededStatus(sharingUrl).then(() => {
  root.render(
    <ErrorManager>
      <PlayerConfigProvider>
        <FeaturesProvider>
          <AdConfigProvider>
            <StreamProvider>
              <App />
              {/* <TestApp /> */}
            </StreamProvider>
          </AdConfigProvider>
        </FeaturesProvider>
      </PlayerConfigProvider>
    </ErrorManager>
  );
});
