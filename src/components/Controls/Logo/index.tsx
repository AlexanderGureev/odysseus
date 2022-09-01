import { useAppSelector, useFeatures } from 'hooks';
import React from 'react';
import { UTMService } from 'services';
import { getPlaylistItem } from 'store/selectors';

import Styles from './index.module.css';

export const Logo: React.FC<{ src: string }> = ({ src }) => {
  const { LOGO_LINK_TO_HOME } = useFeatures();
  const sharingURL = useAppSelector((state) => getPlaylistItem(state).sharing_url);

  const data = useAppSelector((state) => ({
    skinId: state.root.config.config.skin_id,
    trackId: state.root.meta.trackId,
  }));

  const params = UTMService.buildUTMQueryParams({
    term: 'logo',
    ...data,
  }).toString();

  const link = LOGO_LINK_TO_HOME && sharingURL ? `${sharingURL}?${params}` : null;

  return (
    <div className={Styles.logo}>
      {link ? (
        <a href={link}>
          <img src={src} />
        </a>
      ) : (
        <img src={src} />
      )}
    </div>
  );
};
