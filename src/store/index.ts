import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { toXSTATE } from 'utils/toXSTATE';

import { listenerMiddleware } from './middleware';
import adBlock from './slices/adBlock/reducer';
import adController from './slices/adController/reducer';
import adTimeNotify from './slices/adTimeNotify/reducer';
import adultNotify from './slices/adultNotify/reducer';
import autoSwitch from './slices/autoSwitch/reducer';
import beholder from './slices/beholder/reducer';
import buffering from './slices/buffering/reducer';
import changeTrack from './slices/changeTrack/reducer';
import error from './slices/error/reducer';
import fullscreen from './slices/fullscreen/reducer';
import heartbeat from './slices/heartbeat/reducer';
import hotkeys from './slices/hotkeys/reducer';
import network from './slices/network/reducer';
import playback from './slices/playback/reducer';
import playbackSpeed from './slices/playbackSpeed/reducer';
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
  root: root.reducer,
  resumeVideo: resumeVideo.reducer,
  adController: adController.reducer,
  adBlock: adBlock.reducer,
  playback: playback.reducer,
  watchpoint: watchpoint.reducer,
  heartbeat: heartbeat.reducer,
  rewind: rewind.reducer,
  rewindAcc: rewindAcc.reducer,
  buffering: buffering.reducer,
  adTimeNotify: adTimeNotify.reducer,
  quality: quality.reducer,
  network: network.reducer,
  changeTrack: changeTrack.reducer,
  autoSwitch: autoSwitch.reducer,
  playbackSpeed: playbackSpeed.reducer,
  volume: volume.reducer,
  visibility: visibility.reducer,
  fullscreen: fullscreen.reducer,
  adultNotify: adultNotify.reducer,
  resumeVideoNotify: resumeVideoNotify.reducer,
  hotkeys: hotkeys.reducer,
  splashscreen: splashscreen.reducer,
  beholder: beholder.reducer,
  error: error.reducer,
});

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
