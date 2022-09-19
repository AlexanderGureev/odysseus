import { NetworkNotice } from 'components/NetworkNotice';
import { useAppSelector, useFeatures } from 'hooks';
import { PlayerManager } from 'PlayerManager';
import React from 'react';

export const App: React.FC = () => {
  const networkRecovery = useAppSelector((state) => state.networkRecovery);
  const { CONTROLS = true } = useFeatures();

  return (
    <>
      <PlayerManager />
      {networkRecovery.step !== 'DISABLED' && CONTROLS && <NetworkNotice />}
    </>
  );
};
