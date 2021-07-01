/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { detectAnyAdblocker } from 'just-detect-adblock';

export const checkAdBlockStatus = (): Promise<boolean> => detectAnyAdblocker();
