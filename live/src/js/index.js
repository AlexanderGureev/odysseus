import '../css/all.css';

import { version as appVersion } from './../../../package.json';
import { PlayerManager } from './modules/player-manager';

window.appVersion = appVersion;

new PlayerManager();
