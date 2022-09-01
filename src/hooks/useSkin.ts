import { SkinClass } from 'types';

export const useSkin = () => {
  return window.ODYSSEUS_PLAYER_CONFIG?.features?.skin_theme_class || SkinClass.DEFAULT;
};
