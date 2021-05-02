/* eslint-disable @typescript-eslint/ban-ts-comment */
// import './publicPath';
import React from 'react';
import ReactDOM from 'react-dom';

import './styles/fonts.css';
import './styles/index.css';

import { App } from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
