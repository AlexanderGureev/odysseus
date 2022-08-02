/* eslint-disable @typescript-eslint/ban-ts-comment */
import './publicPath';
import './styles/fonts.css';
import './styles/index.css';

import { ErrorManager } from 'components/ErrorManager';
import { DEFAULT_PLAYER_ID } from 'components/Player/types';
import { SkinConstructor } from 'components/SkinConstructor';
import { useAppDispatch, useAppSelector } from 'hooks';
import { StreamProvider } from 'providers/StreamProvider';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { EmbeddedCheckService } from 'services/EmbeddedCheckService';
import { IDBService } from 'services/IDBService';
import { APP_DB_NAME, CollectionName, Indexes } from 'services/IDBService/types';
import { QUALITY_MARKS } from 'services/VigoService';
import { WindowController } from 'services/WindowController';
import { sendEvent, store } from 'store';
import { secToHumanReadeable } from 'utils';

// start app
store.dispatch(sendEvent({ type: 'DO_INIT' }));

const node = document.getElementById('root');
const root = createRoot(node as HTMLElement);

const qualityOptions = {
  [QUALITY_MARKS.AQ]: {
    label: 'Авто',
  },
  [QUALITY_MARKS.LD]: {
    label: 'Низкое 360p',
  },
  [QUALITY_MARKS.SD]: {
    label: 'Среднее 480p',
  },
  [QUALITY_MARKS.HD]: {
    label: 'Высокое 720p',
  },
  [QUALITY_MARKS.UHD]: {
    label: 'Очень высокое 1080p',
  },
};

const Player = () => {
  const dispatch = useAppDispatch();
  const playback = useAppSelector((state) => state.playback);
  const adBlock = useAppSelector((state) => state.adBlock);
  const adController = useAppSelector((state) => state.adController);
  const rewind = useAppSelector((state) => state.rewind);

  const adNotify = useAppSelector((state) => state.adTimeNotify);
  const quality = useAppSelector((state) => state.quality);
  const playbackSpeed = useAppSelector((state) => state.playbackSpeed);

  useEffect(() => {
    dispatch(sendEvent({ type: 'DO_PLAYER_INIT', meta: { playerId: DEFAULT_PLAYER_ID } }));
  }, [dispatch]);

  return (
    <>
      <video id={DEFAULT_PLAYER_ID} preload="metadata" muted playsInline onError={(e) => console.log(e)} />

      {playback.step !== 'IDLE' && adController.step !== 'AD_BREAK' && (
        <div className="controls">
          <div>
            Таймлайн: {secToHumanReadeable(playback.currentTime || 0)} / {secToHumanReadeable(playback.duration || 0)}
          </div>

          <div>
            Качество:
            <select
              value={quality.currentQualityMark}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                dispatch(
                  sendEvent({ type: 'CHANGE_CURRENT_QUALITY', payload: { value: e.target.value as QUALITY_MARKS } })
                );
              }}>
              {quality.qualityList.map((mark) => (
                <option value={mark} key={mark}>
                  {qualityOptions[mark].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            Скорость воспроизведения:
            <select
              value={playbackSpeed.currentSpeed}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                dispatch(sendEvent({ type: 'SET_PLAYBACK_SPEED', payload: { value: +e.target.value } }));
              }}>
              {playbackSpeed.list.map((value) => (
                <option value={value} key={value}>
                  {value === 1 ? 'Обычная' : value}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              dispatch(sendEvent({ type: 'DO_PLAY' }));
            }}
            disabled={playback.step === 'PLAYING'}>
            play
          </button>
          <button
            onClick={() => {
              dispatch(sendEvent({ type: 'DO_PAUSE' }));
            }}
            disabled={playback.step === 'PAUSED'}>
            pause
          </button>
          <button
            onClick={() => {
              dispatch(
                sendEvent({
                  type: 'SEEK',
                  meta: {
                    to: 178,
                  },
                })
              );
            }}>
            seek to 178
          </button>
          <button
            onClick={() => {
              dispatch(
                sendEvent({
                  type: 'INC_SEEK',
                  payload: {
                    value: 30,
                  },
                })
              );
            }}>
            seek +30 ({rewind.inc})
          </button>
          <button
            onClick={() => {
              dispatch(
                sendEvent({
                  type: 'DEC_SEEK',
                  payload: {
                    value: -30,
                  },
                })
              );
            }}>
            seek -30 ({rewind.dec})
          </button>
          <button
            onClick={() => {
              dispatch(
                sendEvent({
                  type: 'SEEK',
                  meta: {
                    to: (playback.duration || 0) - 5,
                  },
                })
              );
            }}>
            seek to end
          </button>
        </div>
      )}

      {adController.step === 'AD_BREAK' && (
        <div className="controls">
          <div>
            реклама: {adBlock.index + 1} / {adBlock.limit}
          </div>
          <div>
            таймлайн: {secToHumanReadeable(adBlock.currentTime || 0)} / {secToHumanReadeable(adBlock.duration || 0)}
          </div>

          <button
            onClick={() => {
              dispatch(sendEvent({ type: 'DO_PLAY_AD_BLOCK' }));
            }}
            disabled={adBlock.step === 'PLAYING'}>
            play
          </button>
          <button
            onClick={() => {
              dispatch(sendEvent({ type: 'DO_PAUSE_AD_BLOCK' }));
            }}
            disabled={adBlock.step === 'PAUSED'}>
            pause
          </button>

          <button
            onClick={() => {
              dispatch(sendEvent({ type: 'DO_SKIP_AD_BLOCK' }));
            }}
            disabled={!adBlock.skippable || adBlock.step === 'SKIP_AD_BLOCK_PENDING'}>
            skip
          </button>
        </div>
      )}

      {adNotify.time && <div className="ad-notify">{adNotify.time} сек. до рекламной паузы</div>}
    </>
  );
};

const PlayerManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { step, isShowPlayerUI } = useAppSelector((state) => state.root);

  return (
    <div className="player-manager">
      {isShowPlayerUI && (
        <SkinConstructor>
          <Player />
        </SkinConstructor>
      )}

      {step === 'BIG_PLAY_BUTTON' && (
        <div
          onClick={() => {
            dispatch(
              sendEvent({
                type: 'CLICK_BIG_PLAY_BUTTON',
              })
            );
          }}>
          BIG_PLAY_BUTTON
        </div>
      )}
      {step === 'PAYWALL' && 'paywall'}
      {step === 'ADULT_NOTIFY' && 'ADULT_NOTIFY'}
      {step === 'RESUME_VIDEO_NOTIFY' && 'RESUME_VIDEO_NOTIFY'}
    </div>
  );
};

root.render(
  <Provider store={store}>
    <ErrorManager>
      <PlayerManager />
    </ErrorManager>
  </Provider>
);

{
  /* <PlayerConfigProvider>
          <FeaturesProvider>
            <AdConfigProvider>
              <StreamProvider>
                <App />
              </StreamProvider>
            </AdConfigProvider>
          </FeaturesProvider>
        </PlayerConfigProvider> */
}
