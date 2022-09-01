import cn from 'classnames';
import { AdSkin } from 'components/AdSkin';
import { Controls } from 'components/Controls';
import { ErrorManager } from 'components/ErrorManager';
import { useAppDispatch, useAppSelector } from 'hooks';
import React, { useEffect } from 'react';
import { DEFAULT_PLAYER_ID } from 'services/PlayerService/types';
import { sendEvent } from 'store';
import { AppThemeBySkin, SkinClass } from 'types';

const Player = ({ children }: React.PropsWithChildren) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(sendEvent({ type: 'DO_PLAYER_INIT' }));
  }, [dispatch]);

  return (
    <div data-vjs-player>
      <video id={DEFAULT_PLAYER_ID} preload="metadata" muted playsInline />
      {children}
    </div>
  );
};

const theme = AppThemeBySkin[window?.ODYSSEUS_PLAYER_CONFIG?.features?.skin_theme_class || SkinClass.DEFAULT];

const PlayerManager = () => {
  const { isShowPlayerUI } = useAppSelector((state) => state.root);

  return (
    <div className={cn('wrapper', theme)}>
      <ErrorManager>
        {isShowPlayerUI && (
          <>
            <Player>
              <Controls />
            </Player>
            <AdSkin />
          </>
        )}
      </ErrorManager>
    </div>
  );
};

export const App: React.FC = () => {
  return <PlayerManager />;
};
