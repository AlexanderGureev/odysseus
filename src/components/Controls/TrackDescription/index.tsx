import { useAppDispatch, useAppSelector, useFeatures } from 'hooks';
import React, { useCallback } from 'react';
import { UTMService } from 'services';
import { sendEvent } from 'store';
import { getTrackInfo, getTrackUrls } from 'store/selectors';
import { isNil } from 'utils';

import Styles from './index.module.css';

type NodeType = 'project' | 'season' | 'track';

type TextNodeProps = {
  type: NodeType;
  isLink: boolean;
  url: string | null;
  utmParams: {
    skinId: number;
    trackId: number | null;
  };
  onClick?: (type: NodeType) => void;
};

const TextNode = ({ type, isLink, children, url, utmParams, onClick }: React.PropsWithChildren<TextNodeProps>) => {
  return isLink && url ? (
    <a
      onClick={() => onClick?.(type)}
      href={`${url}?${UTMService.buildUTMQueryParams({
        term: type,
        ...utmParams,
      }).toString()}`}
      target="_blank"
      rel="noreferrer">
      {children}
    </a>
  ) : (
    <span>{children}</span>
  );
};

export const TrackDescription = () => {
  const dispatch = useAppDispatch();
  const { TITLE_LINKS } = useFeatures();
  const { project_name, season_name, episode_name, min_age } = useAppSelector((state) => getTrackInfo(state));
  const { project_url, season_url, track_url } = useAppSelector((state) => getTrackUrls(state));

  const utmParams = useAppSelector((state) => ({
    skinId: state.root.config.config.skin_id,
    trackId: state.root.meta.trackId,
  }));

  const onClick = useCallback(
    (type: NodeType) => {
      dispatch(sendEvent({ type: 'TRACK_DESCRIPTION_CLICK', meta: { type } }));
    },
    [dispatch]
  );

  const props = {
    isLink: Boolean(TITLE_LINKS),
    utmParams,
    onClick,
  };

  return (
    <div className={Styles.wrapper}>
      {project_name && (
        <div className={Styles.title}>
          <>
            <TextNode type="project" url={project_url} {...props}>
              {project_name}
            </TextNode>
            <div className={Styles['min-age']}>{isNil(min_age) ? '' : ` ${min_age}+`}</div>
          </>
        </div>
      )}
      <div className={Styles.subtitle}>
        {season_name && (
          <TextNode type="season" url={season_url} {...props}>
            {season_name}
          </TextNode>
        )}
        {episode_name && (
          <TextNode type="track" url={track_url} {...props}>
            {episode_name}
          </TextNode>
        )}
      </div>
    </div>
  );
};
