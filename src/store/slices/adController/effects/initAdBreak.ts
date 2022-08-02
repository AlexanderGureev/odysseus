/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { TAdConfig, TAdPointConfig } from 'types/ad';

export type Opts = {
  data: TAdConfig;
  point: TAdPointConfig;
};

export const initAdBreak = ({ data, point }: Opts, { dispatch, services: { adService } }: EffectOpts) => {
  const links = adService.createState(data, point);

  dispatch(
    sendEvent({
      type: 'START_AD_BREAK',
      payload: {
        limit: data.limit,
        links,
        point,
      },
    })
  );
};
