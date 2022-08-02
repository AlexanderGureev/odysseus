import { useFeatures, usePlayerApi, usePlayerConfig } from 'hooks';
import React from 'react';
import { BeholderService } from 'services/BeholderService';

export const Beholder = ({ children }: React.PropsWithChildren) => {
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
      userToken: '',
      serviceDisabled: DISABLE_BEHOLDER,
    });
  }, [DISABLE_BEHOLDER, config]);

  React.useEffect(() => {
    if (!player.isInitialized) return;

    player.on('timeupdate', () => {
      const { currentTime, seeking } = player.getState();
      BeholderService.onTimeUpdate(currentTime, seeking);
    });

    // player.on('pause', () => {
    //   BeholderService.saveTime(player.getCurrentTime());
    // });
  }, [player]);

  return <>{children}</>;
};
