/* eslint-disable @typescript-eslint/ban-ts-comment */
import './publicPath';
import './styles/fonts.css';
import './styles/index.css';

import cn from 'classnames';
import { ErrorManager } from 'components/ErrorManager';
import { SkinConstructor } from 'components/SkinConstructor';
import { Range } from 'components/UIKIT/Range';
import { useAppDispatch, useAppSelector } from 'hooks';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { DEFAULT_PLAYER_ID } from 'services/PlayerService/types';
import { QUALITY_MARKS } from 'services/VigoService';
import { sendEvent, store } from 'store';
import { getTrackInfo } from 'store/selectors';
import { AD_BANNER_CONTAINER_ID } from 'store/slices/adBanner';
import { Screens } from 'store/slices/splashscreen';
import { secToHumanReadeable } from 'utils';
import { sleep } from 'utils/retryUtils';

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

const FavouritesButton = () => {
  const dispatch = useAppDispatch();
  const { isFavourites } = useAppSelector((state) => state.favouritesController);

  const handleClick = React.useCallback(() => {
    dispatch(sendEvent({ type: 'SET_FAVOURITES', meta: { isFavourites: !isFavourites } }));
  }, [dispatch, isFavourites]);

  return (
    <div className="favourites">
      <button onClick={handleClick}>{isFavourites ? 'в избранном' : 'в избранное'}</button>
    </div>
  );
};

