import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { toXSTATE } from 'utils/toXSTATE';

import { listenerMiddleware } from './middleware';
import adBlock from './slices/adBlock/reducer';
import adController from './slices/adController/reducer';
import adTimeNotify from './slices/adTimeNotify/reducer';
import adultNotify from './slices/adultNotify/reducer';
import analytics from './slices/analytics/reducer';
import autoSwitch from './slices/autoSwitch/reducer';
import beholder from './slices/beholder/reducer';
import buffering from './slices/buffering/reducer';
import changeTrack from './slices/changeTrack/reducer';
import error from './slices/error/reducer';
import favourites from './slices/favourites/reducer';
import favouritesController from './slices/favouritesController/reducer';
import fullscreen from './slices/fullscreen/reducer';
import heartbeat from './slices/heartbeat/reducer';
import hotkeys from './slices/hotkeys/reducer';
import network from './slices/network/reducer';
import networkRecovery from './slices/networkRecovery/reducer';
import offlineMode from './slices/offlineMode/reducer';
import p2p from './slices/p2p/reducer';
import playback from './slices/playback/reducer';
import playbackSpeed from './slices/playbackSpeed/reducer';
import postMessages from './slices/postMessages/reducer';
import quality from './slices/quality/reducer';
import resumeVideo from './slices/resumeVideo/reducer';
import resumeVideoNotify from './slices/resumeVideoNotify/reducer';
import rewind from './slices/rewind/reducer';
import rewindAcc from './slices/rewindAcc/reducer';
import root from './slices/root/reducer';
import splashscreen from './slices/splashscreen/reducer';
import visibility from './slices/visibility/reducer';
import volume from './slices/volume/reducer';
import watchpoint from './slices/watchpoint/reducer';

/*
Ограничения для системы:
1) плоский конфиг fsm
2) асинхронный переход должен содержать в идеале 1 асинхронную операцию

createReducer(
  1) initializer (idle...)
  2) player (idle...)
  3) switcher (idle...)
  4) updater (idle...)
  5) adController (idle...)
  6) adBlock (idle...)
)

sendEvent(type: "DO_INIT", payload: {}, meta: {}) 
*/

const rootReducer = combineReducers({
  analytics: analytics.reducer,
  // отправка и обработка postmessages
  postMessages: postMessages.reducer,
  /* 
  корневой автомат, точка входа в приложение:
  1) парсинг конфига
  2) проверка ошибок
  3) инициализация основных сервисов
  */
  root: root.reducer,
  // дочерный автомат root для запуска основного видео, проверка токена и манифеста, начальная иницилизация
  resumeVideo: resumeVideo.reducer,
  // рекламный контроллер, управляет показом рекламы
  adController: adController.reducer,
  // управление рекламной паузой, загрука и воспроизведение креатива, управление воспроизведением
  adBlock: adBlock.reducer,
  // управление воспроизведением основного видео
  playback: playback.reducer,
  // детекция и отправка событий при достижении watchpoint
  watchpoint: watchpoint.reducer,
  // детекция и отправка событий на каждый heartbeat
  heartbeat: heartbeat.reducer,
  // управление перемоткой основного видео
  rewind: rewind.reducer,
  // накопление перемотки и отправка события SEEK в автомат rewind
  rewindAcc: rewindAcc.reducer,
  // детекция буферизации, сбор статистики
  buffering: buffering.reducer,
  // управление показом плашки "n сек, до рекламы"
  adTimeNotify: adTimeNotify.reducer,
  // управление качеством потока
  quality: quality.reducer,
  // контроль за состоянием сети
  network: network.reducer,
  // цикл восстановления сети
  networkRecovery: networkRecovery.reducer,
  // обработка ивентов в offline режиме
  offlineMode: offlineMode.reducer,
  // переключение серий, загрузка конфига
  changeTrack: changeTrack.reducer,
  // автопереключение серий в начале титров или в конце трека
  autoSwitch: autoSwitch.reducer,
  // управление скоростью воспроизведения
  playbackSpeed: playbackSpeed.reducer,
  // управление звуком на рекламе и основном видео
  volume: volume.reducer,
  // детекция видимости страницы
  visibility: visibility.reducer,
  // управление полноэкранным режимом
  fullscreen: fullscreen.reducer,
  // экрана 18+
  adultNotify: adultNotify.reducer,
  // экран "продолжить просмотр"
  resumeVideoNotify: resumeVideoNotify.reducer,
  // обработка горячих клавиш
  hotkeys: hotkeys.reducer,
  // управление показом splashscreen
  splashscreen: splashscreen.reducer,
  // отправка прогресса просмотра
  beholder: beholder.reducer,
  // активность фичи "избранное" и выбор режима работы
  favourites: favourites.reducer,
  // обработка избранного и синхронизация
  favouritesController: favouritesController.reducer,
  // управление пирингом
  p2p: p2p.reducer,
  // модуль сбора ошибок
  error: error.reducer,
});

analytics.addMiddleware();
postMessages.addMiddleware();
root.addMiddleware();
resumeVideo.addMiddleware();
adController.addMiddleware();
adBlock.addMiddleware();
playback.addMiddleware();
watchpoint.addMiddleware();
heartbeat.addMiddleware();
rewind.addMiddleware();
rewindAcc.addMiddleware();
buffering.addMiddleware();
adTimeNotify.addMiddleware();
quality.addMiddleware();
network.addMiddleware();
networkRecovery.addMiddleware();
offlineMode.addMiddleware();
changeTrack.addMiddleware();
autoSwitch.addMiddleware();
playbackSpeed.addMiddleware();
volume.addMiddleware();
visibility.addMiddleware();
fullscreen.addMiddleware();
adultNotify.addMiddleware();
resumeVideoNotify.addMiddleware();
hotkeys.addMiddleware();
splashscreen.addMiddleware();
beholder.addMiddleware();
favourites.addMiddleware();
favouritesController.addMiddleware();
p2p.addMiddleware();
error.addMiddleware();

// console.log(
//   [root, adController, adBlock, updater, switcher, playback, rewind, adTimeNotify, error].reduce((acc, m) => {
//     return (
//       acc + `const ${m.name} = createMachine(${JSON.stringify(toXSTATE(m.name, m.getInitialState().step, m.config))}); `
//     );
//   }, '')
// );

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export * from './actions';
export * from './types';
