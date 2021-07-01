import React from 'react';
import { YMInitializer } from 'react-yandex-metrika';
import { YMQueryParams, YMService } from './service';

const YMID = 46840146;
const YMOptions = {
  clickmap: true,
  trackLinks: true,
  accurateTrackBounce: true,
  triggerEvent: true,
  webvisor: true,
};

export const YMContainer: React.FC<{ params: Partial<YMQueryParams> }> = ({ params }) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => YMService.init(params), []);

  return <YMInitializer accounts={[YMID]} options={YMOptions} version="2" />;
};
