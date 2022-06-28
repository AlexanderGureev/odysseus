/* eslint-disable @typescript-eslint/ban-ts-comment */
import './publicPath';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from 'store';

import './styles/fonts.css';
import './styles/index.css';

import { App } from './App';
import { EmbeddedCheckService } from 'services/EmbeddedCheckService';
import { ErrorManager } from 'components/ErrorManager';
import { PlayerConfigProvider } from 'providers/PlayerConfigProvider';
import { AdConfigProvider } from 'providers/AdConfigProvider';
import { StreamProvider } from 'providers/StreamProvider';
import { FeaturesProvider } from 'providers/FeaturesProvider';

import { IDBService } from 'services/IDBService';
import { APP_DB_NAME, CollectionName, Indexes } from 'services/IDBService/types';
import { WindowController } from 'services/WindowController';

const sharingUrl = window?.ODYSSEUS_PLAYER_CONFIG?.playlist?.items[0]?.sharing_url;

IDBService.connect(APP_DB_NAME, [
  {
    name: CollectionName.MASTER_WINDOW,
    keyPath: 'key',
  },
  {
    name: CollectionName.EVENTS,
    keyPath: 'timestamp',
    indexes: [
      {
        name: Indexes.BY_STATUS,
        field: 'status',
      },
    ],
  },
])
  .then(() => {
    WindowController.init();
  })
  .catch((e) => {
    console.error('[IDBService] connect failed', e?.message);
  });

const node = document.getElementById('root');
const root = createRoot(node as HTMLElement);

EmbeddedCheckService.getEmbededStatus(sharingUrl).then(() => {
  root.render(
    <Provider store={store}>
      <ErrorManager>
        <PlayerConfigProvider>
          <FeaturesProvider>
            <AdConfigProvider>
              <StreamProvider>
                <App />
                {/* <TestApp /> */}
              </StreamProvider>
            </AdConfigProvider>
          </FeaturesProvider>
        </PlayerConfigProvider>
      </ErrorManager>
    </Provider>
  );
});
