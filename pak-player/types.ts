export interface TPAKPostmessagePayloadTypes {
  doScreenshot: {
    url: string; // endpoint to send screenshot to
  };
  screenshotDone: {
    success: boolean; // whether PAK has replied 201
    result?: Record<string, unknown>; // API response, if any
    error?: any; // Error object, if any
  };
  testAdvPoint: {
    time: number; // actual timestamp where AD is to be shown
    playTime: number; // seconds before timestamp to play
  };
  adTestShown: never;
  play: never;
  getCurrentTime: never;
  currentTime: {
    value: number;
  };
  started: never;
}
