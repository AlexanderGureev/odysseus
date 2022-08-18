import './css/controls.css';

import { isIOS, isMobile } from 'react-device-detect';

import { createElement } from '../../../utils/createElement';
import {
  controls_mouse_leave_class_name,
  controls_mouse_over_class_name,
  enter_fullscreen_class_name,
  enter_fullscreen_hidden_class_name,
  exit_fullscreen_class_name,
  exit_fullscreen_hidden_class_name,
  pause_button_class_name,
  pause_button_hidden_class_name,
  play_button_class_name,
  play_button_hidden_class_name,
  quality_dropdown_option_auto_class_name,
  quality_dropdown_option_class_name,
  quality_dropdown_option_high_class_name,
  quality_dropdown_option_low_class_name,
  quality_dropdown_option_medium_class_name,
  quality_dropdown_option_selected_class_name,
  quality_dropdown_options_class_name,
  quality_dropdown_wrapper_class_name,
  quality_icon_class_name,
  quality_icon_mark_class_name,
  quality_selector_active_class_name,
  quality_selector_class_name,
  volume_class_name,
  volume_hidden_class_name,
  volume_high_class_name,
  volume_low_class_name,
  volume_mid_class_name,
  volume_mute_class_name,
  volume_range_class_name,
  volume_unmute_class_name,
  zoom_in_class_name,
  zoom_in_hidden_class_name,
  zoom_out_class_name,
  zoom_out_hidden_class_name,
} from './constants/classnames';

const isDevelopmentMode = process.env.NODE_ENV === 'development' || null;

const QUALITY = {
  AUTO: 'Auto',
  LQ: 'LQ',
  SD: 'SD',
  HD: 'HD',
};

const DATA_TARGET_ATTRIBUTE = 'data-target';

const MAPPED_QUALITY_OPTIONS_BY_QUALITY = {
  [QUALITY.AUTO]: {
    className: quality_dropdown_option_class_name,
    modificatorClassName: quality_dropdown_option_auto_class_name,
    dataQuality: QUALITY.AUTO,
    innerText: 'Авто',
  },
  [QUALITY.LQ]: {
    className: quality_dropdown_option_class_name,
    modificatorClassName: quality_dropdown_option_low_class_name,
    dataQuality: QUALITY.LQ,
    innerText: 'Низкое',
  },
  [QUALITY.SD]: {
    className: quality_dropdown_option_class_name,
    modificatorClassName: quality_dropdown_option_medium_class_name,
    dataQuality: QUALITY.SD,
    innerText: 'Среднее',
  },
  [QUALITY.HD]: {
    className: quality_dropdown_option_class_name,
    modificatorClassName: quality_dropdown_option_high_class_name,
    dataQuality: QUALITY.HD,
    innerText: 'Высокое',
  },
};

const getVolumeClassNameByVolume = ({ volume, muted }) => {
  if (muted) {
    return volume_mute_class_name;
  }

  if (volume >= 0 && volume < 0.25) {
    return volume_unmute_class_name;
  } else if (volume >= 0.25 && volume < 0.49) {
    return volume_low_class_name;
  } else if (volume >= 0.5 && volume < 0.75) {
    return volume_mid_class_name;
  } else if (volume >= 0.75) {
    return volume_high_class_name;
  }
};

const rfs =
  document.body.requestFullscreen ||
  document.body.webkitRequestFullScreen ||
  document.body.mozRequestFullScreen ||
  document.body.msRequestFullScreen;

const efs =
  document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen;

export class Controls {
  constructor({ target }) {
    this._target = document.querySelector(target);
    this._iframe = window.frames.vp_iframe;
    this._playerContainer = document.querySelector('.player-container');

    this._isAdvertisement = false;
  }

  init() {
    // Controls group
    this.createControlsGroup();

    // Play/Pause
    this.createPlayButton();
    this.createPauseButton();
    this.addPlayEventListener();
    this.addPauseEventListener();

    // Zoom in/out
    this.createZoomInButton();
    this.createZoomOutButton();
    this.addZoomInListener();
    this.addZoomOutListener();

    // Enter/Exit fullscreen
    this.createEnterFullScreenButton();
    this.createExitFullScreenButton();
    this.addEnterFullScreenListener();
    this.addExitFullScreenListener();
    this.addFullscreenChangeListener();

    // Volume
    this.createVolumeButton();
    this.addUpdateVolumeClickListener();

    // Volume range
    if (!isMobile) {
      this.createVolumeRange();
      this.addVolumeRangeListener();
    }

    // Progress bar
    this.createProgressBar();

    // Listen window message events
    this.handleWindowMessageEvent();

    // Listen player container events
    this.listenPlayerContainerEvents();
  }

