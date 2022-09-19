/* eslint-disable @typescript-eslint/ban-ts-comment */
import './publicPath';
import './styles/index.css';

import { App } from 'App';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { sendEvent, store } from 'store';

// start app
store.dispatch(sendEvent({ type: 'DO_INIT' }));

const node = document.getElementById('root');
const root = createRoot(node as HTMLElement);

root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
