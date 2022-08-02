import { QUALITY_MARKS } from 'services/VigoService';

export type PlayerStats = {
  currentTime: number;
  initialBufferTime: number | null;
  bufferTime: number;
  playTimeByQuality: {
    [key in QUALITY_MARKS]: number;
  };
};

export type DemonInitOpts = {
  statURL: string;
  trackId: number;
  referrer: string;
  projectId: number;
  configLoadingTime: number;
  sid: string | null;
  userId: number | null;
  transactionId: number | null;
  skinId: number;
};