  // Controls group
  createControlsGroup() {
    this._controlsContainer = document.createElement('div');
    this._controlsContainer.classList.add('controls-container');

    this._controlsLeftGroup = document.createElement('div');
    this._controlsLeftGroup.classList.add('controls-container__left-group');

    this._controlsCenterGroup = document.createElement('div');
    this._controlsCenterGroup.classList.add('controls-container__center-group');

    this._controlsRightGroup = document.createElement('div');
    this._controlsRightGroup.classList.add('controls-container__right-group');

    this._controlsContainer.appendChild(this._controlsLeftGroup);
    this._controlsContainer.appendChild(this._controlsCenterGroup);
    this._controlsContainer.appendChild(this._controlsRightGroup);

    this._target.appendChild(this._controlsContainer);

    this._controlsIsShown = true;
  }

  showControls() {
    if (this._isAdvertisement) return;

    this._controlsIsShown = true;
    this._hideControlsTimeout = setTimeout(this.hideControls.bind(this), 2500);

    this._controlsContainer.classList.add(controls_mouse_over_class_name);
    this._controlsContainer.classList.remove(controls_mouse_leave_class_name);
  }

  hideControls() {
    if (this._state === 'paused' && !this._isAdvertisement) {
      return;
    }

    this._controlsIsShown = false;
    clearTimeout(this._hideControlsTimeout);

    this._controlsContainer.classList.add(controls_mouse_leave_class_name);
    this._controlsContainer.classList.remove(controls_mouse_over_class_name);

    // check if the quality selector exists, may be missing
    if (this._qualitySelector && this._qualitySelector.classList) {
      this._qualitySelector.classList.remove(quality_selector_active_class_name);
    }
  }

  handleControlsMouseEnter() {
    if (isMobile) {
      return;
    }

    this.showControls();
  }

  handleControlsMouseLeave() {
    if (isMobile) {
      return;
    }

    clearTimeout(this._hideControlsTimeout);

    this.hideControls();
  }

  handleControlsMouseMove() {
    if (isMobile) {
      return;
    }

    clearTimeout(this._hideControlsTimeout);

    this.handleControlsMouseEnter();
  }

  handleControlsTouchEnd() {
    if (this._controlsIsShown) {
      this.hideControls();
    } else {
      this.showControls();
    }
  }

  handleReadyHideControls(state) {
    if (state === 'ready') {
      this._hideControlsTimeout = setTimeout(this.hideControls.bind(this), 2500);
    }
  }

  // Play/Pause
  createPlayButton() {
    this._playButton = document.createElement('div');
    this._playButton.classList.add(play_button_class_name);
    this._playButton.classList.add(play_button_hidden_class_name);

    this._controlsCenterGroup.appendChild(this._playButton);
  }

  createPauseButton() {
    this._pauseButton = document.createElement('div');
    this._pauseButton.classList.add(pause_button_class_name);
    this._pauseButton.classList.add(pause_button_hidden_class_name);

    this._controlsCenterGroup.appendChild(this._pauseButton);
  }

  addPlayEventListener() {
    this._playButton.addEventListener('click', () => {
      this._iframe.postMessage(
        JSON.stringify({
          event: 'play',
          eump_remote_message: true,
          data: null,
        }),
        '*'
      );
    });
  }

  addPauseEventListener() {
    this._pauseButton.addEventListener('click', () => {
      this._iframe.postMessage(
        JSON.stringify({
          event: 'pause',
          eump_remote_message: true,
          data: null,
        }),
        '*'
      );
    });
  }

