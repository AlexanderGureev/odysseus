import { Params, UTM_PARAMS, UTM_TERMS } from './types';

const PARAMS_LIST = [UTM_PARAMS.UTM_SOURCE, UTM_PARAMS.UTM_MEDIUM, UTM_PARAMS.UTM_CONTENT, UTM_PARAMS.UTM_TERM];

const PARAMS_SELECTOR: Record<UTM_PARAMS, (p: Params) => number | string | UTM_TERMS> = {
  [UTM_PARAMS.UTM_SOURCE]: () => 'player',
  [UTM_PARAMS.UTM_TERM]: ({ term }) => term,
  [UTM_PARAMS.UTM_MEDIUM]: ({ skinId }) => skinId,
  [UTM_PARAMS.UTM_CONTENT]: ({ videoId }) => videoId,
};

export class UTMService {
  static buildUTMQueryParams = ({ term, skinId, videoId }: Params): string => {
    const params = PARAMS_LIST.reduce((obj: Record<string, any>, param) => {
      obj[param] = PARAMS_SELECTOR[param]({ skinId, videoId, term });

      return obj;
    }, {});

    return new URLSearchParams(params).toString();
  };
}
