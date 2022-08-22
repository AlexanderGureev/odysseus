import { Params, UTMParam } from './types';

const PARAMS_SELECTOR: Record<UTMParam, (p: Params) => any> = {
  utm_source: () => 'player',
  utm_term: ({ term }) => term,
  utm_medium: ({ skinId }) => skinId,
  utm_content: ({ trackId }) => trackId,
};

export class UTMService {
  static buildUTMQueryParams = ({ term, skinId, trackId }: Params): string => {
    const params = Object.keys(PARAMS_SELECTOR).reduce((acc: Record<string, any>, param) => {
      return { ...acc, [param]: PARAMS_SELECTOR[param as UTMParam]({ skinId, trackId, term }) };
    }, {});

    return new URLSearchParams(params).toString();
  };
}
