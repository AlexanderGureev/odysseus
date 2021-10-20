/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react';
import { isIOS } from 'react-device-detect';

import { AdController } from '../Advertisement';
import { SkinConstructor } from '../SkinConstructor';
import { fakeVideoSrc } from './fakeVideo';
import { PlayerApiContext } from 'context';
import { PlayerService, TPlayerService, TState } from 'services/PlayerService';
import { TSource } from 'services/StreamService/types';
import { Nullable } from 'types';
import { MediatorService } from 'services/MediatorService';
import { Beholder } from '../Beholder';
import { AnalyticsEventManagerService } from 'services/AnalyticsEventManagerService';
import { usePlayerConfig } from 'hooks';
import { PLAYER_ERROR } from 'utils/drm/utils';
import { TProps, TPlayerState, VIDEO_TYPE, DEFAULT_PLAYER_ID, TPlayerApi } from './types';
// import { StreamQualityManager } from 'services/ManifestParser';

const Player: React.FC<TProps> = ({ source }) => {
  const { config } = usePlayerConfig();
  const { current: player } = React.useRef<TPlayerService>(PlayerService);
  const [isInitialized, setInitialized] = React.useState(false);

  const [videoNode, setVideoNode] = React.useState<Nullable<HTMLVideoElement>>(null);

  const [state, setState] = React.useState<TPlayerState>({
    ...player.getState(),
  });

  const currentSource = React.useRef(source);

  const [qualityList, setQualityList] = React.useState<Nullable<any[]>>(null);
  const [activeQualityId, setActive] = React.useState(-1);

  const updateState = React.useCallback(
    (newState: Partial<TPlayerState> = {}) => {
      setState((prev) => ({
        ...prev,
        ...newState,
        ...player.getState(),
      }));
    },
    [player]
  );

  const setVideoRef = React.useCallback((node) => {
    setVideoNode(node);
  }, []);

  const resumePlainVideo = React.useCallback(
    () =>
      new Promise<void>(async (resolve, reject) => {
        if (!currentSource.current) {
          reject('source is undefined');
          return;
        }

        await player.setSource(currentSource.current, VIDEO_TYPE.PLAIN);

        if (isIOS) {
          player.one('timeupdate', () => {
            player.setCurrentTime(1000);
          });
        } else {
          player.setCurrentTime(1000);
        }

        try {
          await player.initialPlay();
        } catch (e) {
          console.error(e);
          // TODO SHOW PLAY BTN (autoplay is blocked)
        }

        resolve();
      }),
    [player]
  );

  const initializeAdvertisement = React.useCallback(async () => {
    player.pause();
    await player.setSource({ src: fakeVideoSrc, type: 'video/mp4' }, VIDEO_TYPE.AD);
  }, [player]);

  // React.useEffect(() => {
  //   if (!stream) return;

  //   ManifestParser.fetchManifest(stream)
  //     .then(({ url, responseUrl, manifest }) => {
  //       const data = ManifestParser.parse(stream, manifest);

  //       // todo убрать в PlayerManager
  //       StreamQualityManager.init({
  //         protocol: stream.protocol,
  //         playlist: data.playlists,
  //         manifestUrl: responseUrl
  //       });

  //       const list = StreamQualityManager.buildQualityList();
  //       setQualityList(list);

  //       console.log("[RES]", { data, responseUrl, list });
  //     })
  //     .catch(console.error);
  // }, [stream]);

  React.useEffect(() => {
    player.init(DEFAULT_PLAYER_ID).then(() => {
      setInitialized(true);
    });
  }, [player]);

  React.useEffect(() => {
    AnalyticsEventManagerService.init(player, {
      trackId: config.playlist.items[0].track_id,
      userId: config.config.user_id,
      videosession_id: config.session.videosession_id,
    });
  }, [config, player]);

  React.useEffect(() => {
    player.on('play', () => {
      console.log('play');
    });

    player.one('timeupdate', () => {
      MediatorService.emit('started');
    });

    player.on('sourceset', (e) => {
      console.log('[EVENT] sourceset', e);
    });

    player.on('timeupdate', updateState);
  }, [player, updateState]);

  React.useEffect(() => {
    currentSource.current = source;
    resumePlainVideo().then(() => updateState());
  }, [source, resumePlainVideo, updateState]);

  React.useEffect(
    () =>
      player.onError((error) => {
        if (state.videoType === VIDEO_TYPE.AD) {
          console.log('[PLAYER] AD ERR', error);
          return;
        }

        if ([PLAYER_ERROR.MEDIA_ERR_DECODE, PLAYER_ERROR.MEDIA_ERR_SRC_NOT_SUPPORTED].includes(error.code)) {
          MediatorService.emit('change_stream');
        }
      }),
    [player, state.videoType]
  );

  const value: TPlayerApi = React.useMemo(
    () => ({ ...player, resumePlainVideo, initializeAdvertisement, isInitialized }),
    [player, resumePlainVideo, initializeAdvertisement, isInitialized]
  );

  const style = { position: 'absolute', left: '20px', top: '20px' };
  const style1 = { position: 'absolute', left: '250px', top: '20px' };

  return (
    <PlayerApiContext.Provider value={value}>
      <div>
        <button
          style={{ position: 'absolute', zIndex: 10000 }}
          onClick={() => {
            player.seek(30);
            updateState();
          }}>
          SEEK +30
        </button>
        <button
          style={{ position: 'absolute', zIndex: 10000, left: '100px' }}
          onClick={() => {
            player.seek(-30);
            updateState();
          }}>
          SEEK -30
        </button>
        <button
          style={{ position: 'absolute', zIndex: 10000, left: '200px' }}
          onClick={() => {
            if (player.isPaused()) {
              player.play();
            } else {
              player.pause();
            }

            updateState();
          }}>
          TOGGLE
        </button>
        <button
          style={{ position: 'absolute', zIndex: 10000, left: '300px' }}
          onClick={() => {
            player.setMute(!player.isMuted());
            updateState();
          }}>
          TOOGLE MUTE
        </button>
        <button
          style={{ position: 'absolute', zIndex: 10000, left: '450px' }}
          onClick={() => {
            player.setSource(currentSource.current);
            updateState();
          }}>
          SET SRC
        </button>
        <button
          style={{ position: 'absolute', zIndex: 10000, left: '550px' }}
          onClick={() => {
            player.setVolume(player.getVolume() + 0.2);
            updateState();
          }}>
          +20 VOLUME
        </button>
        <button
          style={{ position: 'absolute', zIndex: 10000, left: '650px' }}
          onClick={() => {
            player.setVolume(player.getVolume() - 0.2);
            updateState();
          }}>
          -20 VOLUME
        </button>

        {/* {qualityList && (
          <div style={style1}>
            <button
              className={activeQualityId === -1 ? 'active' : ''}
              onClick={() => {
                StreamQualityManager.setQuality();
                setActive(-1);
              }}>
              auto
            </button>
            {Object.keys(qualityList).map((key, i) => (
              <button
                className={i === activeQualityId ? 'active' : ''}
                key={qualityList[key].qualityMark}
                onClick={() => {
                  StreamQualityManager.setQuality(qualityList[key]);
                  setActive(i);
                }}>
                {qualityList[key].qualityMark}
              </button>
            ))}
          </div>
        )} */}

        <SkinConstructor>
          <Beholder>
            <video
              style={{ width: 400, height: 200 }}
              ref={setVideoRef}
              id={DEFAULT_PLAYER_ID}
              muted
              playsInline
              onError={(e) => console.log(e)}
            />
          </Beholder>
        </SkinConstructor>
        {videoNode && (
          <AdController
            paused={state.paused}
            videoType={state.videoType}
            currentTime={state.currentTime}
            videoNode={videoNode}
          />
        )}
      </div>
    </PlayerApiContext.Provider>
  );
};

export { Player };
