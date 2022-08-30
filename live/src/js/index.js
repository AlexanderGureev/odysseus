import '../css/all.css';

import pkg from './../../../package.json';
import { PlayerManager } from './modules/player-manager';

window.appVersion = pkg.version;

new PlayerManager();
