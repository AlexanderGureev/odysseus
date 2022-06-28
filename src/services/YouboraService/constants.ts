import { AdCategory } from 'server/types';

export const AD_CATEGORY_MAP: { [key in AdCategory]?: string } = {
  [AdCategory.PRE_ROLL]: 'pre',
  [AdCategory.MID_ROLL]: 'mid',
  [AdCategory.PAUSE_ROLL]: 'pause',
  [AdCategory.POST_ROLL]: 'post',
};
