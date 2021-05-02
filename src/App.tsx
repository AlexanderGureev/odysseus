import React from 'react';
import { getCapabilities } from './utils/supports';
import { Player } from './modules/player';
import { MediatorService } from './modules/mediator';
import { StreamService, createSource, TSource } from './modules/streamService';
import { THEME, ThemeContext } from './context';
import { usePlayerConfig } from './hooks';
import { Nullable } from '../types';

export const App = () => {
  const [source, set] = React.useState<Nullable<TSource>>(null);
  const [config] = usePlayerConfig();

  React.useEffect(() => {
    getCapabilities().then((capabilities) => {
      if (!config?.playlist?.items?.[0]?.streams) {
        console.error('streams is undefined');
        return;
      }

      const streamService = StreamService(config?.playlist?.items?.[0]?.streams, capabilities);

      const selectStream = () => {
        const stream = streamService.getStream();
        if (stream) {
          set(createSource(stream));
        }
      };

      MediatorService.on('change_stream', selectStream);
      selectStream();
    });
  }, [config]);

  // React.useEffect(() => {
  //   setTimeout(() => {
  //     MediatorService.emit("change_stream");
  //   }, 5000);
  // }, []);

  if (!source) return null;

  console.log('selected source - ', source);

  return (
    <ThemeContext.Provider value={THEME.MORETV}>
      <Player source={source} />
    </ThemeContext.Provider>
  );
};
