import alertIcon from 'assets/sprite/icons-24-alert.svg';
import embedIcon from 'assets/sprite/icons-24-embed-code.svg';
import hotkeysIcon from 'assets/sprite/icons-24-hotkeys.svg';
import menuIcon from 'assets/sprite/icons-24-more-vertical.svg';
import shareIcon from 'assets/sprite/icons-24-share.svg';
import playbackSpeedIcon from 'assets/sprite/icons-app-player-playback-speed.svg';
import qualityMenuIcon from 'assets/sprite/icons-app-player-settings.svg';
import { Menu as UIKitMenu } from 'components/UIKIT/Menu';
import { MenuItem } from 'components/UIKIT/Menu/types';
import { useAppDispatch, useAppSelector, useFeatures, useLocalStorage } from 'hooks';
import useMediaQuery from 'hooks/useMedia';
import React, { useCallback } from 'react';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { QUALITY_MARKS } from 'services/VigoService';
import { sendEvent } from 'store';
import { OverlayType } from 'store/slices/overlay';

import { qualityOptions } from '../QualityMenu';
import Styles from './index.module.css';

export const Menu = () => {
  const dispatch = useAppDispatch();
  const quality = useAppSelector((state) => state.quality);
  const playbackSpeed = useAppSelector((state) => state.playbackSpeed);
  const errorReports = useAppSelector((state) => state.errorReports);
  const isMobile = useMediaQuery('(max-width: 428px)');

  const { COMPLAINT_LIMIT_TIME } = useFeatures();
  const { getItemByDomain } = useLocalStorage();

  const isComplainDisabled = useCallback(() => {
    const lastAttemtAt = getItemByDomain<number>(STORAGE_SETTINGS.COMPLAIN_TIMESTAMP);
    const delay = typeof COMPLAINT_LIMIT_TIME === 'number' ? COMPLAINT_LIMIT_TIME : 60_000;
    return Date.now() - (lastAttemtAt || 0) < delay;
  }, [COMPLAINT_LIMIT_TIME, getItemByDomain]);

  const onSelectQuality = useCallback(
    (item: { value: QUALITY_MARKS; title: string }) => {
      dispatch(
        sendEvent({ type: 'CHANGE_CURRENT_QUALITY', payload: { value: item.value }, meta: { block: 'settings' } })
      );
    },
    [dispatch]
  );

  const onSelectPlaybackSpeed = useCallback(
    (item: { value: string }) => {
      dispatch(sendEvent({ type: 'SET_PLAYBACK_SPEED', payload: { value: +item.value } }));
    },
    [dispatch]
  );

  const onSelect = useCallback(
    ({ value }: { value: OverlayType; title: string }) => {
      dispatch(sendEvent({ type: 'SET_OVERLAY', payload: { overlayType: value } }));
    },
    [dispatch]
  );

  const qualitySubMenu = {
    items: quality.qualityList.map((v) => qualityOptions[v]),
    selected: quality.currentQualityMark,
    onSelect: onSelectQuality,
  };

  const playbackSpeedSubMenu = {
    items: playbackSpeed.list.map((v) => ({ title: v === 1 ? 'Обычная' : `${v}`, value: `${v}` })),
    selected: `${playbackSpeed.currentSpeed}`,
    onSelect: onSelectPlaybackSpeed,
  };

  const menu = [
    isMobile
      ? {
          icon: qualityMenuIcon,
          title: 'Качество',
          selectedTitle: qualityOptions[quality.currentQualityMark].title,
          subMenu: qualitySubMenu,
        }
      : null,
    {
      icon: playbackSpeedIcon,
      title: 'Скорость',
      selectedTitle: playbackSpeed.currentSpeed === 1 ? 'Обычная' : `${playbackSpeed.currentSpeed}`,
      subMenu: playbackSpeedSubMenu,
    },
    {
      icon: shareIcon,
      title: 'Поделиться',
      value: 'sharing',
    },
    {
      icon: embedIcon,
      title: 'Код вставки',
      value: 'embedding',
    },
    !isMobile
      ? {
          icon: hotkeysIcon,
          title: 'Горячие клавиши',
          value: 'hotkeys',
        }
      : null,
    errorReports.step !== 'DISABLED'
      ? {
          icon: alertIcon,
          title: 'Сообщить о проблеме с видео',
          value: 'complain',
          disabled: isComplainDisabled,
        }
      : null,
  ].filter(Boolean) as MenuItem<{ value: string; title: string }, string>[];

  const onOpen = useCallback(() => {
    dispatch(sendEvent({ type: 'MENU_SHOWN' }));
  }, [dispatch]);

  const onClick = useCallback(
    (item: MenuItem<{ title: string }, string>) => {
      dispatch(sendEvent({ type: 'CLICK_MENU_ITEM', meta: { title: item.title, block: 'settings' } }));
    },
    [dispatch]
  );

  return (
    <div className={Styles.container}>
      <UIKitMenu items={menu} onSelect={onSelect} closeOnSelect onOpen={onOpen} onClick={onClick}>
        <div className={Styles['img-wrapper']}>
          <img src={menuIcon} />
        </div>
      </UIKitMenu>
    </div>
  );
};
