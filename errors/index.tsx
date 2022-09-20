import '../src/styles/index.css';

import cn from 'classnames';
import { Template } from 'components/ErrorManager/ErrorTemplate';
import { ERROR_TEXT_BY_TYPE } from 'components/ErrorManager/templates';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppThemeBySkin, SkinClass } from 'types';
import { ERROR_CODES, ERROR_ITEM_MAP, ERROR_TYPE } from 'types/errors';
import { v4 } from 'uuid';

import Styles from './index.module.css';

const node = document.getElementById('root');
const root = createRoot(node as HTMLElement);

const sid = v4();
const webVersion = 'unknown';

const App = () => {
  const [skin, setSkin] = useState(SkinClass.DEFAULT);
  const [error, setError] = useState(ERROR_ITEM_MAP[ERROR_CODES.ANONYMOUS_ERROR]);

  const config = ERROR_TEXT_BY_TYPE[error.title]?.({
    isEmbedded: true,
    mailOpts: {
      episodeName: '',
      partnerId: 1788,
      projectId: 19365,
      trackId: 19363,
      projectName: '',
      seasonName: '',
      sid,
      ssid: sid,
      userId: null,
      webVersion,
    },
    theme: skin,
    sharingUrl: '',
  });

  return (
    <div className={cn('wrapper', AppThemeBySkin[skin])}>
      <div className={Styles['input-group']}>
        <select
          defaultValue={skin}
          onChange={(e) => {
            setSkin(e.target.value as SkinClass);
          }}>
          {Object.keys(AppThemeBySkin).map((theme) => (
            <option key={theme} value={theme}>
              {theme}
            </option>
          ))}
        </select>
        <select
          defaultValue={error.title}
          onChange={(e) => {
            setError(ERROR_ITEM_MAP[ERROR_CODES[e.target.value as ERROR_TYPE]]);
          }}>
          {Object.keys(ERROR_CODES).map((title) => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
        </select>
      </div>
      <Template
        config={config}
        error={error}
        ssid={sid}
        skin={skin}
        webVersion={webVersion}
        handleClick={() => {
          return;
        }}
      />
    </div>
  );
};

root.render(<App />);