  updatePlayPauseButton(state) {
    switch (state) {
      case 'ready':
        this._playButton.classList.remove(play_button_hidden_class_name);
        this._pauseButton.classList.add(pause_button_hidden_class_name);
        break;
      case 'playing':
        this._playButton.classList.add(play_button_hidden_class_name);
        this._pauseButton.classList.remove(pause_button_hidden_class_name);
        break;
      case 'paused':
        this._playButton.classList.remove(play_button_hidden_class_name);
        this._pauseButton.classList.add(pause_button_hidden_class_name);
        break;
      default:
        break;
    }
  }

  // Zoom in/out
  createZoomInButton() {
    this._zoomInButton = document.createElement('div');
    this._zoomInButton.classList.add(zoom_in_class_name);

    this._controlsRightGroup.appendChild(this._zoomInButton);
  }

  createZoomOutButton() {
    this._zoomOutButton = document.createElement('div');
    this._zoomOutButton.classList.add(zoom_out_class_name);
    this._zoomOutButton.classList.add(zoom_out_hidden_class_name);

    this._controlsRightGroup.appendChild(this._zoomOutButton);
  }

  addZoomInListener() {
    this._zoomInButton.addEventListener('click', () => {
      this.updateZoomInOutButton(true);
    });
  }

  addZoomOutListener() {
    this._zoomOutButton.addEventListener('click', () => {
      this.updateZoomInOutButton(false);
    });
  }

  updateZoomInOutButton(data) {
    if (data) {
      this._zoomInButton.classList.add(zoom_in_hidden_class_name);
      this._zoomOutButton.classList.remove(zoom_out_hidden_class_name);
    } else {
      this._zoomInButton.classList.remove(zoom_in_hidden_class_name);
      this._zoomOutButton.classList.add(zoom_out_hidden_class_name);
    }
  }

  // Quality dropdown
  createQualitySelector(qualityArray) {
    if (this._qualitySelector && this._qualitySelector.parentNode) {
      this._qualitySelector.parentNode.removeChild(this._qualitySelector);
    }

    const options = qualityArray
      .reverse()
      .map((quality) => {
        if (!MAPPED_QUALITY_OPTIONS_BY_QUALITY[quality]) return null;

        const node = document.createElement('div');
        node.classList.add(MAPPED_QUALITY_OPTIONS_BY_QUALITY[quality].className);
        node.classList.add(MAPPED_QUALITY_OPTIONS_BY_QUALITY[quality].modificatorClassName);
        node.setAttribute(DATA_TARGET_ATTRIBUTE, MAPPED_QUALITY_OPTIONS_BY_QUALITY[quality].dataQuality);
        node.innerText = MAPPED_QUALITY_OPTIONS_BY_QUALITY[quality].innerText;

        return node;
      })
      .filter(Boolean);

    this._qualitySelector = createElement({ className: quality_selector_class_name });
    this._qualityDropdownWraper = createElement({ className: quality_dropdown_wrapper_class_name });
    this._qualityDropdownOptions = createElement({ className: quality_dropdown_options_class_name });
    this._qualityDropdownOptionSelected = createElement({
      className: quality_dropdown_option_selected_class_name,
      innerHTML: 'Авто',
    });
    this._qualityIcon = createElement({ className: `${quality_icon_class_name} ${quality_icon_mark_class_name}` });
    this._qualityIcon.setAttribute('data-target', 'quality-icon');

    options.forEach((option) => {
      this._qualityDropdownOptions.appendChild(option);
    });

    // Option wrapper in dropdown wrapper
    this._qualityDropdownWraper.appendChild(this._qualityDropdownOptions);

    // Selected option in dropdown wrapper
    this._qualityDropdownWraper.appendChild(this._qualityDropdownOptionSelected);

    // Dropdown wrapper in quality selector
    this._qualitySelector.appendChild(this._qualityDropdownWraper);

    // Quality icon in quality selector
    this._qualitySelector.appendChild(this._qualityIcon);

    // Quality selector in control group
    this._controlsRightGroup.insertBefore(this._qualitySelector, this._controlsRightGroup.firstChild);
  }

