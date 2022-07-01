import 'video.js';

type TDockOpts = {
  title?: string;
  description?: string;
};

declare module 'video.js' {
  interface VideoJsPlayer {
    eme: () => void;
    dock: (opts: TDockOpts) => void;
    httpSourceSelector: () => void;
  }
}
