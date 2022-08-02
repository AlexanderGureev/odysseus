import { Nullable } from 'types';

export type LocationState = {
  location: Nullable<string>;
  hostname: Nullable<string>;
  isEmbedded: boolean;
};
