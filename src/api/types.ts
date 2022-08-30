import { TConfig } from 'types';

export type NextTrackConfig = Omit<TConfig, 'mediascopeCounter'>;

export type MailData = {
  clientIp?: string;
  subject: string;
  from: string;
  contents: string;
};