  updateQualityDropdownOptionSelected(data) {
    let text;

    switch (data) {
      case QUALITY.AUTO:
        text = MAPPED_QUALITY_OPTIONS_BY_QUALITY[QUALITY.AUTO].innerText;
        break;
      case QUALITY.HD:
        text = MAPPED_QUALITY_OPTIONS_BY_QUALITY[QUALITY.HD].innerText;
        break;
      case QUALITY.SD:
        text = MAPPED_QUALITY_OPTIONS_BY_QUALITY[QUALITY.SD].innerText;
        break;
      case QUALITY.LQ:
        text = MAPPED_QUALITY_OPTIONS_BY_QUALITY[QUALITY.LQ].innerText;
        break;
      default:
        text = '';
    }

    this._qualityDropdownOptionSelected.innerText = text;
    this._qualityIcon.setAttribute('data-quality-mark', data);
  }

  activeQualitySelector() {
    this._qualitySelector.classList.add(quality_selector_active_class_name);
  }

  inActiveQualitySelector() {
    this._qualitySelector.classList.remove(quality_selector_active_class_name);
  }

  addQualitySelectorListeners(qualityArray) {
    window.addEventListener('click', (event) => {
      if (event.target.dataset.target === 'quality-icon') {
        this.activeQualitySelector();
        return;
      }

      qualityArray.forEach((quality) => {
        if (event.target.dataset.target === quality) {
          this._iframe.postMessage(
            JSON.stringify({
              event: 'setquality',
              eump_remote_message: true,
              data: quality,
            }),
            '*'
          );
        }
      });

      this.inActiveQualitySelector();
    });

    window.addEventListener('blur', () => {
      this.inActiveQualitySelector();
    });
  }

  // Enter/Exit fullscreen
  createEnterFullScreenButton() {
    this._enterFullscreenButton = document.createElement('div');
    this._enterFullscreenButton.classList.add(enter_fullscreen_class_name);

    this._controlsRightGroup.appendChild(this._enterFullscreenButton);
  }

  createExitFullScreenButton() {
    this._exitFullscreenButton = document.createElement('div');
    this._exitFullscreenButton.classList.add(exit_fullscreen_class_name);
    this._exitFullscreenButton.classList.add(exit_fullscreen_hidden_class_name);

    this._controlsRightGroup.appendChild(this._exitFullscreenButton);
  }

  addEnterFullScreenListener() {
    this._enterFullscreenButton.addEventListener('click', () => {
      if (isIOS) {
        this._iframe.postMessage(
          JSON.stringify({
            event: 'requestfullscreen',
            eump_remote_message: true,
          }),
          '*'
        );
      } else {
        rfs.call(document.body);
      }
    });
  }

  addExitFullScreenListener() {
    this._exitFullscreenButton.addEventListener('click', () => {
      efs.call(document);
    });
  }

  updateEnterExitFullscreenButton(data) {
    if (!data) {
      this._enterFullscreenButton.classList.remove(enter_fullscreen_hidden_class_name);
      this._exitFullscreenButton.classList.add(exit_fullscreen_hidden_class_name);
    } else {
      this._enterFullscreenButton.classList.add(enter_fullscreen_hidden_class_name);
      this._exitFullscreenButton.classList.remove(exit_fullscreen_hidden_class_name);
    }
  }

  toggleFullscreenClassName(data) {
    data ? this._playerContainer.classList.add('fullscreen') : this._playerContainer.classList.remove('fullscreen');
  }

