import cn from 'classnames';
import { useAppSelector, useCopy } from 'hooks';
import React, { useRef } from 'react';

import Styles from './index.module.css';

const createEmbeddingLink = (opts: { partnerId: number | null; trackId: number | null }) => {
  const defaultWidth = '964';
  const defaultHeight = '542';

  const URL = `${window.location.origin}/player/${opts.partnerId}/${opts.trackId}`;

  const template =
    '<iframe width="{WIDTH}" height="{HEIGHT}" allowfullscreen allow="encrypted-media;autoplay;fullscreen;clipboard-write" src="{URL}"></iframe>';

  return template
    .replace('{WIDTH}', defaultWidth)
    .replace('{HEIGHT}', defaultHeight)
    .replace('{PARTNER_ID}', `${opts.partnerId}`)
    .replace('{TRACK_ID}', `${opts.trackId}`)
    .replace('{URL}', URL);
};

export const Embedding = () => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { isCopied, isSupported, onCopy } = useCopy();
  const meta = useAppSelector((state) => state.root.meta);

  return (
    <div className={cn(Styles.wrapper)}>
      <div className={Styles.content}>
        <h6 className={Styles.title}>Код вставки плеера</h6>
        <textarea
          className={Styles.textarea}
          ref={inputRef}
          value={createEmbeddingLink({
            partnerId: meta.partnerId,
            trackId: meta.trackId,
          })}
          readOnly
        />
        {isSupported ? (
          <button
            className={cn('copy-btn', isCopied && 'copied', Styles.btn)}
            onClick={() => {
              if (!inputRef.current) return;
              onCopy(inputRef.current.value);
            }}>
            {isCopied ? 'Скопировано' : 'Скопировать'}
          </button>
        ) : (
          <div className="copy-text">Скопировать: CTRL + C</div>
        )}
      </div>
    </div>
  );
};
