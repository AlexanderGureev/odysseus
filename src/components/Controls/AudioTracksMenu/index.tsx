import subtitlesIcon from 'assets/sprite/icons-24-subtitles.svg';
import { Menu as UIKitMenu } from 'components/UIKIT/Menu';
import { useAppDispatch } from 'hooks';
import React, { useCallback } from 'react';
import { sendEvent } from 'store';
import { Lang, LinkedAudioTrackItem } from 'store/slices/audioTracks';

import Styles from './index.module.css';

const AudioTracksMap: { [key in Lang]: string } = {
  rus: 'Русский',
  eng: 'Английский с русскими субтитрами',
};

export const AudioTracksMenu: React.FC<{ config: LinkedAudioTrackItem }> = ({ config }) => {
  const dispatch = useAppDispatch();

  const onChange = useCallback(() => {
    dispatch(sendEvent({ type: 'CHANGE_AUDIO_TRACK' }));
  }, [dispatch]);

  const items = Object.keys(AudioTracksMap).map((key) => ({
    title: AudioTracksMap[key as Lang],
    value: key,
  }));

  return (
    <UIKitMenu selected={config.currentLang} items={items} onSelect={onChange}>
      <div className={Styles.subtitles}>
        <img className={Styles.icon} src={subtitlesIcon} />
        <span>Язык и субтитры</span>
      </div>
    </UIKitMenu>
  );
};
