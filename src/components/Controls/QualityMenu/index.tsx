import qualityMenuIcon from 'assets/sprite/icons-app-player-settings.svg';
import { Menu as UIKitMenu } from 'components/UIKIT/Menu';
import { useAppDispatch } from 'hooks';
import React, { useCallback, useMemo } from 'react';
import { TQualityList } from 'services/StreamQualityManager/types';
import { QUALITY_MARKS } from 'services/VigoService';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const qualityOptions = {
  [QUALITY_MARKS.AQ]: {
    value: QUALITY_MARKS.AQ,
    title: 'Авто',
  },
  [QUALITY_MARKS.LD]: {
    value: QUALITY_MARKS.LD,
    title: 'Низкое 360p',
  },
  [QUALITY_MARKS.SD]: {
    value: QUALITY_MARKS.SD,
    title: 'Среднее 480p',
  },
  [QUALITY_MARKS.HD]: {
    value: QUALITY_MARKS.HD,
    title: 'Высокое 720p',
  },
  [QUALITY_MARKS.UHD]: {
    value: QUALITY_MARKS.UHD,
    title: 'Очень высокое 1080p',
  },
};

export const QualityMenu: React.FC<{ data: TQualityList; selected: QUALITY_MARKS }> = ({ data, selected }) => {
  const dispatch = useAppDispatch();

  const items = useMemo(() => {
    return data.map((mark) => qualityOptions[mark]);
  }, [data]);

  const onSelect = useCallback(
    (item: { value: QUALITY_MARKS; title: string }) => {
      dispatch(
        sendEvent({ type: 'CHANGE_CURRENT_QUALITY', payload: { value: item.value }, meta: { block: 'default' } })
      );
    },
    [dispatch]
  );

  const onOpen = useCallback(() => {
    dispatch(sendEvent({ type: 'QUALITY_MENU_SHOWN' }));
  }, [dispatch]);

  return (
    <div className={Styles.wrapper}>
      <UIKitMenu selected={selected} items={items} onSelect={onSelect} onOpen={onOpen}>
        <div className={Styles.quality}>
          <img className={Styles.icon} src={qualityMenuIcon} />
          <span>Качество</span>
        </div>
      </UIKitMenu>
    </div>
  );
};
