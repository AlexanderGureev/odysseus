export type CounterWatchingOpts = {
  link: string;
  params: {
    cid: string;
    typ: number;
    tms: string;
    hid: string;
    idc: number;
    idlc: string;
    ver: number;
    type: number;
    view: string;
    fts: string;
  };
};

export type MediascopeCounterResponse = {
  mediascope_counter_watching: CounterWatchingOpts;
};
