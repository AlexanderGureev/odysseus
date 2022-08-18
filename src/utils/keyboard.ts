export enum SUPPORTED_KEY_CODES {
  'SPACE' = 'Space',
  'ARROW_LEFT' = 'ArrowLeft',
  'ARROW_RIGHT' = 'ArrowRight',
  'ARROW_UP' = 'ArrowUp',
  'ARROW_DOWN' = 'ArrowDown',
  'ESCAPE' = 'Escape',
}

export const KEYBOARD_CODES_LEGACY: Record<SUPPORTED_KEY_CODES, number> = {
  [SUPPORTED_KEY_CODES.SPACE]: 32,
  [SUPPORTED_KEY_CODES.ARROW_LEFT]: 37,
  [SUPPORTED_KEY_CODES.ARROW_UP]: 38,
  [SUPPORTED_KEY_CODES.ARROW_DOWN]: 40,
  [SUPPORTED_KEY_CODES.ARROW_RIGHT]: 39,
  [SUPPORTED_KEY_CODES.ESCAPE]: 27,
};

export const KEYBOARD_CODES_ARRAY_LEGACY = Object.values(KEYBOARD_CODES_LEGACY);
export const KEYBOARD_CODES_ARRAY = Object.values(SUPPORTED_KEY_CODES);

export const isKeySupported = (event: KeyboardEvent): boolean =>
  !!event.code
    ? (KEYBOARD_CODES_ARRAY as string[]).includes(event.code)
    : !!event.keyCode
    ? KEYBOARD_CODES_ARRAY_LEGACY.includes(event.keyCode)
    : false;

export const isKeyPressed = (event: KeyboardEvent, keyName: SUPPORTED_KEY_CODES): boolean =>
  (!!event.code && event.code === keyName) || (!!event.keyCode && event.keyCode === KEYBOARD_CODES_LEGACY[keyName]);
