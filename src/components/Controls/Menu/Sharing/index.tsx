import okIcon from 'assets/icons/logo-ok-bw.svg';
import vkIcon from 'assets/icons/logo-vk-bw.svg';
import cn from 'classnames';
import { useAppSelector, useCopy } from 'hooks';
import React, { useRef } from 'react';
import { getPlaylistItem, getTrackInfo } from 'store/selectors';

import Styles from './index.module.css';

export const SOCIAL_NETWORKS = [
  {
    icon: vkIcon,
    name: 'ВКонтакте',
    id: 'vk',
    url: 'https://vk.com/share.php?url={url}&image={image}&title={title}',
  },
  {
    icon: okIcon,
    name: 'Одноклассники',
    id: 'ok',
    url: 'https://connect.ok.ru/offer?url={url}&title={title}&imageUrl={image}',
  },
];

export const Sharing = () => {
  const { sharing_url } = useAppSelector((state) => getPlaylistItem(state));
  const { project_name, season_name, episode_name, thumbnail_url } = useAppSelector((state) => getTrackInfo(state));
  const inputRef = useRef<HTMLInputElement>(null);
  const { isCopied, isSupported, onCopy } = useCopy();

  const onShareClick = (url: string) => {
    const resultUrl = url
      .replace('{url}', encodeURIComponent(sharing_url))
      .replace('{title}', `${project_name} ${season_name} ${episode_name}`)
      .replace('{image}', thumbnail_url || '');

    window?.open(resultUrl, 'Share', 'width=800,height=600');
  };

  return (
    <div className={cn(Styles.wrapper)}>
      <div className={Styles.content}>
        <h6 className={Styles.title}>Поделиться этим видео</h6>
        <div className={Styles.group}>
          {SOCIAL_NETWORKS.map(({ id, icon, url }) => (
            <img key={id} src={icon} onClick={() => onShareClick(url)} />
          ))}
        </div>
        <input className={Styles.input} ref={inputRef} value={sharing_url} readOnly />
        {isSupported ? (
          <button
            className={cn('copy-btn', isCopied && 'copied', Styles.btn)}
            onClick={() => {
              if (!inputRef.current) return;
              onCopy(inputRef.current.value);
            }}>
            {isCopied ? 'Скопировано' : 'Скопировать'}
          </button>
        ) : (
          <div className="copy-text">Скопировать: CTRL + C</div>
        )}
      </div>
    </div>
  );
};
