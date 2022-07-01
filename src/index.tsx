/* eslint-disable @typescript-eslint/ban-ts-comment */
import './publicPath';
import './styles/fonts.css';
import './styles/index.css';

import { ErrorManager } from 'components/ErrorManager';
import { useAppSelector } from 'hooks';
import { AdConfigProvider } from 'providers/AdConfigProvider';
import { StreamProvider } from 'providers/StreamProvider';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { EmbeddedCheckService } from 'services/EmbeddedCheckService';
import { IDBService } from 'services/IDBService';
import { APP_DB_NAME, CollectionName, Indexes } from 'services/IDBService/types';
import { WindowController } from 'services/WindowController';
import { sendEvent, store } from 'store';

import { App } from './App';

// start app
store.dispatch(sendEvent({ type: 'DO_INIT' }));

const node = document.getElementById('root');
const root = createRoot(node as HTMLElement);

const PlayerManager = ({ children }: React.PropsWithChildren) => {
  const step = useAppSelector((state) => state.player.step);

  return (
    <>
      {step === 'RENDER' && children}
      {step === 'PAYWALL' && 'paywall'}
    </>
  );
};

root.render(
  <Provider store={store}>
    <ErrorManager>
      <PlayerManager>APP LOADED</PlayerManager>
    </ErrorManager>
  </Provider>
);

{
  /* <PlayerConfigProvider>
          <FeaturesProvider>
            <AdConfigProvider>
              <StreamProvider>
                <App />
              </StreamProvider>
            </AdConfigProvider>
          </FeaturesProvider>
        </PlayerConfigProvider> */
}
