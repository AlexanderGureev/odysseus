import { Nullable } from 'types';

export type Channel = {
  id: string;
  playerURI: Nullable<string>;
  iFrame: Nullable<string>;
};

export type Channels = Channel[];
