import React from 'react';
import { Player } from 'components/Player';
import { THEME, ThemeContext } from 'context';
import { SauronService } from 'services/SauronService';
import { YMContainer } from 'services/YmService';

import { OUTPUT_PLAYER_POST_MESSAGE, PostMessageService } from 'services/PostMessageService';
import { useAdConfig, usePlayerConfig, useQueryParams } from 'hooks';
import { GAContainer } from 'services/GaService';
import { EmbeddedCheckService } from 'services/EmbeddedCheckService';
import { useCurrentStream } from 'hooks/useCurrentStream';
import { AgeConfirmationPopup } from 'components/AgeConfirmationPopup';
import { AmberdataService } from 'services/AmberdataService';

export const App = () => {
  const { isEmbedded } = EmbeddedCheckService.getState();
  const query = useQueryParams();

  const { config } = usePlayerConfig();
  const { adConfig } = useAdConfig();
  const { source } = useCurrentStream();

  React.useEffect(() => {
    PostMessageService.init();
    SauronService.init();
  }, []);

  React.useEffect(() => {
    SauronService.subscribe((sid) => {
      AmberdataService.init({
        adConfig,
        params: {
          partnerId: config.features.partner_id,
          projectId: config.config.project_id,
          sid,
          skinId: config.config.skin_id,
          videoId: config.config.videofile_id,
          videosessionId: config.session.videosession_id,
        },
        skinName: config.features.skin_theme_class,
        isEmbedded,
        partnerId: config.features.partner_id,
        referrer: config.config.ref,
      });
    });
  }, [adConfig, config, isEmbedded]);

  React.useEffect(() => {
    const adv = Object.keys(adConfig).length > 0;
    PostMessageService.emit(OUTPUT_PLAYER_POST_MESSAGE.INITED, { payload: { adv } }); // TODO LOAD YA SDK
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!source) return null;

  console.log('is embeded: ', isEmbedded);
  console.log('query', query);
  console.log('selected source - ', source);
  console.log('config: ', config);

  return (
    <>
      <GAContainer />
      <YMContainer
        params={{ user_id: config?.config?.user_id || -1, videosession_id: config?.session.videosession_id }}
      />
      <ThemeContext.Provider value={THEME.MORETV}>
        <AgeConfirmationPopup>
          <Player source={source} />
        </AgeConfirmationPopup>
      </ThemeContext.Provider>
    </>
  );
};