  addFullscreenChangeListener() {
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        this.updateEnterExitFullscreenButton(true);
        this.toggleFullscreenClassName(true);
      } else {
        this.updateEnterExitFullscreenButton(false);
        this.toggleFullscreenClassName(false);
      }
    });

    document.addEventListener('webkitfullscreenchange', () => {
      const isFullScreen = document.webkitIsFullScreen;

      this.updateEnterExitFullscreenButton(isFullScreen);
      this.toggleFullscreenClassName(isFullScreen);
    });
  }

  // Volume
  createVolumeButton() {
    this._volumeButton = document.createElement('div');
    this._volumeButton.classList.add(volume_class_name);
    this._volumeButton.classList.add(volume_hidden_class_name);

    this._controlsLeftGroup.append(this._volumeButton);
  }

  updateVolumeButton(data) {
    this._volumeButton.classList.remove(
      volume_mute_class_name,
      volume_unmute_class_name,
      volume_low_class_name,
      volume_mid_class_name,
      volume_high_class_name,
      volume_hidden_class_name
    );
    this._volumeButton.classList.add(getVolumeClassNameByVolume(data));
  }

  addUpdateVolumeClickListener() {
    this._volumeButton.addEventListener('click', () => {
      this._iframe.postMessage(
        JSON.stringify({
          event: 'setmuted',
          eump_remote_message: true,
          data: !this._muted,
        }),
        '*'
      );
    });
  }

  // Volume range
  createVolumeRange() {
    this._volumeRange = document.createElement('input');
    this._volumeRange.setAttribute('type', 'range');
    this._volumeRange.setAttribute('min', '0');
    this._volumeRange.setAttribute('max', '1');
    this._volumeRange.setAttribute('step', '0.001');
    this._volumeRange.setAttribute('value', '0');
    this._volumeRange.classList.add(volume_range_class_name);

    this._controlsLeftGroup.appendChild(this._volumeRange);
  }

  addVolumeRangeListener() {
    this._volumeRange.addEventListener('input', (event) => {
      this._iframe.postMessage(
        JSON.stringify({
          event: 'setvolume',
          eump_remote_message: true,
          data: event.target.valueAsNumber,
        }),
        '*'
      );
    });
  }

  updateVolumeRangeValue(data) {
    this._volumeRange.value = data.volume;
  }

  // Progress bar
  createProgressBar() {
    this._progressBar = document.createElement('div');
    this._progressBar.classList.add('controls-container__progress-bar');

    this._controlsContainer.appendChild(this._progressBar);
  }

  // Handlers
  handleStateChange(state) {
    this.updatePlayPauseButton(state);
    this.handleReadyHideControls(state);
    this._state = state;
  }

  handleVolumeChange(data) {
    this._muted = data.muted;
    this._volume = data.volume;

    const uiVolume = this._muted ? 0 : this._volume;

    this.updateVolumeButton(data);
    this.updateVolumeRangeValue({ volume: uiVolume });
  }

  handleMouseEnter() {
    this.handleControlsMouseEnter();
  }

  handleMouseLeave() {
    this.handleControlsMouseLeave();
  }

  handleMouseMove() {
    this.handleControlsMouseMove();
  }

  handleQualityChange(data) {
    this.updateQualityDropdownOptionSelected(data);
  }

  handleTouchEnd() {
    this.handleControlsTouchEnd();
  }

  handleAdvertsModChange(data) {
    this._isAdvertisement = data.data.adverts;

    if (this._isAdvertisement) {
      this.hideControls();
    }
  }

  handleWindowMessageEvent() {
    window.addEventListener('message', (message) => {
      let data = {};

      try {
        data = JSON.parse(message.data);
      } catch (e) {
        // no messages no problems :)
      }

      if (data.event === 'statechange') {
        this.handleStateChange(data.data.state);
      }

      if (data.event === 'volumechange') {
        this.handleVolumeChange(data.data);
      }

      if (data.event === 'mouseenter') {
        this.handleMouseEnter();
      }

      if (data.event === 'mouseleave') {
        this.handleMouseLeave();
      }

      if (data.event === 'mousemove') {
        this.handleMouseMove();
      }

      if (data.event === 'qualitychange') {
        this.handleQualityChange(data.data);
      }

      if (data.event === 'touchend') {
        this.handleTouchEnd();
      }

      if (data.event === 'availablequalities') {
        if (data.data.length) {
          this.createQualitySelector(data.data);
          this.addQualitySelectorListeners(data.data);
        }
      }

      if (data.event === 'advertsmodechange') {
        this.handleAdvertsModChange(data);
      }

      if (
        isDevelopmentMode &&
        !(data.event === 'timeupdate_utc' || data.event === 'timeupdate' || data.event === 'mousemove')
      ) {
        console.log(data.event);
      }
    });
  }

  listenPlayerContainerEvents() {
    this._playerContainer.addEventListener('mouseenter', () => {
      this.handleControlsMouseEnter();
    });

    this._playerContainer.addEventListener('mouseleave', () => {
      this.handleControlsMouseLeave();
    });

    this._playerContainer.addEventListener('mousemove', () => {
      this.handleControlsMouseMove();
    });

    this._playerContainer.addEventListener('touchend', () => {
      clearTimeout(this._hideControlsTimeout);

      this._hideControlsTimeout = setTimeout(this.hideControls.bind(this), 2500);
    });
  }
}
