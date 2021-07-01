import React from 'react';
import { usePlayerConfig, useFeatures, usePlayerApi } from 'hooks';
import { BeholderService } from 'services/BeholderService';

export const Beholder: React.FC = ({ children }) => {
  const { config } = usePlayerConfig();
  const { DISABLE_BEHOLDER = false } = useFeatures();
  const player = usePlayerApi();

  React.useEffect(() => {
    BeholderService.init({
      duration: config.playlist.items[0].duration,
      seasonName: config.playlist.items[0].season_name,
      trackId: config.playlist.items[0].track_id,
      projectId: config.config.project_id,
      scrobbling: config.config.scrobbling,
      userId: config.config.user_id,
      userToken: config.context.user_token,
      serviceDisabled: DISABLE_BEHOLDER,
    });
  }, [DISABLE_BEHOLDER, config]);

  React.useEffect(() => {
    if (!player.isInitialized) return;

    player.on('timeupdate', () => {
      const { currentTime, seeking } = player.getState();
      BeholderService.onTimeUpdate(currentTime, seeking);
    });

    player.on('pause', () => {
      BeholderService.saveTime(player.getCurrentTime());
    });
  }, [player]);

  return <>{children}</>;
};