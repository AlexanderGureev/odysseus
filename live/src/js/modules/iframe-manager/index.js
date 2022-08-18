const FRAME_SRC = window.FRAME_SRC;

export class IFrameManager {
  constructor({ target }) {
    this._target = document.querySelector(target);

    this._iframe = document.createElement('iframe');
    this._iframe.setAttribute('src', FRAME_SRC);
    this._iframe.setAttribute('name', 'vp_iframe');
    this._iframe.setAttribute('id', 'vp_iframe');
    this._iframe.allow = 'encrypted-media;autoplay';

    this._target.appendChild(this._iframe);
  }
}
