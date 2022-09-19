import { ErrorManager } from 'components/ErrorManager';
import { useAppDispatch, useAppSelector } from 'hooks';
import React, { useEffect } from 'react';
import { DEFAULT_PLAYER_ID } from 'services/PlayerService/types';
import { sendEvent } from 'store';

export const Player = React.memo(({ children }: React.PropsWithChildren) => {
  const dispatch = useAppDispatch();
  const isShowPlayerUI = useAppSelector((state) => state.root.isShowPlayerUI);

  useEffect(() => {
    if (isShowPlayerUI) dispatch(sendEvent({ type: 'DO_PLAYER_INIT' }));
  }, [isShowPlayerUI, dispatch]);

  return (
    <div data-vjs-player>
      <ErrorManager>
        {isShowPlayerUI && (
          <>
            <video id={DEFAULT_PLAYER_ID} preload="metadata" muted playsInline />
            {children}
          </>
        )}
      </ErrorManager>
    </div>
  );
});
