export type InspectStream = {
  url: string;
  protocol: 'HLS' | 'DASH';
};

export type MediaFile = {
  track_id: number;
  streams: InspectStream[];
};
