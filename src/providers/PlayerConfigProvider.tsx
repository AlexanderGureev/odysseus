import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TConfig, TSessionState } from 'server/types';
import { TParams } from 'server/utils';
import { PlayerConfigContext } from 'context';
import { randomHash12 } from 'utils/randomHash';

export type TExtendedConfig = TConfig & { session: TSessionState; context: TParams };

export const PlayerConfigProvider = ({ children }: React.PropsWithChildren) => {
  const videoSessionId = React.useRef(randomHash12());
  const ssid = React.useRef(uuidv4());

  console.log(videoSessionId.current, ssid.current, 'IDS');
  const [config, set] = React.useState<TExtendedConfig>({
    ...window.ODYSSEUS_PLAYER_CONFIG,
    session: {
      id: ssid.current,
      videosession_id: videoSessionId.current,
    },
    context: window.CONTEXT,
  });

  const setConfig = React.useCallback((config: TConfig) => {
    ssid.current = uuidv4();
    set((prev) => ({ ...prev, ...config, session: { ...prev.session, id: ssid.current } }));
  }, []);

  return <PlayerConfigContext.Provider value={{ config, setConfig }}>{children}</PlayerConfigContext.Provider>;
};
