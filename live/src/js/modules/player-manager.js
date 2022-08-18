import { Controls } from './controls';
import { IFrameManager } from './iframe-manager';

export class PlayerManager {
  constructor() {
    this._iFrameManager = new IFrameManager({ target: '.player-container' });
    this._controls = new Controls({ target: '.player-container' });

    this._controls.init();
  }
}
