import { StreamContext } from 'context';
import { usePlayerConfig } from 'hooks';
import React from 'react';
import { createSource, StreamService, TStreamService } from 'services/StreamService';
import { TSource } from 'services/StreamService/types';
import { getCapabilities } from 'services/StreamService/utils/supports';
import { Nullable } from 'types';

export const StreamProvider = ({ children }: React.PropsWithChildren) => {
  const { config } = usePlayerConfig();
  const [source, set] = React.useState<Nullable<TSource>>(null);
  const service = React.useRef<Nullable<TStreamService>>(null);

  const nextStream = React.useCallback(() => {
    // const stream = service.current?.getStream();
    // if (stream) set(createSource(stream));
  }, []);

  React.useEffect(() => {
    getCapabilities().then((capabilities) => {
      const sources = config?.playlist?.items?.[0]?.streams;

      if (!sources) {
        console.error('streams is undefined');
        return;
      }

      // service.current = StreamService(sources, capabilities);
      // nextStream();
    });
  }, [config, nextStream]);

  return <StreamContext.Provider value={{ source, nextStream }}>{children}</StreamContext.Provider>;
};