const Player = () => {
  const dispatch = useAppDispatch();
  const root = useAppSelector((state) => state.root);
  const playback = useAppSelector((state) => state.playback);
  const adBlock = useAppSelector((state) => state.adBlock);
  const adController = useAppSelector((state) => state.adController);
  const rewind = useAppSelector((state) => state.rewind);
  const rewindAcc = useAppSelector((state) => state.rewindAcc);

  const adNotify = useAppSelector((state) => state.adTimeNotify);
  const quality = useAppSelector((state) => state.quality);
  const playbackSpeed = useAppSelector((state) => state.playbackSpeed);
  const volume = useAppSelector((state) => state.volume);

  const buffering = useAppSelector((state) => state.buffering);
  const fullscreen = useAppSelector((state) => state.fullscreen);
  const changeTrack = useAppSelector((state) => state.changeTrack);
  const autoSwitch = useAppSelector((state) => state.autoSwitch);
  const favourites = useAppSelector((state) => state.favourites);

  const projectInfo = useAppSelector((state) => getTrackInfo(state));

  const adultNotify = useAppSelector((state) => state.adultNotify);
  const resumeVideoNotify = useAppSelector((state) => state.resumeVideoNotify);
  const splashscreen = useAppSelector((state) => state.splashscreen);
  const paywall = useAppSelector((state) => state.paywall);
  const payNotify = useAppSelector((state) => state.payNotify);
  const payButton = useAppSelector((state) => state.payButton);

  useEffect(() => {
    dispatch(sendEvent({ type: 'DO_PLAYER_INIT' }));
  }, [dispatch]);

  return (
    <div data-vjs-player>
      <video id={DEFAULT_PLAYER_ID} preload="metadata" muted playsInline onError={(e) => console.log(e)} />

      {root.step === 'READY' && adController.step !== 'AD_BREAK' && playback.duration && playback.duration > 0 && (
        <>
          <div className="controls">
            <div className="project-info" style={{ marginBottom: '20px' }}>
              <div>
                {projectInfo.project_name} {projectInfo.min_age}+
              </div>
              <div>
                {projectInfo.season_name} {projectInfo.episode_name}{' '}
              </div>
            </div>
            <div>
              Таймлайн: {secToHumanReadeable(playback.currentTime || 0)} / {secToHumanReadeable(playback.duration || 0)}
              <div className="range-container" style={{ margin: '12px 5px', display: 'flex', alignItems: 'center' }}>
                <Range
                  ariaLabel="video progress slider"
                  width="300px"
                  onDragEnd={(value) => {
                    dispatch(sendEvent({ type: 'SEEK', meta: { to: value } }));
                  }}
                  bufferValue={buffering.bufferedEnd}
                  value={playback.currentTime || 0}
                  max={playback.duration || 0}
                  step={30}
                  getFormattedLabel={(value) => secToHumanReadeable(value)}
                />
                <div className="duration" style={{ marginLeft: '12px' }}>
                  {secToHumanReadeable(playback.duration || 0)}
                </div>

                {rewind.step === 'SEEKING' && <div style={{ position: 'absolute', right: 0 }}>seeking...</div>}
              </div>
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

            {!root.deviceInfo.isMobile && (
              <div>
                Звук:{' '}
                <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center' }}>
                  <button
                    style={{ position: 'absolute', left: '0' }}
                    onClick={() => {
                      dispatch(sendEvent({ type: 'SET_MUTE', payload: { value: !volume.muted } }));
                    }}>
                    {volume.muted ? 'unmute' : 'mute'}
                  </button>
                  <div className="range-container" style={{ position: 'absolute', left: '80px' }}>
                    <Range
                      ariaLabel="volume slider"
                      width="300px"
                      onChange={(value) => {
                        dispatch(sendEvent({ type: 'SET_VOLUME', payload: { value } }));
                      }}
                      step={0.1}
                      value={volume.muted ? 0 : volume.volume}
                      max={1}
                      getFormattedLabel={() => null}
                    />
                  </div>
                </div>
              </div>
            )}

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
                    type: 'SEEK',
                    meta: {
                      to: autoSwitch.autoswitchPoint - 1,
                    },
                  })
                );
              }}>
              seek to autoswitch
            </button>
            <button
              onClick={() => {
                dispatch(
                  sendEvent({
                    type: 'SEEK',
                    meta: {
                      to: autoSwitch.autoswitchPoint + 1,
                    },
                  })
                );
              }}>
              seek in autoswitch
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
              seek +30 ({rewindAcc.inc})
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
              seek -30 ({rewindAcc.dec})
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

            <button
              onClick={() => {
                dispatch(
                  sendEvent({
                    type: fullscreen.step === 'FULLSCREEN' ? 'EXIT_FULLCREEN' : 'ENTER_FULLCREEN',
                  })
                );
              }}>
              {fullscreen.step === 'FULLSCREEN' ? 'exit fullscreen' : 'enter fullscreen'}
            </button>

            {changeTrack.next && (
              <button
                onClick={() => {
                  dispatch(
                    sendEvent({
                      type: 'GO_TO_NEXT_TRACK',
                    })
                  );
                }}>
                next
              </button>
            )}
            {changeTrack.prev && (
              <button
                onClick={() => {
                  dispatch(
                    sendEvent({
                      type: 'GO_TO_PREV_TRACK',
                    })
                  );
                }}>
                prev
              </button>
            )}

            {favourites.step === 'READY' && <FavouritesButton />}
          </div>
          {payNotify.step === 'READY' && <PayNotify />}

          {payButton.step === 'READY' && <PayButton />}
        </>
      )}

      {adController.step === 'AD_BREAK' && (
        <div className="controls">
          <div>
            реклама: {adBlock.index + 1} / {adBlock.limit}
          </div>
          <div>
            таймлайн: {secToHumanReadeable(adBlock.currentTime || 0)} / {secToHumanReadeable(adBlock.duration || 0)}
          </div>

          <div className="range-container" style={{ margin: '12px 0', display: 'flex', alignItems: 'center' }}>
            <button
              style={{ position: 'absolute', left: '0' }}
              onClick={() => {
                dispatch(sendEvent({ type: 'SET_MUTE_AD_BLOCK', payload: { value: !volume.muted } }));
              }}>
              {volume.muted ? 'unmute' : 'mute'}
            </button>

            {!root.deviceInfo.isMobile && (
              <div style={{ position: 'absolute', left: '80px' }}>
                <Range
                  ariaLabel="volume slider"
                  width="300px"
                  onChange={(value) => {
                    dispatch(sendEvent({ type: 'SET_VOLUME_AD_BLOCK', payload: { value } }));
                  }}
                  step={0.1}
                  value={volume.muted ? 0 : volume.volume}
                  max={1}
                  getFormattedLabel={() => null}
                />
              </div>
            )}
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

      {autoSwitch.step === 'AUTOSWITCH_NOTIFY' && (
        <div className="auto-switch">
          <div>{Math.ceil(autoSwitch.countdownValue)} сек. до автопереключения</div>
          <button
            onClick={() => {
              dispatch(
                sendEvent({
                  type: 'HIDE_AUTOSWITCH_NOTIFY',
                })
              );
            }}>
            {autoSwitch.cancelButtonText}
          </button>
          <button
            onClick={() => {
              dispatch(
                sendEvent({
                  type: 'START_AUTOSWITCH',
                })
              );
            }}>
            {autoSwitch.buttonText}
          </button>
        </div>
      )}

      {root.step === 'BIG_PLAY_BUTTON' && (
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

      {adultNotify.step === 'ADULT_NOTIFY' && (
        <div className="overlay">
          <button
            onClick={() => {
              dispatch(sendEvent({ type: 'ADULT_NOTIFY_RESOLVE' }));
            }}>
            мне есть 18
          </button>
          <button
            onClick={() => {
              dispatch(sendEvent({ type: 'ADULT_NOTIFY_REJECT' }));
            }}>
            мне нет 18
          </button>
        </div>
      )}
      {resumeVideoNotify.step === 'RESUME_VIDEO_NOTIFY' && resumeVideoNotify.time && (
        <div className="overlay">
          <button
            onClick={() => {
              dispatch(sendEvent({ type: 'RESUME_VIDEO_NOTIFY_RESOLVE' }));
            }}>
            продолжить видео c {secToHumanReadeable(resumeVideoNotify.time)}
          </button>
          <button
            onClick={() => {
              dispatch(sendEvent({ type: 'RESUME_VIDEO_NOTIFY_REJECT' }));
            }}>
            начать с начала
          </button>
        </div>
      )}

      {root.step === 'BIG_PLAY_BUTTON' && (
        <div className="overlay">
          <button
            onClick={() => {
              dispatch(sendEvent({ type: 'CLICK_BIG_PLAY_BUTTON' }));
            }}>
            play
          </button>
        </div>
      )}

      {paywall.step === 'READY' && <Paywall />}

      {splashscreen.step === 'SHOWING_SPLASHCREEN' && <SpashScreen data={splashscreen.screens} />}

      <NetworkNotify />

      <AdBanner />
    </div>
  );
};

const AdBanner = () => {
  return (
    <div className="ad-banner-wrapper">
      <div id={AD_BANNER_CONTAINER_ID} />
    </div>
  );
};

const SpashScreen: React.FC<{ data: Screens }> = ({ data }) => {
  const dispatch = useAppDispatch();
  const [image, setImage] = React.useState<string | null>(null);

  React.useLayoutEffect(() => {
    const imageIterator = async () => {
      for (const { img, duration } of data) {
        setImage(img);
        await sleep(duration);
      }
    };

    imageIterator().then(() => {
      dispatch(sendEvent({ type: 'SHOWING_SPLASHCREEN_END' }));
    });
  }, [data, dispatch]);

  return image ? (
    <div className="splash-screen">
      <img src={image} />
    </div>
  ) : null;
};

const NetworkNotify = () => {
  const dispatch = useAppDispatch();
  const network = useAppSelector((state) => state.network);
  const networkRecovery = useAppSelector((state) => state.networkRecovery);

  const [isOnline, setIsOnline] = React.useState(false);
  const prevStatus = React.useRef(network.step);

  React.useEffect(() => {
    setIsOnline(network.step === 'ONLINE' && prevStatus.current === 'OFFLINE');
    prevStatus.current = network.step;
  }, [network.step]);

  if (networkRecovery.step === 'DISABLED') return null;

  return (
    <div
      className={cn('network-notify', {
        ['online']: isOnline,
        ['offline']: network.step === 'OFFLINE',
        ['rejected']: networkRecovery.step === 'REJECTED',
      })}>
      <div>network {network.step === 'ONLINE' ? 'online' : 'offline'}</div>
      {networkRecovery.step === 'TIMEOUT_WAITING' && (
        <button
          onClick={() => {
            dispatch(sendEvent({ type: 'CLICK_RETRY_BUTTON' }));
          }}>
          повторить {networkRecovery.step === 'TIMEOUT_WAITING' && networkRecovery.timerValue}
        </button>
      )}
      {networkRecovery.step === 'REJECTED' && (
        <button
          onClick={() => {
            dispatch(sendEvent({ type: 'RELOAD' }));
          }}>
          обновить страницу
        </button>
      )}
    </div>
  );
};

const Paywall = () => {
  const dispatch = useAppDispatch();
  const { title, description, buttonText } = useAppSelector((state) => state.paywall);

  return (
    <div className="paywall overlay">
      <div className="paywall-text-wrapper">
        <div className="title">{title}</div>
        {description && <div className="description">{description}</div>}
      </div>
      <button
        onClick={() => {
          dispatch(sendEvent({ type: 'CLICK_SUB_BUTTON' }));
        }}>
        {buttonText}
      </button>
    </div>
  );
};

const PayNotify = () => {
  const dispatch = useAppDispatch();
  const { text, buttonText } = useAppSelector((state) => state.payNotify);

  return (
    <div className="pay-notify">
      <div className="text" dangerouslySetInnerHTML={{ __html: text }} />
      <button
        onClick={() => {
          dispatch(sendEvent({ type: 'CLICK_SUB_BUTTON' }));
        }}>
        {buttonText}
      </button>
    </div>
  );
};

const PayButton = () => {
  const dispatch = useAppDispatch();
  const { text } = useAppSelector((state) => state.payButton);

  return (
    <div className="pay-button">
      <button
        onClick={() => {
          dispatch(sendEvent({ type: 'CLICK_PAY_BUTTON' }));
        }}>
        {text}
      </button>
    </div>
  );
};

const PlayerManager: React.FC = () => {
  const { isShowPlayerUI } = useAppSelector((state) => state.root);

  return (
    <div className="player-manager">
      {isShowPlayerUI && (
        <SkinConstructor>
          <Player />
        </SkinConstructor>
      )}
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
